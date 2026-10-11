import assert from "node:assert/strict";
import test from "node:test";
import { toBoard } from "./board";
import { runEvolutionCycle } from "./cycle";
import { createMemoryStore } from "./memory-store";
import { seedConfig } from "./seed";

test("the arena board shows v1 beside approved v2 after one cycle", async () => {
  const seed = seedConfig();
  const report = await runEvolutionCycle({
    store: createMemoryStore(),
    allowLlm: false,
  });

  const board = toBoard(seed, report);

  assert.equal(board.nova.invoked, true);
  assert.equal(board.nova.errorName, "ToolUnavailableError");
  assert.match(board.nova.errorMessage ?? "", /orbital_uplink is offline/);
  assert.match(board.nova.rerun ?? "", /GROUND ARCHIVE \/\/ ARENA NOMINAL/);

  assert.match(board.glitch.summary ?? "", /orbital_uplink/);
  assert.match(board.glitch.raindrop ?? "", /Span orbital_uplink/);
  assert.match(board.glitch.raindrop ?? "", /No Raindrop write key/);
  assert.match(board.morph.rationale ?? "", /Raindrop event/);
  assert.match(board.atlas.resolution ?? "", /orbital_uplink/);
  assert.match(board.atlas.resolution ?? "", /ground_archive/);

  assert.equal(board.morph.proposer, "Deterministic proposer.");
  assert.equal(board.morph.v1.tools.find((tool) => tool.name === "orbital_uplink")?.enabled, true);
  assert.equal(board.morph.v2State, "approved");
  assert.equal(board.morph.v2?.versionLabel, "Approved v2");
  assert.equal(board.morph.v2?.tools.find((tool) => tool.name === "ground_archive")?.enabled, true);
  assert.equal(board.morph.v2?.tools.find((tool) => tool.name === "orbital_uplink")?.enabled, false);
  assert.ok(board.morph.v2?.rules.some((rule) => rule.id === "name-the-fallback"));
  assert.ok(board.morph.v2?.guardrails.some((guardrail) => guardrail.id === "require-live-fallback"));
  assert.ok(board.morph.v1.guardrails.some((guardrail) => guardrail.id === "no-fabricated-headline"));

  assert.equal(board.atlas.verdict, "Accepted");
  assert.equal(board.atlas.failed, 0);
  assert.ok(board.atlas.passed > 0);
  assert.match(board.atlas.saved ?? "", /Saved version 2/);
  assert.match(board.banner ?? "", /Approved v2 was saved/);
});
