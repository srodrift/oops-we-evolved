import { causeFromEvent, type RaindropFailureEvent } from "../raindrop/evidence";
import type { CatalogTool, HarnessConfig, ProposalDraft, Rule } from "./types";

export type ProposeInput = {
  parent: HarnessConfig;
  evidence: RaindropFailureEvent;
  catalog: CatalogTool[];
};

export type LlmComplete = (prompt: string) => Promise<string>;

const REQUIRED_RULES = ["use-enabled-fetch-tool", "headline-only"] as const;
const REQUIRED_GUARDRAILS = ["no-fabricated-headline", "require-live-fallback"] as const;

export function deterministicProposal(input: ProposeInput): ProposalDraft {
  const failedTool = input.evidence.span.name;
  const failedError = input.evidence.span.error;
  const cause = causeFromEvent(input.evidence);
  const fallback = input.catalog.find(
    (tool) => tool.purpose === "fetch_brief" && tool.available && tool.name !== failedTool,
  );

  if (!fallback) {
    return {
      tools: input.parent.tools,
      rules: input.parent.rules,
      guardrails: input.parent.guardrails,
      contextPolicy: input.parent.contextPolicy,
      cause,
      rationale: `Raindrop event ${cause.eventId} span ${failedTool} recorded ${failedError.name}: ${failedError.message}. No available fetch_brief fallback.`,
      source: "deterministic",
    };
  }

  const rules: Rule[] = [...input.parent.rules];
  if (!rules.some((rule) => rule.id === "name-the-fallback")) {
    rules.push({
      id: "name-the-fallback",
      text: `Retrieve the brief with ${fallback.name}.`,
    });
  }

  const guardrails = input.parent.guardrails.filter((guardrail) => guardrail.id !== "require-live-fallback");
  guardrails.push({
    id: "require-live-fallback",
    text: `Raindrop span ${failedTool} must not stay enabled. Enable ${fallback.name}.`,
  });

  return {
    tools: input.catalog
      .filter((tool) => tool.purpose === "fetch_brief")
      .map((tool) => ({
        name: tool.name,
        purpose: tool.purpose,
        enabled: tool.name === fallback.name,
      })),
    rules,
    guardrails,
    contextPolicy: {
      ...input.parent.contextPolicy,
      includeToolErrors: true,
      retainFailureEvidence: true,
    },
    cause,
    rationale: `Raindrop event ${cause.eventId} span ${failedTool} recorded ${failedError.name}: ${failedError.message}. Disable ${failedTool} and enable ${fallback.name}.`,
    source: "deterministic",
  };
}

export function parseLlmProposal(raw: string, input: ProposeInput): ProposalDraft | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const body = parsed as Record<string, unknown>;
  const tools = asTools(body.tools);
  const rules = asNamedText(body.rules);
  const guardrails = asNamedText(body.guardrails);
  const contextPolicy = asContextPolicy(body.contextPolicy);
  const rationale = typeof body.rationale === "string" ? body.rationale.trim() : "";
  if (!tools || !rules || !guardrails || !contextPolicy || !rationale) {
    return null;
  }
  if (rules.length > 20 || guardrails.length > 20) {
    return null;
  }

  const enabled = tools.filter((tool) => tool.enabled && tool.purpose === "fetch_brief");
  if (enabled.length !== 1) {
    return null;
  }
  const chosen = enabled[0];
  const catalogTool = input.catalog.find((tool) => tool.name === chosen.name && tool.purpose === "fetch_brief");
  if (!catalogTool?.available || chosen.name === input.evidence.span.name) {
    return null;
  }
  if (!REQUIRED_RULES.every((id) => rules.some((rule) => rule.id === id))) {
    return null;
  }
  if (!REQUIRED_GUARDRAILS.every((id) => guardrails.some((guardrail) => guardrail.id === id))) {
    return null;
  }
  if (!contextPolicy.includeToolErrors || !contextPolicy.retainFailureEvidence) {
    return null;
  }
  if (enabled.some((tool) => tool.name === input.evidence.span.name)) {
    return null;
  }

  return {
    tools,
    rules,
    guardrails,
    contextPolicy,
    cause: causeFromEvent(input.evidence),
    rationale: `Raindrop event ${input.evidence.eventId} span ${input.evidence.span.name} recorded ${input.evidence.span.error.name}: ${input.evidence.span.error.message}. ${rationale}`,
    source: "llm",
  };
}

export async function proposeHarness(
  input: ProposeInput,
  options?: { allowLlm?: boolean; complete?: LlmComplete },
): Promise<ProposalDraft> {
  if (options?.allowLlm !== false) {
    try {
      const raw = options?.complete ? await options.complete(buildPrompt(input)) : await completeWithOpenAI(input);
      if (raw) {
        const parsed = parseLlmProposal(raw, input);
        if (parsed) {
          return parsed;
        }
      }
    } catch {
      // Deterministic proposer is the demo path when the model is missing or invalid.
    }
  }
  return deterministicProposal(input);
}

function buildPrompt(input: ProposeInput): string {
  return JSON.stringify({
    raindropEvent: input.evidence,
    parent: input.parent,
    catalog: input.catalog,
  });
}

async function completeWithOpenAI(input: ProposeInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You revise an agent harness because of the Raindrop tool span in the user payload.",
          "The failed tool is raindropEvent.span.name. Do not enable that tool.",
          "Cite raindropEvent.eventId and raindropEvent.span.error in the rationale.",
          "Reply with JSON only, shaped as { tools, rules, guardrails, contextPolicy, rationale }.",
          "tools items are { name, purpose, enabled }. purpose is fetch_brief.",
          "rules and guardrails items are { id, text }.",
          "Keep rule ids use-enabled-fetch-tool and headline-only.",
          "Keep guardrail id no-fabricated-headline and add guardrail id require-live-fallback.",
          "contextPolicy is { includeToolErrors, maxContextChars, retainFailureEvidence }.",
          "Set includeToolErrors and retainFailureEvidence to true.",
          "Enable exactly one fetch_brief tool. It must be catalog-available and must not be the tool that threw.",
        ].join(" "),
      },
      { role: "user", content: buildPrompt(input) },
    ],
  });
  return completion.choices[0]?.message?.content ?? null;
}

function asTools(value: unknown): ProposalDraft["tools"] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const tools: ProposalDraft["tools"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const tool = item as Record<string, unknown>;
    if (typeof tool.name !== "string" || tool.purpose !== "fetch_brief" || typeof tool.enabled !== "boolean") {
      return null;
    }
    tools.push({ name: tool.name, purpose: "fetch_brief", enabled: tool.enabled });
  }
  return tools;
}

function asNamedText(value: unknown): { id: string; text: string }[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: { id: string; text: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== "string" || typeof entry.text !== "string" || !entry.id || !entry.text) {
      return null;
    }
    items.push({ id: entry.id, text: entry.text });
  }
  return items;
}

function asContextPolicy(value: unknown): ProposalDraft["contextPolicy"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const policy = value as Record<string, unknown>;
  if (typeof policy.includeToolErrors !== "boolean" || typeof policy.retainFailureEvidence !== "boolean") {
    return null;
  }
  if (typeof policy.maxContextChars !== "number" || !Number.isFinite(policy.maxContextChars) || policy.maxContextChars <= 0) {
    return null;
  }
  return {
    includeToolErrors: policy.includeToolErrors,
    maxContextChars: policy.maxContextChars,
    retainFailureEvidence: policy.retainFailureEvidence,
  };
}
