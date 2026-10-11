import type {
  Diagnosis,
  RaindropCause,
  RaindropFailureEvent,
} from "../raindrop/evidence";

export type { Diagnosis, RaindropCause, RaindropFailureEvent };

export const ARENA_TASK = {
  id: "retrieve-arena-brief",
  instruction: "Retrieve the arena status brief and return its headline.",
  expectedHeadline: "GROUND ARCHIVE // ARENA NOMINAL",
} as const;

export type MissionTask = {
  id: string;
  instruction: string;
  expectedHeadline: string;
};

export type ToolPurpose = "fetch_brief";

export type ToolBinding = {
  name: string;
  purpose: ToolPurpose;
  enabled: boolean;
};

export type Rule = {
  id: string;
  text: string;
};

export type Guardrail = {
  id: string;
  text: string;
};

export type ContextPolicy = {
  includeToolErrors: boolean;
  maxContextChars: number;
  retainFailureEvidence: boolean;
};

export type HarnessConfig = {
  version: number;
  parentVersion: number | null;
  tools: ToolBinding[];
  rules: Rule[];
  guardrails: Guardrail[];
  contextPolicy: ContextPolicy;
};

export type ToolInput = {
  taskId: string;
};

export type ToolOutput = {
  headline: string;
  source: string;
};

export type CatalogTool = {
  name: string;
  purpose: ToolPurpose;
  available: boolean;
};

export type NovaRun = {
  ok: boolean;
  invoked: boolean;
  taskId: string;
  configVersion: number;
  toolName: string | null;
  headline: string | null;
  errorName: string | null;
  errorMessage: string | null;
  stack: string | null;
  durationMs: number;
  retainedFailure: boolean;
  contextPreview: string;
  guardrailHeld: boolean;
};

export type FailureEvidence = {
  raindrop: RaindropFailureEvent;
  diagnosis: Diagnosis;
};

export type AtlasTest = {
  name: string;
  passed: boolean;
  detail: string;
};

export type AtlasDecision = {
  accepted: boolean;
  actor: "Verification";
  reason: string;
  tests: AtlasTest[];
};

export type HarnessVersionRecord = HarnessConfig & {
  cause: RaindropCause;
  evidence: FailureEvidence;
  decision: AtlasDecision;
  createdAt: string;
};

export type ProposalDraft = Omit<HarnessConfig, "version" | "parentVersion"> & {
  cause: RaindropCause;
  rationale: string;
  source: "deterministic" | "llm";
};

export type CycleStepStatus =
  | "failure"
  | "recorded"
  | "proposed"
  | "accepted"
  | "rejected"
  | "saved"
  | "success"
  | "skipped";

export type CycleStep = {
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  actor: "Agent" | "Raindrop" | "Harness Repair" | "Verification";
  title: string;
  status: CycleStepStatus;
  detail: string;
  evidence: unknown;
};

export type StoreKind = "memory" | "file" | "mongodb";

export type CycleReport = {
  scenario?: "primary-outage" | "corrupt-archive";
  task: MissionTask;
  input?: { source: "operator"; brief: string };
  store: StoreKind;
  approvedVersion: number | null;
  steps: CycleStep[];
};

export function toHarnessConfig(record: HarnessVersionRecord): HarnessConfig {
  return {
    version: record.version,
    parentVersion: record.parentVersion,
    tools: record.tools,
    rules: record.rules,
    guardrails: record.guardrails,
    contextPolicy: record.contextPolicy,
  };
}
