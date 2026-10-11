import { createDefaultRegistry, type ToolRegistry } from "./tools";
import { operatorMission } from "./mission";
import type { ExperimentId } from "./simulation";

/** Both experiments execute real local tool implementations. No report is mocked. */
export function createExperimentRegistry(
  experiment: ExperimentId,
  brief?: string,
): ToolRegistry {
  const registry = createDefaultRegistry();
  if (brief !== undefined) {
    const mission = operatorMission(brief);
    registry.ground_archive = {
      ...registry.ground_archive,
      async invoke(input) {
        if (input.taskId !== mission.task.id)
          throw new Error("Archive task does not match the operator mission.");
        return {
          headline: mission.task.expectedHeadline,
          source: "operator-ground-archive",
        };
      },
    };
  }
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
