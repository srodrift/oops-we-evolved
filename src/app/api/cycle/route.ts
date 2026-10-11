import { NextResponse } from "next/server";
import { runEvolutionCycle } from "@/lib/harness/cycle";
import { redactEvidence, redactSecrets } from "@/lib/harness/redact";
import { createDefaultStore } from "@/lib/harness/store";

export async function POST() {
  const secrets = [
    process.env.MONGODB_URI,
    process.env.RAINDROP_API_KEY,
    process.env.RAINDROP_WRITE_KEY,
    process.env.OPENAI_API_KEY,
  ].filter((value): value is string => Boolean(value));
  let store: Awaited<ReturnType<typeof createDefaultStore>> | null = null;
  try {
    store = await createDefaultStore();
    const report = await runEvolutionCycle({ store });
    return NextResponse.json(redactEvidence(report, secrets));
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
