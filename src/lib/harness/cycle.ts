import { judgeProposal } from "./atlas";
import { investigateFailure } from "./glitch";
import { proposeHarness } from "./morph";
import { executeNova } from "./nova";
import { seedConfig } from "./seed";
import type { HarnessStore } from "./store";
import {
  catalogFromRegistry,
  createDefaultRegistry,
  type ToolRegistry,
} from "./tools";
import {
  ARENA_TASK,
  toHarnessConfig,
  type MissionTask,
  type CycleReport,
  type CycleStep,
  type HarnessConfig,
  type HarnessVersionRecord,
} from "./types";
import { createRaindropClient, type RaindropClient } from "../raindrop/trace";

export type CycleOptions = {
  task?: MissionTask;
  registry?: ToolRegistry;
  store?: HarnessStore;
  raindrop?: RaindropClient;
  allowLlm?: boolean;
  parent?: HarnessConfig;
};

export async function runEvolutionCycle(
  options: CycleOptions = {},
): Promise<CycleReport> {
  const task = options.task ?? ARENA_TASK;
  const registry = options.registry ?? createDefaultRegistry();
  const store = options.store;
  if (!store) {
    throw new Error(
      "runEvolutionCycle requires a store. Use createDefaultStore() at the boundary.",
    );
  }
  const raindrop = options.raindrop ?? createRaindropClient();
  const parent = options.parent ?? seedConfig();
  const catalog = catalogFromRegistry(registry);

  const firstRun = await executeNova(parent, registry, {
    priorFailure: null,
    task,
  });
  const steps: CycleStep[] = [
    {
      index: 1,
      actor: "Agent",
      title: "Execute the task with harness v1",
      status: "failure",
      detail: firstRun.ok
        ? `The agent unexpectedly succeeded with ${firstRun.toolName}.`
        : `The agent ran harness v${parent.version} and failed.`,
      evidence: {
        configVersion: firstRun.configVersion,
        task: task.instruction,
        toolName: firstRun.toolName,
        invoked: firstRun.invoked,
        ok: firstRun.ok,
        rules: parent.rules,
        tools: parent.tools,
      },
    },
    {
      index: 2,
      actor: "Agent",
      title: "Unavailable tool is invoked and throws",
      status: firstRun.invoked && !firstRun.ok ? "failure" : "skipped",
      detail:
        firstRun.invoked && firstRun.errorName
          ? `${firstRun.toolName} threw ${firstRun.errorName}: ${firstRun.errorMessage}`
          : "The dead tool was not invoked.",
      evidence: {
        invoked: firstRun.invoked,
        toolName: firstRun.toolName,
        errorName: firstRun.errorName,
        errorMessage: firstRun.errorMessage,
        stack: firstRun.stack,
        durationMs: firstRun.durationMs,
        guardrailHeld: firstRun.guardrailHeld,
      },
    },
  ];

  if (
    firstRun.ok ||
    !firstRun.invoked ||
    !firstRun.toolName ||
    !firstRun.errorName ||
    !firstRun.errorMessage
  ) {
    steps.push(
      skippedInvestigation(),
      skippedProposal(),
      skippedAtlas(),
      skippedSave(store.kind),
      skippedRerun(),
    );
    return { task, store: store.kind, approvedVersion: null, steps };
  }

  const investigation = await investigateFailure(firstRun, raindrop);
  steps.push({
    index: 3,
    actor: "Raindrop",
    title: "Diagnose the Raindrop span",
    status: "recorded",
    detail: investigation.raindrop.delivered
      ? `${investigation.diagnosis.summary} Sent to Raindrop.`
      : `${investigation.diagnosis.summary} Held locally${investigation.raindrop.sendError ? `: ${investigation.raindrop.sendError}` : ". No Raindrop write key."}`,
    evidence: investigation,
  });

  const draft = await proposeHarness(
    { parent, evidence: investigation.raindrop, catalog },
    { allowLlm: options.allowLlm },
  );
  const latest = await store.loadLatest();
  const proposal: HarnessConfig & Pick<typeof draft, "cause"> = {
    version: Math.max(parent.version, latest?.version ?? 0) + 1,
    parentVersion: parent.version,
    tools: draft.tools,
    rules: draft.rules,
    guardrails: draft.guardrails,
    contextPolicy: draft.contextPolicy,
    cause: draft.cause,
  };
  steps.push({
    index: 4,
    actor: "Harness Repair",
    title: `Propose harness v${proposal.version}`,
    status: "proposed",
    detail: `${draft.source === "llm" ? "LLM" : "Deterministic"} proposer: ${draft.rationale}`,
    evidence: {
      source: draft.source,
      rationale: draft.rationale,
      cause: draft.cause,
      version: proposal.version,
      parentVersion: proposal.parentVersion,
      tools: proposal.tools,
      rules: proposal.rules,
      guardrails: proposal.guardrails,
      contextPolicy: proposal.contextPolicy,
    },
  });

  const decision = await judgeProposal(
    proposal,
    registry,
    investigation.raindrop,
    task,
  );
  steps.push({
    index: 5,
    actor: "Verification",
    title: "Test and accept or reject the proposal",
    status: decision.accepted ? "accepted" : "rejected",
    detail: decision.reason,
    evidence: decision,
  });

  if (!decision.accepted) {
    steps.push(skippedSave(store.kind), skippedRerun());
    return { task, store: store.kind, approvedVersion: null, steps };
  }

  const record: HarnessVersionRecord = {
    version: proposal.version,
    parentVersion: proposal.parentVersion,
    tools: proposal.tools,
    rules: proposal.rules,
    guardrails: proposal.guardrails,
    contextPolicy: proposal.contextPolicy,
    cause: proposal.cause,
    evidence: investigation,
    decision,
    createdAt: new Date().toISOString(),
  };
  await store.save(record);
  const loaded = await store.loadLatest();
  steps.push({
    index: 6,
    actor: "Verification",
    title: "Persist the approved harness",
    status: loaded?.version === proposal.version ? "saved" : "failure",
    detail:
      loaded?.version === proposal.version
        ? `Saved harness v${loaded.version} to ${storeLabel(store.kind)}.`
        : "The store did not return the approved version.",
    evidence: {
      store: store.kind,
      location:
        store.kind === "mongodb"
          ? "morph.harness_versions"
          : store.kind === "file"
            ? "data/harness-versions.json"
            : "memory",
      version: loaded?.version ?? null,
      tools: loaded?.tools ?? null,
      rules: loaded?.rules ?? null,
      guardrails: loaded?.guardrails ?? null,
      contextPolicy: loaded?.contextPolicy ?? null,
      createdAt: loaded?.createdAt ?? null,
    },
  });

  if (!loaded || loaded.version !== proposal.version) {
    steps.push(skippedRerun());
    return { task, store: store.kind, approvedVersion: null, steps };
  }

  const second = await executeNova(toHarnessConfig(loaded), registry, {
    task,
    priorFailure: {
      toolName: loaded.evidence.raindrop.span.name,
      errorName: loaded.evidence.raindrop.span.error.name,
      errorMessage: loaded.evidence.raindrop.span.error.message,
    },
  });
  steps.push({
    index: 7,
    actor: "Agent",
    title: "Load the approved harness and run again",
    status: second.ok ? "success" : "failure",
    detail: second.ok
      ? `Harness v${second.configVersion} returned ${second.headline} via ${second.toolName}.`
      : `Rerun failed: ${second.errorMessage ?? "unknown error"}.`,
    evidence: {
      loadedVersion: second.configVersion,
      toolName: second.toolName,
      invoked: second.invoked,
      ok: second.ok,
      headline: second.headline,
      retainedFailure: second.retainedFailure,
      contextPreview: second.contextPreview,
    },
  });

  return {
    task,
    store: store.kind,
    approvedVersion: second.ok ? loaded.version : null,
    steps,
  };
}

