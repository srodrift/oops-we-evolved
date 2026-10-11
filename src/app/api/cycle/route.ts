import { NextResponse } from "next/server";
import { runEvolutionCycle } from "@/lib/harness/cycle";
import { redactSecrets } from "@/lib/harness/redact";
import { createDefaultStore } from "@/lib/harness/store";

export async function POST() {
  let store: Awaited<ReturnType<typeof createDefaultStore>> | null = null;
  try {
    store = await createDefaultStore();
    const report = await runEvolutionCycle({ store });
    return NextResponse.json(report);
  } catch (error) {
    const message = redactSecrets(error instanceof Error ? error.message : "Cycle failed");
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await store?.close?.();
  }
}
