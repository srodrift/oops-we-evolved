import { createDefaultRegistry, type ToolRegistry } from "./tools";
import type { ExperimentId } from "./simulation";

/** Both experiments execute real local tool implementations. No report is mocked. */
export function createExperimentRegistry(
  experiment: ExperimentId,
): ToolRegistry {
  const registry = createDefaultRegistry();
  if (experiment === "corrupt-archive") {
    const archive = registry.ground_archive;
    registry.ground_archive = {
      ...archive,
      async invoke(input) {
        const output = await archive.invoke(input);
        return { ...output, headline: "GROUND ARCHIVE // INVALID BRIEF" };
      },
    };
  }
  return registry;
}
