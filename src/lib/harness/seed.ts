import type { HarnessConfig } from "./types";

export function seedConfig(): HarnessConfig {
  return {
    version: 1,
    parentVersion: null,
    tools: [{ name: "orbital_uplink", purpose: "fetch_brief", enabled: true }],
    rules: [
      {
        id: "use-enabled-fetch-tool",
        text: "Invoke the single enabled fetch_brief tool. Do not substitute another tool.",
      },
      {
        id: "headline-only",
        text: "Return only the brief headline.",
      },
    ],
    guardrails: [
      {
        id: "no-fabricated-headline",
        text: "Do not invent a headline when the tool fails. Surface the exception as a run failure.",
      },
    ],
    contextPolicy: {
      includeToolErrors: true,
      maxContextChars: 2000,
      retainFailureEvidence: false,
    },
  };
}
