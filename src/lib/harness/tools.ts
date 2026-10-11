import { ARENA_TASK, type CatalogTool, type ToolInput, type ToolOutput, type ToolPurpose } from "./types";

export class ToolUnavailableError extends Error {
  readonly toolName: string;

  constructor(toolName: string, message: string) {
    super(message);
    this.name = "ToolUnavailableError";
    this.toolName = toolName;
  }
}

export type ToolImplementation = {
  name: string;
  purpose: ToolPurpose;
  available: boolean;
  invoke: (input: ToolInput) => Promise<ToolOutput>;
};

export type ToolRegistry = Record<string, ToolImplementation>;

export async function invokeOrbitalUplink(input: ToolInput): Promise<ToolOutput> {
  throw new ToolUnavailableError(
    "orbital_uplink",
    `orbital_uplink is offline: no carrier for ${input.taskId}`,
  );
}

export async function invokeGroundArchive(input: ToolInput): Promise<ToolOutput> {
  if (input.taskId !== ARENA_TASK.id) {
    throw new Error(`ground_archive has no brief for ${input.taskId}`);
  }
  return {
    headline: ARENA_TASK.expectedHeadline,
    source: "ground_archive",
  };
}

export function createDefaultRegistry(): ToolRegistry {
  return {
    orbital_uplink: {
      name: "orbital_uplink",
      purpose: "fetch_brief",
      available: false,
      invoke: invokeOrbitalUplink,
    },
    ground_archive: {
      name: "ground_archive",
      purpose: "fetch_brief",
      available: true,
      invoke: invokeGroundArchive,
    },
  };
}

export function catalogFromRegistry(registry: ToolRegistry): CatalogTool[] {
  return Object.values(registry).map((tool) => ({
    name: tool.name,
    purpose: tool.purpose,
    available: tool.available,
  }));
}
