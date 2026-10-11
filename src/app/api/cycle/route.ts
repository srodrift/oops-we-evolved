import { NextResponse } from "next/server";
import { runEvolutionCycle } from "@/lib/harness/cycle";
import { redactEvidence, redactSecrets } from "@/lib/harness/redact";
import { createDefaultStore } from "@/lib/harness/store";

import { operatorMission } from "@/lib/harness/mission";
import { createExperimentRegistry } from "@/lib/harness/experiment";
import { EXPERIMENTS, type ExperimentId } from "@/lib/harness/simulation";

export async function POST(request: Request) {
  const secrets = [
    process.env.MONGODB_URI,
    process.env.RAINDROP_API_KEY,
    process.env.RAINDROP_WRITE_KEY,
    process.env.OPENAI_API_KEY,
  ].filter((value): value is string => Boolean(value));
  let store: Awaited<ReturnType<typeof createDefaultStore>> | null = null;
  try {
    const raw = await request.text();
    let scenario: ExperimentId = "primary-outage";
    let mission: ReturnType<typeof operatorMission> | undefined;
    if (raw) {
      let input: unknown;
      try {
        input = JSON.parse(raw);
      } catch {
        return NextResponse.json(
          { error: "Invalid experiment request" },
          { status: 400 },
        );
      }
      const id =
        input && typeof input === "object" && "scenario" in input
          ? input.scenario
          : undefined;
      if (!EXPERIMENTS.some((experiment) => experiment.id === id))
        return NextResponse.json(
          { error: "Unknown experiment" },
          { status: 400 },
        );
      scenario = id as ExperimentId;
      if (input && typeof input === "object" && "brief" in input) {
        if (typeof input.brief !== "string")
          return NextResponse.json(
            { error: "Source brief must be text" },
            { status: 400 },
          );
        try {
          mission = operatorMission(input.brief);
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : "Invalid brief" },
            { status: 400 },
          );
        }
      }
    }
    store = await createDefaultStore();
    const report = await runEvolutionCycle({
      store,
      registry: createExperimentRegistry(scenario, mission?.brief),
      task: mission?.task,
    });
    return NextResponse.json(
      redactEvidence(
        {
          ...report,
          scenario,
          ...(mission
            ? { input: { source: "operator", brief: mission.brief } }
            : {}),
        },
        secrets,
      ),
    );
  } catch (error) {
    const message = redactSecrets(
      error instanceof Error ? error.message : "Cycle failed",
      secrets,
    );
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await store?.close?.();
  }
}
