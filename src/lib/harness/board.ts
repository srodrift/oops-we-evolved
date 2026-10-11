import type { RaindropFailureEvent } from "../raindrop/evidence";
import type {
  AtlasTest,
  CycleReport,
  CycleStep,
  Diagnosis,
  Guardrail,
  HarnessConfig,
  Rule,
  ToolBinding,
} from "./types";

export type HarnessColumn = {
  versionLabel: string;
  tools: ToolBinding[];
  rules: Rule[];
  guardrails: Guardrail[];
};

export type Board = {
  ran: boolean;
  banner: string | null;
  nova: {
    waiting: string;
    call: string | null;
    errorName: string | null;
    errorMessage: string | null;
    invoked: boolean | null;
    rerun: string | null;
  };
  glitch: {
    waiting: string;
    summary: string | null;
    raindrop: string | null;
  };
  morph: {
    waiting: string;
    proposer: string | null;
    rationale: string | null;
    v1: HarnessColumn;
    v2: HarnessColumn | null;
    v2State: "empty" | "proposed" | "approved";
  };
  atlas: {
    waiting: string;
    verdict: string | null;
    saved: string | null;
    passed: number;
    failed: number;
    resolution: string | null;
    tests: Array<{ label: string; passed: boolean }>;
  };
};

const TEST_LABELS: Record<string, string> = {
  "keeps-no-fabricated-headline": "Keeps the no-fake-headline guardrail",
  "adds-live-fallback-guardrail": "Adds the live-fallback guardrail",
  "retains-failure-evidence": "Keeps the failure in context",
  "includes-tool-errors": "Still records tool errors",
  "authorizes-tool-use": "A rule authorizes the tool call",
  "headline-only": "Returns the headline only",
  "one-enabled-fetch-tool": "Exactly one fetch tool is on",
  "fallback-is-available": "That tool is available",
  "execution-succeeds": "Live rerun succeeded",
  "headline-matches": "Headline matches the archive",
  "context-retained-failure": "Rerun context kept the failure",
  "context-within-policy": "Context stayed inside the size cap",
  "cites-raindrop-event": "Mutation cites the Raindrop event",
  "original-failure-gone": "Original Raindrop failure is gone",
};

export function toBoard(seed: HarnessConfig, report: CycleReport | null): Board {
  const v1 = columnFromConfig(seed, `Harness v${seed.version}`);
  if (!report) {
    return waitingBoard(v1);
  }

  const thrown = evidenceRecord(report, 2);
  const investigation = readInvestigation(step(report, 3)?.evidence);
  const proposal = evidenceRecord(report, 4);
  const decision = readDecision(step(report, 5)?.evidence);
  const saved = evidenceRecord(report, 6);
  const rerun = evidenceRecord(report, 7);
  const approved = saved?.status === "saved" ? readColumn(saved.evidence, "Approved") : null;
  const proposed = readColumn(proposal?.evidence, "Proposal");
  const v2 = approved ?? (proposal?.status === "proposed" ? proposed : null);

  const errorName = stringField(thrown?.evidence, "errorName");
  const errorMessage = stringField(thrown?.evidence, "errorMessage");
  const invoked = booleanField(thrown?.evidence, "invoked");
  const toolName = stringField(thrown?.evidence, "toolName");
  const headline = stringField(rerun?.evidence, "headline");
  const rerunTool = stringField(rerun?.evidence, "toolName");
  const loadedVersion = numberField(rerun?.evidence, "loadedVersion");
  const savedVersion = numberField(saved?.evidence, "version") ?? report.approvedVersion;
  const tests = decision?.tests.map((test) => ({
    label: TEST_LABELS[test.name] ?? test.detail,
    passed: test.passed,
  })) ?? [];

  const novaFailed = thrown?.status === "failure" && invoked === true;
  const rerunOk = rerun?.status === "success" && headline;

  return {
    ran: true,
    banner: banner({ novaFailed, rerunOk, headline, savedVersion, accepted: decision?.accepted ?? false }),
    nova: {
      waiting: "NOVA calls the one enabled tool on harness v1.",
      call: novaFailed
        ? `Called ${toolName ?? "the enabled tool"} on harness v1.`
        : (step(report, 1)?.detail ?? "NOVA did not complete v1."),
      errorName,
      errorMessage,
      invoked,
      rerun: rerunOk
        ? `Loaded harness v${loadedVersion ?? savedVersion}. ${rerunTool} returned ${headline}.`
        : rerun?.status === "skipped"
          ? "NOVA did not rerun. No approved harness was saved."
          : null,
    },
    glitch: {
      waiting: "GLITCH diagnoses the Raindrop span.",
      summary: investigation?.diagnosis.summary ?? null,
      raindrop: investigation ? raindropCopy(investigation.raindrop) : null,
    },
    morph: {
      waiting: "MORPH writes the next harness from that evidence.",
      proposer: proposerCopy(stringField(proposal?.evidence, "source")),
      rationale: stringField(proposal?.evidence, "rationale"),
      v1,
      v2: v2?.column ?? null,
      v2State: approved ? "approved" : v2 ? "proposed" : "empty",
    },
    atlas: {
      waiting: "ATLAS runs the proposal before anything is saved.",
      verdict: decision ? (decision.accepted ? "Accepted" : "Rejected") : null,
      saved: savedLine(saved?.status ?? null, saved?.evidence, savedVersion),
      passed: tests.filter((test) => test.passed).length,
      failed: tests.filter((test) => !test.passed).length,
      resolution: decision?.tests.find((test) => test.name === "original-failure-gone")?.detail ?? null,
      tests,
    },
  };
}

