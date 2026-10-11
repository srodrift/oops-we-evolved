import assert from "node:assert/strict";
import test from "node:test";
import { runEvolutionCycle } from "./cycle";
import { createExperimentRegistry } from "./experiment";
import { createMemoryStore } from "./memory-store";
import { simulationState } from "./simulation";
import { createLocalRaindropClient } from "../raindrop/trace";

async function run(scenario: "primary-outage" | "corrupt-archive") {
  const store = createMemoryStore();
  const report = await runEvolutionCycle({
    store,
    registry: createExperimentRegistry(scenario),
    allowLlm: false,
    raindrop: createLocalRaindropClient(),
  });
  return { report, store };
}

test("replay does not reveal diagnosis, approval or recovery before their stage", async () => {
  const { report } = await run("primary-outage");
  const opening = simulationState(report, 0);
  assert.equal(opening.failed, false);
  assert.equal(opening.evidence, undefined);
  assert.equal(opening.routes.fallback, "idle");
  const diagnosis = simulationState(report, 2);
  assert.equal(diagnosis.captured, true);
  assert.equal(diagnosis.evidence?.raindrop.delivered, false);
  assert.equal(diagnosis.proposed, false);
  const proposal = simulationState(report, 3);
  assert.equal(proposal.routes.fallback, "proposed");
  assert.equal(proposal.accepted, false);
  assert.equal(proposal.recovered, false);
  const verified = simulationState(report, 4);
  assert.equal(verified.accepted, true);
  assert.equal(verified.recovered, false);
  assert.equal(simulationState(report, 5).routes.fallback, "recovered");
});

test("a responding fallback with the wrong headline is genuinely rejected and never saved", async () => {
  const { report, store } = await run("corrupt-archive");
  const decision = report.steps.find((step) => step.index === 5)!;
  assert.equal(decision.status, "rejected");
  assert.match(
    (decision.evidence as { reason: string }).reason,
    /headline-matches/,
  );
  assert.match(
    (decision.evidence as { reason: string }).reason,
    /INVALID BRIEF/,
  );
  const tests = (
    decision.evidence as { tests: Array<{ name: string; passed: boolean }> }
  ).tests;
  assert.equal(
    tests.find((check) => check.name === "execution-succeeds")?.passed,
    true,
  );
  assert.equal(
    tests.find((check) => check.name === "headline-matches")?.passed,
    false,
  );
  assert.equal(await store.loadLatest(), null);
  const view = simulationState(report, 5);
  assert.equal(view.rejected, true);
  assert.equal(view.recovered, false);
  assert.equal(view.routes.verification, "failed");
  assert.equal(view.routes.fallback, "idle");
  assert.equal(view.nodeStatus.archive, "REQUIREMENTS FAILED");
});

test("ATLAS approval cannot unlock recovery without successful persistence and rerun", async () => {
  const { report } = await run("primary-outage");
  const failedReadback = {
    ...report,
    steps: report.steps.map((step) =>
      step.index === 6 ? { ...step, status: "failure" as const } : step,
    ),
  };
  assert.equal(simulationState(failedReadback, 5).recovered, false);
  const failedRerun = {
    ...report,
    steps: report.steps.map((step) =>
      step.index === 7 ? { ...step, status: "failure" as const } : step,
    ),
  };
  assert.equal(simulationState(failedRerun, 5).recovered, false);
  assert.equal(
    simulationState({ ...report, approvedVersion: null }, 5).recovered,
    false,
  );
});

test("a skipped failure cannot create captured evidence or a repaired route", async () => {
  const { report } = await run("primary-outage");
  const skipped = {
    ...report,
    approvedVersion: null,
    steps: report.steps.map((step) => ({
      ...step,
      status: "skipped" as const,
      evidence: null,
    })),
  };
  const view = simulationState(skipped, 5);
  assert.equal(view.failed, false);
  assert.equal(view.captured, false);
  assert.equal(view.proposed, false);
  assert.equal(view.recovered, false);
  assert.ok(Object.values(view.routes).every((state) => state === "idle"));
});
