import { NextResponse } from "next/server";
import { runEvolutionCycle } from "@/lib/harness/cycle";
import { redactEvidence, redactSecrets } from "@/lib/harness/redact";
import { createDefaultStore } from "@/lib/harness/store";

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
    }
    store = await createDefaultStore();
    const report = await runEvolutionCycle({
      store,
      registry: createExperimentRegistry(scenario),
    });
    return NextResponse.json(redactEvidence({ ...report, scenario }, secrets));
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