function waitingBoard(v1: HarnessColumn): Board {
  return {
    ran: false,
    banner: null,
    nova: {
      waiting: "NOVA calls the one enabled tool on harness v1.",
      call: null,
      errorName: null,
      errorMessage: null,
      invoked: null,
      rerun: null,
    },
    glitch: {
      waiting: "GLITCH diagnoses the Raindrop span.",
      summary: null,
      raindrop: null,
    },
    morph: {
      waiting: "MORPH writes the next harness from that evidence.",
      proposer: null,
      rationale: null,
      v1,
      v2: null,
      v2State: "empty",
    },
    atlas: {
      waiting: "ATLAS runs the proposal before anything is saved.",
      verdict: null,
      saved: null,
      passed: 0,
      failed: 0,
      resolution: null,
      tests: [],
    },
  };
}

function columnFromConfig(config: HarnessConfig, versionLabel: string): HarnessColumn {
  return {
    versionLabel,
    tools: config.tools,
    rules: config.rules,
    guardrails: config.guardrails,
  };
}

function step(report: CycleReport, index: CycleStep["index"]): CycleStep | undefined {
  return report.steps.find((item) => item.index === index);
}

function evidenceRecord(report: CycleReport, index: CycleStep["index"]): { status: CycleStep["status"]; evidence: unknown } | null {
  const found = step(report, index);
  return found ? { status: found.status, evidence: found.evidence } : null;
}

function readColumn(evidence: unknown, prefix: string): { column: HarnessColumn } | null {
  const record = asRecord(evidence);
  if (!record) {
    return null;
  }
  const tools = readTools(record.tools);
  const rules = readNamed(record.rules);
  const guardrails = readNamed(record.guardrails);
  const version = typeof record.version === "number" ? record.version : null;
  if (!tools || !rules || !guardrails || version === null) {
    return null;
  }
  return {
    column: {
      versionLabel: `${prefix} v${version}`,
      tools,
      rules,
      guardrails,
    },
  };
}

function readInvestigation(evidence: unknown): { diagnosis: Diagnosis; raindrop: RaindropFailureEvent } | null {
  const record = asRecord(evidence);
  const diagnosis = asRecord(record?.diagnosis);
  const raindrop = readRaindropEvent(record?.raindrop);
  if (!diagnosis || typeof diagnosis.summary !== "string" || typeof diagnosis.unavailableTool !== "string" || !raindrop) {
    return null;
  }
  if (diagnosis.unavailableTool !== raindrop.span.name) {
    return null;
  }
  return {
    diagnosis: {
      eventId: raindrop.eventId,
      unavailableTool: diagnosis.unavailableTool,
      errorName: raindrop.span.error.name,
      errorMessage: raindrop.span.error.message,
      summary: diagnosis.summary,
    },
    raindrop,
  };
}

