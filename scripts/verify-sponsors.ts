import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { runEvolutionCycle } from "../src/lib/harness/cycle";
import { createMongoStore } from "../src/lib/harness/mongo-store";
import { createExperimentRegistry } from "../src/lib/harness/experiment";
import { operatorMission } from "../src/lib/harness/mission";
import { readRaindropWriteKey } from "../src/lib/raindrop/trace";
import { redactEvidence, redactSecrets } from "../src/lib/harness/redact";
import type { FailureEvidence } from "../src/lib/harness/types";
loadEnvConfig(process.cwd());
const secrets = [
  process.env.MONGODB_URI,
  readRaindropWriteKey(),
  process.env.OPENAI_API_KEY,
].filter((s): s is string => Boolean(s));
async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || !readRaindropWriteKey())
    throw new Error(
      "Live sponsor verification requires MONGODB_URI and RAINDROP_API_KEY (or RAINDROP_WRITE_KEY) in .env.local. No local fallback is accepted.",
    );
  const mission = operatorMission(
    "SPONSOR CHECK // VERIFIED RECOVERY\nLive integration verification of a controlled local tool failure.",
  );
  const store = await createMongoStore(uri);
  let success;
  try {
    success = await runEvolutionCycle({
      store,
      task: mission.task,
      registry: createExperimentRegistry("primary-outage", mission.brief),
      allowLlm: false,
    });
    assert.equal(success.store, "mongodb");
    assert.ok(success.approvedVersion, "Repair must be approved and persisted");
    const failure = success.steps.find((s) => s.index === 3)
      ?.evidence as FailureEvidence;
    assert.equal(
      failure.raindrop.delivered,
      true,
      "Raindrop must acknowledge the terminal event",
    );
    assert.equal(success.steps.find((s) => s.index === 7)?.status, "success");
  } finally {
    await store.close?.();
  }
  // A new client proves this is a database read, not retained in-process data.
  const independent = await createMongoStore(uri);
  try {
    const loaded = await independent.loadVersion(success.approvedVersion!);
    assert.ok(loaded);
    const failure = success.steps.find((s) => s.index === 3)
      ?.evidence as FailureEvidence;
    assert.equal(loaded.evidence.raindrop.eventId, failure.raindrop.eventId);
    assert.equal(loaded.decision.accepted, true);
    const before = await independent.loadLatest();
    const rejected = await runEvolutionCycle({
      store: independent,
      task: mission.task,
      registry: createExperimentRegistry("corrupt-archive", mission.brief),
      allowLlm: false,
    });
    assert.equal(rejected.approvedVersion, null);
    assert.equal(
      (await independent.loadLatest())?.version,
      before?.version,
      "Rejected repair must not create a version",
    );
    assert.equal(
      (rejected.steps.find((s) => s.index === 3)?.evidence as FailureEvidence)
        .raindrop.delivered,
      true,
    );
    const proof = {
      verifiedAt: new Date().toISOString(),
      mode: "live-sponsor-integration",
      scope:
        "Controlled local tools; live Raindrop terminal event delivery and MongoDB storage",
      mongo: {
        database: "morph",
        collection: "harness_versions",
        independentReadback: true,
        rejectedRepairNotSaved: true,
      },
      recovery: success,
      rejection: rejected,
    };
    await mkdir("deliverables", { recursive: true });
    await writeFile(
      "deliverables/live-sponsor-proof.json",
      JSON.stringify(redactEvidence(proof, secrets), null, 2),
    );
    console.log(
      "PASS: live Raindrop terminal events, MongoDB independent readback, correct rerun, and rejection without saving. Redacted proof: deliverables/live-sponsor-proof.json",
    );
    console.log(
      "Confirm the event ID in the Raindrop dashboard for remote visibility; SDK acknowledgement alone does not prove dashboard indexing.",
    );
  } finally {
    await independent.close?.();
  }
}
main().catch((error) => {
  console.error(
    redactSecrets(
      error instanceof Error ? error.message : String(error),
      secrets,
    ),
  );
  process.exitCode = 1;
});
