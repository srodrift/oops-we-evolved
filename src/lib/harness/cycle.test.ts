import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { judgeProposal } from "./atlas";
import { runEvolutionCycle } from "./cycle";
import { investigateFailure } from "./glitch";
import { createFileStore } from "./file-store";
import { createMemoryStore } from "./memory-store";
import { deterministicProposal, proposeHarness } from "./morph";
import { executeNova } from "./nova";
import { seedConfig } from "./seed";
import { buildFailureEvent, diagnoseFromEvidence } from "../raindrop/evidence";
import { createRaindropClient } from "../raindrop/trace";
import { catalogFromRegistry, createDefaultRegistry, invokeGroundArchive, invokeOrbitalUplink, type ToolRegistry } from "./tools";
import { ARENA_TASK } from "./types";

test("orbital_uplink throws when it is actually invoked", async () => {
  await assert.rejects(
    () => invokeOrbitalUplink({ taskId: ARENA_TASK.id }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, "ToolUnavailableError");
      assert.match(error.message, /offline/);
      assert.match(error.stack ?? "", /invokeOrbitalUplink/);
      return true;
    },
  );
});

test("evolution cycle fails v1, accepts a fallback, persists v2, and reruns clean", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "morph-cycle-"));
  const filePath = path.join(directory, "harness-versions.json");
  const store = createFileStore(filePath);
  let orbitalCalls = 0;
  let archiveCalls = 0;
  const registry = instrument(createDefaultRegistry(), {
    onOrbital: () => {
      orbitalCalls += 1;
    },
    onArchive: () => {
      archiveCalls += 1;
    },
  });

  try {
    const report = await runEvolutionCycle({
      registry,
      store,
      allowLlm: false,
      raindrop: createRaindropClient({ NODE_ENV: "test" }),
    });

    assert.equal(orbitalCalls, 1);
    assert.equal(archiveCalls, 2);

    const failure = report.steps[1];
    assert.equal(failure?.status, "failure");
    assert.equal((failure?.evidence as { invoked: boolean }).invoked, true);
    assert.match(JSON.stringify(failure?.evidence), /invokeOrbitalUplink/);

    const atlas = report.steps[4];
    assert.equal(atlas?.status, "accepted");
    const saved = report.steps[5];
    assert.equal(saved?.status, "saved");
    const rerun = report.steps[6];
    assert.equal(rerun?.status, "success");
    assert.equal((rerun?.evidence as { headline: string }).headline, ARENA_TASK.expectedHeadline);
    assert.equal(report.approvedVersion, 2);
    assert.equal(report.store, "file");

    const reopened = createFileStore(filePath);
    const loaded = await reopened.loadLatest();
    assert.ok(loaded);
    assert.equal(loaded.version, 2);
    assert.equal(loaded.parentVersion, 1);
    assert.equal(loaded.decision.accepted, true);
    assert.equal(loaded.evidence.raindrop.delivered, false);
    assert.equal(loaded.evidence.raindrop.span.name, "orbital_uplink");
    assert.equal(loaded.evidence.raindrop.span.error.name, "ToolUnavailableError");
    assert.equal(loaded.evidence.diagnosis.unavailableTool, loaded.evidence.raindrop.span.name);
    assert.equal(loaded.evidence.diagnosis.errorMessage, loaded.evidence.raindrop.span.error.message);
    assert.equal(loaded.cause.eventId, loaded.evidence.raindrop.eventId);
    assert.equal(loaded.cause.spanName, loaded.evidence.raindrop.span.name);
    assert.equal(loaded.cause.errorMessage, loaded.evidence.raindrop.span.error.message);
    const resolved = loaded.decision.tests.find((item) => item.name === "original-failure-gone");
    assert.equal(resolved?.passed, true);
    assert.match(resolved?.detail ?? "", new RegExp(loaded.evidence.raindrop.eventId));
    assert.match(resolved?.detail ?? "", /orbital_uplink/);
    assert.match(resolved?.detail ?? "", /ToolUnavailableError/);
    assert.match(resolved?.detail ?? "", /ground_archive/);
    assert.equal(loaded.tools.find((tool) => tool.name === "ground_archive")?.enabled, true);
    assert.equal(loaded.tools.find((tool) => tool.name === "orbital_uplink")?.enabled, false);
    assert.ok(loaded.guardrails.some((guardrail) => guardrail.id === "require-live-fallback"));
    assert.equal(loaded.contextPolicy.retainFailureEvidence, true);
    assert.ok(loaded.rules.some((rule) => rule.id === "name-the-fallback"));

    const freshRegistry = createDefaultRegistry();
    const again = await executeNova(
      {
        version: loaded.version,
        parentVersion: loaded.parentVersion,
        tools: loaded.tools,
        rules: loaded.rules,
        guardrails: loaded.guardrails,
        contextPolicy: loaded.contextPolicy,
      },
      freshRegistry,
      {
        priorFailure: {
          toolName: loaded.evidence.raindrop.span.name,
          errorName: loaded.evidence.raindrop.span.error.name,
          errorMessage: loaded.evidence.raindrop.span.error.message,
        },
      },
    );
    assert.equal(again.ok, true);
    assert.equal(again.toolName, "ground_archive");
    assert.equal(again.headline, ARENA_TASK.expectedHeadline);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an in-memory store still loads the approved version", async () => {
  const store = createMemoryStore();
  const report = await runEvolutionCycle({
    store,
    allowLlm: false,
    raindrop: createRaindropClient({ NODE_ENV: "test" }),
  });
  assert.equal(report.approvedVersion, 2);
  assert.equal(report.store, "memory");
  const loaded = await store.loadLatest();
  assert.equal(loaded?.version, 2);
  assert.equal(loaded?.evidence.raindrop.span.name, "orbital_uplink");
  assert.equal(loaded?.cause.spanName, "orbital_uplink");
});