function readRaindropEvent(value: unknown): RaindropFailureEvent | null {
  const record = asRecord(value);
  const span = asRecord(record?.span);
  const spanError = asRecord(span?.error);
  const diagnostic = asRecord(record?.diagnostic);
  const diagnosticProperties = asRecord(diagnostic?.properties);
  if (!record || !span || !spanError || !diagnostic || !diagnosticProperties) {
    return null;
  }
  if (typeof record.eventId !== "string" || typeof span.name !== "string") {
    return null;
  }
  if (typeof spanError.name !== "string" || typeof spanError.message !== "string") {
    return null;
  }
  if (typeof record.delivered !== "boolean") {
    return null;
  }
  return record as unknown as RaindropFailureEvent;
}

function readDecision(evidence: unknown): { accepted: boolean; tests: AtlasTest[] } | null {
  const record = asRecord(evidence);
  if (!record || typeof record.accepted !== "boolean" || !Array.isArray(record.tests)) {
    return null;
  }
  const tests: AtlasTest[] = [];
  for (const item of record.tests) {
    const test = asRecord(item);
    if (!test || typeof test.name !== "string" || typeof test.passed !== "boolean" || typeof test.detail !== "string") {
      return null;
    }
    tests.push({ name: test.name, passed: test.passed, detail: test.detail });
  }
  return { accepted: record.accepted, tests };
}

function readTools(value: unknown): ToolBinding[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const tools: ToolBinding[] = [];
  for (const item of value) {
    const tool = asRecord(item);
    if (!tool || typeof tool.name !== "string" || tool.purpose !== "fetch_brief" || typeof tool.enabled !== "boolean") {
      return null;
    }
    tools.push({ name: tool.name, purpose: "fetch_brief", enabled: tool.enabled });
  }
  return tools;
}

function readNamed(value: unknown): Array<{ id: string; text: string }> | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: Array<{ id: string; text: string }> = [];
  for (const item of value) {
    const entry = asRecord(item);
    if (!entry || typeof entry.id !== "string" || typeof entry.text !== "string") {
      return null;
    }
    items.push({ id: entry.id, text: entry.text });
  }
  return items;
}

function raindropCopy(event: RaindropFailureEvent): string {
  const span = `Event ${event.eventId}. Span ${event.span.name} recorded ${event.span.error.name}: ${event.span.error.message}.`;
  if (event.delivered) {
    return `${span} Sent to Raindrop.`;
  }
  if (event.sendError) {
    return `${span} Raindrop send failed. ${event.sendError}`;
  }
  return `${span} Held locally. No Raindrop write key.`;
}

function proposerCopy(source: string | null): string | null {
  if (source === "llm") {
    return "OpenAI proposer.";
  }
  if (source === "deterministic") {
    return "Deterministic proposer.";
  }
  return null;
}

function savedLine(status: CycleStep["status"] | null, evidence: unknown, version: number | null): string | null {
  if (status === "skipped") {
    return "Nothing saved.";
  }
  if (status !== "saved" || version === null) {
    return null;
  }
  const record = asRecord(evidence);
  const store = record && typeof record.store === "string" ? record.store : null;
  const location = record && typeof record.location === "string" ? record.location : null;
  if (store === "mongodb") {
    return `Saved version ${version} to MongoDB ${location ?? "morph.harness_versions"}.`;
  }
  if (store === "file") {
    return `Saved version ${version} to ${location ?? "data/harness-versions.json"}.`;
  }
  if (store === "memory") {
    return `Saved version ${version} in memory.`;
  }
  return `Saved version ${version}.`;
}

function banner(input: {
  novaFailed: boolean;
  rerunOk: string | null | boolean;
  headline: string | null;
  savedVersion: number | null;
  accepted: boolean;
}): string | null {
  if (input.novaFailed && input.rerunOk && input.headline && input.savedVersion !== null) {
    return `Harness v1 threw. Approved v${input.savedVersion} was saved. The rerun returned ${input.headline}.`;
  }
  if (input.novaFailed && !input.accepted) {
    return "Harness v1 threw. ATLAS rejected the proposal. Nothing was saved.";
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function stringField(evidence: unknown, key: string): string | null {
  const record = asRecord(evidence);
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function booleanField(evidence: unknown, key: string): boolean | null {
  const record = asRecord(evidence);
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

function numberField(evidence: unknown, key: string): number | null {
  const record = asRecord(evidence);
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}
