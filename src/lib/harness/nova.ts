import { ARENA_TASK, type HarnessConfig, type NovaRun } from "./types";
import type { ToolRegistry } from "./tools";

export type NovaContext = {
  priorFailure: { toolName: string; errorName: string; errorMessage: string } | null;
};

export async function executeNova(
  config: HarnessConfig,
  registry: ToolRegistry,
  context: NovaContext,
): Promise<NovaRun> {
  const started = Date.now();
  const base = {
    taskId: ARENA_TASK.id,
    configVersion: config.version,
    headline: null,
    errorName: null,
    errorMessage: null,
    stack: null,
    retainedFailure: false,
    guardrailHeld: config.guardrails.some((guardrail) => guardrail.id === "no-fabricated-headline"),
  };

  const contextPreview = JSON.stringify({
    taskId: ARENA_TASK.id,
    rules: config.rules.map((rule) => rule.id),
    priorFailure: config.contextPolicy.retainFailureEvidence ? context.priorFailure : null,
  }).slice(0, config.contextPolicy.maxContextChars);

  const retainedFailure = config.contextPolicy.retainFailureEvidence && context.priorFailure !== null;

  const finish = (patch: Partial<NovaRun> & Pick<NovaRun, "ok" | "invoked">): NovaRun => ({
    ...base,
    toolName: null,
    durationMs: Date.now() - started,
    contextPreview,
    retainedFailure,
    ...patch,
  });

  if (!config.rules.some((rule) => rule.id === "use-enabled-fetch-tool")) {
    return finish({
      ok: false,
      invoked: false,
      errorName: "HarnessRuleError",
      errorMessage: "No rule authorizes tool use.",
    });
  }

  const enabled = config.tools.filter((tool) => tool.enabled && tool.purpose === "fetch_brief");
  if (enabled.length !== 1) {
    return finish({
      ok: false,
      invoked: false,
      errorName: "HarnessToolError",
      errorMessage: `Expected one enabled fetch_brief tool, found ${enabled.length}.`,
    });
  }

  const binding = enabled[0];
  const namedFallback = config.rules.find((rule) => rule.id === "name-the-fallback");
  if (namedFallback && !namedFallback.text.includes(binding.name)) {
    return finish({
      ok: false,
      invoked: false,
      toolName: binding.name,
      errorName: "HarnessRuleError",
      errorMessage: `Rule name-the-fallback does not name the enabled tool ${binding.name}.`,
    });
  }

  const implementation = registry[binding.name];
  if (!implementation) {
    return finish({
      ok: false,
      invoked: false,
      toolName: binding.name,
      errorName: "HarnessToolError",
      errorMessage: `Tool ${binding.name} is not registered.`,
    });
  }

  try {
    const output = await implementation.invoke({ taskId: ARENA_TASK.id });
    const headlineOnly = config.rules.some((rule) => rule.id === "headline-only");
    return finish({
      ok: true,
      invoked: true,
      toolName: binding.name,
      headline: headlineOnly ? output.headline : JSON.stringify(output),
    });
  } catch (error) {
    const toolError = error instanceof Error ? error : new Error(String(error));
    const message = config.contextPolicy.includeToolErrors
      ? toolError.message
      : "[redacted by context policy]";
    return finish({
      ok: false,
      invoked: true,
      toolName: binding.name,
      errorName: toolError.name,
      errorMessage: message,
      stack: toolError.stack?.split("\n").slice(0, 6).join("\n") ?? null,
    });
  }
}
