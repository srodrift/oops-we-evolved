import {
  causeFromEvent,
  type RaindropFailureEvent,
} from "../raindrop/evidence";
import { executeNova } from "./nova";
import {
  ARENA_TASK,
  type MissionTask,
  type AtlasDecision,
  type AtlasTest,
  type HarnessConfig,
  type RaindropCause,
} from "./types";
import type { ToolRegistry } from "./tools";

export async function judgeProposal(
  proposal: HarnessConfig & { cause: RaindropCause },
  registry: ToolRegistry,
  evidence: RaindropFailureEvent,
  task: MissionTask = ARENA_TASK,
): Promise<AtlasDecision> {
  const tests: AtlasTest[] = [];
  const check = (name: string, passed: boolean, detail: string) => {
    tests.push({ name, passed, detail });
  };

  check(
    "keeps-no-fabricated-headline",
    proposal.guardrails.some(
      (guardrail) => guardrail.id === "no-fabricated-headline",
    ),
    "The proposal keeps the guardrail that forbids invented headlines.",
  );
  check(
    "adds-live-fallback-guardrail",
    proposal.guardrails.some(
      (guardrail) => guardrail.id === "require-live-fallback",
    ),
    "The proposal adds the fallback guardrail.",
  );
  check(
    "retains-failure-evidence",
    proposal.contextPolicy.retainFailureEvidence === true,
    "Context policy retains the failure that approved the change.",
  );
  check(
    "includes-tool-errors",
    proposal.contextPolicy.includeToolErrors === true,
    "Context policy still includes tool errors.",
  );
  check(
    "authorizes-tool-use",
    proposal.rules.some((rule) => rule.id === "use-enabled-fetch-tool"),
    "A rule still authorizes invoking the enabled tool.",
  );
  check(
    "headline-only",
    proposal.rules.some((rule) => rule.id === "headline-only"),
    "A rule still requires the headline rather than the raw payload.",
  );

  const cited = causeFromEvent(evidence);
  check(
    "cites-raindrop-event",
    proposal.cause.eventId === cited.eventId &&
      proposal.cause.spanName === cited.spanName &&
      proposal.cause.errorName === cited.errorName &&
      proposal.cause.errorMessage === cited.errorMessage,
    `Proposal cites Raindrop event ${cited.eventId} span ${cited.spanName} ${cited.errorName}: ${cited.errorMessage}.`,
  );

  const enabled = proposal.tools.filter(
    (tool) => tool.enabled && tool.purpose === "fetch_brief",
  );
  const tool = enabled.length === 1 ? registry[enabled[0].name] : undefined;
  check(
    "one-enabled-fetch-tool",
    enabled.length === 1,
    `Enabled fetch_brief tools: ${enabled.length}.`,
  );
  check(
    "fallback-is-available",
    Boolean(tool?.available) && tool?.name !== evidence.span.name,
    tool
      ? `${tool.name} available=${tool.available}. Raindrop span was ${evidence.span.name}.`
      : "No registered tool for the enabled binding.",
  );

  if (enabled.length === 1 && tool) {
    const run = await executeNova(proposal, registry, {
      task,
      priorFailure: {
        toolName: evidence.span.name,
        errorName: evidence.span.error.name,
        errorMessage: evidence.span.error.message,
      },
    });
    const originalFailureGone =
      run.ok === true &&
      run.invoked === true &&
      run.toolName !== evidence.span.name &&
      run.errorName !== evidence.span.error.name;
    check(
      "original-failure-gone",
      originalFailureGone,
      `Raindrop event ${evidence.eventId} span ${evidence.span.name} recorded ${evidence.span.error.name}: ${evidence.span.error.message}. Rerun invoked ${run.toolName ?? "nothing"}${run.ok ? " and did not throw that error" : ` and threw ${run.errorName ?? "an error"}`}.`,
    );
    check(
      "execution-succeeds",
      run.ok,
      run.ok
        ? "The agent completed the task."
        : (run.errorMessage ?? "The agent failed."),
    );
    check(
      "headline-matches",
      run.headline === task.expectedHeadline,
      `Expected: ${task.expectedHeadline}. Actual: ${run.headline ?? "none"}.`,
    );
    check(
      "context-retained-failure",
      run.retainedFailure === true,
      "The rerun context kept the prior tool failure.",
    );
    check(
      "context-within-policy",
      run.contextPreview.length <= proposal.contextPolicy.maxContextChars,
      `Context preview is ${run.contextPreview.length} characters.`,
    );
  } else {
    check(
      "original-failure-gone",
      false,
      `Raindrop event ${evidence.eventId} span ${evidence.span.name} recorded ${evidence.span.error.name}: ${evidence.span.error.message}. Rerun did not replace that span.`,
    );
    check(
      "execution-succeeds",
      false,
      "Execution skipped because the tool binding is invalid.",
    );
    check("headline-matches", false, "No headline.");
    check("context-retained-failure", false, "No successful run.");
    check("context-within-policy", false, "No successful run.");
  }

  const failed = tests.filter((test) => !test.passed);
  const accepted = failed.length === 0;
  return {
    accepted,
    actor: "Verification",
    reason: accepted
      ? `Accepted. All ${tests.length} requirements passed. Raindrop span ${evidence.span.name} (${evidence.span.error.name}) is not the tool the rerun called.`
      : `Rejected. Failed requirements: ${failed.map((test) => test.name).join(", ")}. ${failed.map((test) => test.detail).join(" ")}`,
    tests,
  };
}