test("missing Raindrop credentials still diagnose from the local event", async () => {
  const run = await executeNova(seedConfig(), createDefaultRegistry(), { priorFailure: null });
  const investigation = await investigateFailure(run, createRaindropClient({ NODE_ENV: "test" }));
  assert.equal(investigation.raindrop.delivered, false);
  assert.equal(investigation.diagnosis.unavailableTool, investigation.raindrop.span.name);
  assert.equal(investigation.diagnosis.errorMessage, investigation.raindrop.span.error.message);
  assert.equal(investigation.diagnosis.eventId, investigation.raindrop.eventId);
  assert.match(investigation.diagnosis.summary, /orbital_uplink/);
  assert.match(investigation.diagnosis.summary, /ToolUnavailableError/);
});

test("an invalid model proposal falls back to the deterministic fallback tool", async () => {
  const parent = seedConfig();
  const evidence = await evidenceFromV1();
  const proposal = await proposeHarness(
    {
      parent,
      evidence,
      catalog: catalogFromRegistry(createDefaultRegistry()),
    },
    { allowLlm: true, complete: async () => "this is not json" },
  );
  assert.equal(proposal.source, "deterministic");
  assert.equal(proposal.cause.spanName, evidence.span.name);
  assert.equal(proposal.tools.find((tool) => tool.name === "ground_archive")?.enabled, true);
  assert.match(proposal.rationale, new RegExp(evidence.eventId));
});

test("a valid model proposal is kept when it passes the harness checks", async () => {
  const parent = seedConfig();
  const evidence = await evidenceFromV1();
  const proposal = await proposeHarness(
    {
      parent,
      evidence,
      catalog: catalogFromRegistry(createDefaultRegistry()),
    },
    {
      allowLlm: true,
      complete: async () =>
        JSON.stringify({
          rationale: "Use the archive.",
          tools: [
            { name: "orbital_uplink", purpose: "fetch_brief", enabled: false },
            { name: "ground_archive", purpose: "fetch_brief", enabled: true },
          ],
          rules: parent.rules,
          guardrails: [
            ...parent.guardrails,
            { id: "require-live-fallback", text: "Use a live fetch tool." },
          ],
          contextPolicy: {
            includeToolErrors: true,
            maxContextChars: 2000,
            retainFailureEvidence: true,
          },
        }),
    },
  );
  assert.equal(proposal.source, "llm");
  assert.equal(proposal.cause.eventId, evidence.eventId);
  assert.equal(proposal.cause.errorMessage, evidence.span.error.message);
  assert.equal(proposal.tools.find((tool) => tool.enabled)?.name, "ground_archive");
  assert.match(proposal.rationale, new RegExp(evidence.eventId));
});