function storeLabel(kind: HarnessStore["kind"]): string {
  if (kind === "mongodb") {
    return "MongoDB Atlas (morph.harness_versions)";
  }
  if (kind === "file") {
    return "data/harness-versions.json";
  }
  return "memory";
}

function skippedInvestigation(): CycleStep {
  return {
    index: 3,
    actor: "Raindrop",
    title: "Investigate the failure",
    status: "skipped",
    detail:
      "Failure diagnosis did not run because v1 did not throw from an invoked tool.",
    evidence: null,
  };
}

function skippedProposal(): CycleStep {
  return {
    index: 4,
    actor: "Harness Repair",
    title: "Propose the next harness",
    status: "skipped",
    detail: "Harness repair did not propose a change.",
    evidence: null,
  };
}

function skippedAtlas(): CycleStep {
  return {
    index: 5,
    actor: "Verification",
    title: "Test and accept or reject the proposal",
    status: "skipped",
    detail: "Verification had no proposal to test.",
    evidence: null,
  };
}

function skippedSave(kind: HarnessStore["kind"]): CycleStep {
  return {
    index: 6,
    actor: "Verification",
    title: "Persist the approved harness",
    status: "skipped",
    detail: `Nothing was written to ${storeLabel(kind)}.`,
    evidence: { store: kind },
  };
}

function skippedRerun(): CycleStep {
  return {
    index: 7,
    actor: "Agent",
    title: "Load the approved harness and run again",
    status: "skipped",
    detail: "The agent did not rerun because no approved harness was saved.",
    evidence: null,
  };
}
