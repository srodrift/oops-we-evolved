import { runEvolutionCycle } from "../src/lib/harness/cycle";
import { redactSecrets } from "../src/lib/harness/redact";
import { createDefaultStore } from "../src/lib/harness/store";

async function main(): Promise<void> {
  const store = await createDefaultStore();
  try {
    const report = await runEvolutionCycle({ store });
    console.log(JSON.stringify(report, null, 2));
    const rerun = report.steps.find((step) => step.index === 7);
    process.exitCode = rerun?.status === "success" ? 0 : 1;
  } finally {
    await store.close?.();
  }
}

main().catch((error: unknown) => {
  console.error(redactSecrets(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