test("MORPH mutates the tool named by the Raindrop span, and ATLAS compares the rerun to that span", async () => {
  const evidence = buildFailureEvent({
    toolName: "decoy_uplink",
    errorName: "ToolUnavailableError",
    errorMessage: "decoy_uplink is dark",
    durationMs: 4,
    taskId: ARENA_TASK.id,
  });
  const diagnosis = diagnoseFromEvidence(evidence);
  assert.equal(diagnosis.unavailableTool, evidence.span.name);
  assert.equal(diagnosis.errorMessage, evidence.span.error.message);

  const registry = decoyRegistry();
  const proposal = deterministicProposal({
    parent: seedConfig(),
    evidence,
    catalog: catalogFromRegistry(registry),
  });
  assert.equal(proposal.cause.spanName, "decoy_uplink");
  assert.equal(proposal.cause.errorMessage, "decoy_uplink is dark");
  assert.equal(proposal.tools.find((tool) => tool.name === "decoy_uplink")?.enabled, false);
  assert.equal(proposal.tools.find((tool) => tool.name === "ground_archive")?.enabled, true);
  assert.match(proposal.rationale, /decoy_uplink is dark/);
  assert.doesNotMatch(proposal.rationale, /unavailable orbital_uplink/);

  const accepted = await judgeProposal(
    { ...proposal, version: 2, parentVersion: 1 },
    registry,
    evidence,
  );
  const gone = accepted.tests.find((item) => item.name === "original-failure-gone");
  assert.equal(gone?.passed, true);
  assert.match(gone?.detail ?? "", new RegExp(evidence.eventId));
  assert.match(gone?.detail ?? "", /decoy_uplink is dark/);
  assert.match(gone?.detail ?? "", /ground_archive/);

  const ignored = await judgeProposal(
    {
      ...proposal,
      version: 2,
      parentVersion: 1,
      cause: { ...proposal.cause, spanName: "orbital_uplink", errorMessage: "not the span" },
      tools: seedConfig().tools,
    },
    registry,
    evidence,
  );
  assert.equal(ignored.tests.find((item) => item.name === "cites-raindrop-event")?.passed, false);
  assert.equal(ignored.tests.find((item) => item.name === "original-failure-gone")?.passed, false);
  assert.equal(ignored.accepted, false);
});

test("ATLAS rejects a proposal that still enables the Raindrop span's tool", async () => {
  const evidence = await evidenceFromV1();
  const parent = seedConfig();
  const decision = await judgeProposal(
    {
      ...parent,
      version: 2,
      parentVersion: 1,
      cause: {
        eventId: evidence.eventId,
        spanName: evidence.span.name,
        errorName: evidence.span.error.name,
        errorMessage: evidence.span.error.message,
      },
      contextPolicy: { ...parent.contextPolicy, retainFailureEvidence: true },
      guardrails: [...parent.guardrails, { id: "require-live-fallback", text: "Need a live tool." }],
    },
    createDefaultRegistry(),
    evidence,
  );
  const gone = decision.tests.find((item) => item.name === "original-failure-gone");
  assert.equal(gone?.passed, false);
  assert.match(gone?.detail ?? "", /orbital_uplink/);
  assert.match(gone?.detail ?? "", new RegExp(evidence.span.error.name));
  assert.equal(decision.accepted, false);
});

function instrument(
  registry: ToolRegistry,
  hooks: { onOrbital: () => void; onArchive: () => void },
): ToolRegistry {
  return {
    ...registry,
    orbital_uplink: {
      ...registry.orbital_uplink,
      async invoke(input) {
        hooks.onOrbital();
        return registry.orbital_uplink.invoke(input);
      },
    },
    ground_archive: {
      ...registry.ground_archive,
      async invoke(input) {
        hooks.onArchive();
        return registry.ground_archive.invoke(input);
      },
    },
  };
}

async function evidenceFromV1() {
  const run = await executeNova(seedConfig(), createDefaultRegistry(), { priorFailure: null });
  const investigation = await investigateFailure(run, createRaindropClient({ NODE_ENV: "test" }));
  return investigation.raindrop;
}

function decoyRegistry(): ToolRegistry {
  const base = createDefaultRegistry();
  return {
    ...base,
    decoy_uplink: {
      name: "decoy_uplink",
      purpose: "fetch_brief",
      available: false,
      async invoke() {
        throw new Error("decoy_uplink is dark");
      },
    },
    ground_archive: {
      ...base.ground_archive,
      invoke: invokeGroundArchive,
    },
  };
}
