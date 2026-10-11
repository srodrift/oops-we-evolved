import { diagnoseFromEvidence } from "../raindrop/evidence";
import type { RaindropClient } from "../raindrop/trace";
import type { FailureEvidence, NovaRun } from "./types";

export async function investigateFailure(run: NovaRun, client: RaindropClient): Promise<FailureEvidence> {
  if (run.ok || !run.invoked || !run.toolName || !run.errorName || !run.errorMessage) {
    throw new Error("GLITCH requires a tool that was invoked and threw.");
  }
  const raindrop = await client.capture(run);
  return {
    raindrop,
    diagnosis: diagnoseFromEvidence(raindrop),
  };
}
