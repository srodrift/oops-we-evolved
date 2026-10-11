import { ARENA_TASK, type MissionTask } from "./types";

export const DEFAULT_BRIEF =
  "SF NETWORK // BACKUP CHANNEL VERIFIED\nIncident: SF-104\nPrimary communications are unavailable. The verified ground archive contains the incident status.";

/** The supported mission is retrieval, not arbitrary natural-language execution. */
export function operatorMission(brief: string): {
  task: MissionTask;
  brief: string;
} {
  const normalized = brief.trim();
  if (!normalized || normalized.length > 4000)
    throw new Error("Provide a source brief between 1 and 4,000 characters.");
  const headline =
    normalized
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim() ?? "";
  if (headline.length > 180)
    throw new Error("Keep the first-line headline under 180 characters.");
  return {
    task: {
      id: "retrieve-operator-brief",
      instruction:
        "Retrieve the operator's incident brief and return its first-line headline exactly.",
      expectedHeadline: headline,
    },
    brief: normalized,
  };
}

export const DEFAULT_TASK: MissionTask = ARENA_TASK;
