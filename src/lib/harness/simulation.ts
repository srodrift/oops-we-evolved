import type { CycleReport, CycleStep, FailureEvidence } from "./types";

export const LAB_STAGES = [
  {
    label: "Challenge",
    step: 1,
    actor: "nova",
    title: "The agent receives your mission",
    caption: "The original harness authorizes only the primary channel.",
  },
  {
    label: "Execution",
    step: 2,
    actor: "orbital",
    title: "The primary connection fails",
    caption:
      "An actual tool exception is recorded. The agent does not invent a headline.",
  },
  {
    label: "Raindrop Evidence",
    step: 3,
    actor: "glitch",
    title: "The tool failure is captured",
    caption:
      "The tool span and diagnostic share an event ID. Delivery status is recorded separately.",
  },
  {
    label: "Harness Mutation",
    step: 4,
    actor: "morph",
    title: "A new tool route is proposed",
    caption:
      "The fallback is proposed, not yet approved. Tools, rules and guardrails change together.",
  },
  {
    label: "Verification",
    step: 5,
    actor: "atlas",
    title: "The repaired harness is tested",
    caption:
      "A successful fallback response must also satisfy the mission requirements.",
  },
  {
    label: "Evolution",
    step: 7,
    actor: "archive",
    title: "The approved harness runs again",
    caption:
      "Recovery requires acceptance, persistence readback and a successful final execution.",
  },
] as const;

export const EXPERIMENTS = [
  {
    id: "primary-outage",
    label: "Primary outage",
    description:
      "orbital_uplink throws. The archive returns the correct brief. The harness can recover the mission.",
  },
  {
    id: "corrupt-archive",
    label: "Corrupt fallback",
    description:
      "orbital_uplink throws. The archive responds with the wrong headline. Verification must reject the candidate.",
  },
] as const;
export type ExperimentId = (typeof EXPERIMENTS)[number]["id"];
export type NodeId =
  | "nova"
  | "orbital"
  | "glitch"
  | "morph"
  | "atlas"
  | "archive";
export type RouteState =
  | "idle"
  | "failed"
  | "evidence"
  | "proposed"
  | "verified"
  | "recovered";

export function recordedStep(
  report: CycleReport | null,
  index: number,
): CycleStep | undefined {
  return report?.steps.find((step) => step.index === index);
}

export function simulationState(report: CycleReport | null, stage: number) {
  const failureStep = recordedStep(report, 2);
  const diagnosis = recordedStep(report, 3);
  const proposal = recordedStep(report, 4);
  const decision = recordedStep(report, 5);
  const saved = recordedStep(report, 6);
  const rerun = recordedStep(report, 7);
  const failed = stage >= 1 && failureStep?.status === "failure";
  const captured = stage >= 2 && diagnosis?.status === "recorded";
  const proposed = stage >= 3 && proposal?.status === "proposed";
  const accepted = stage >= 4 && decision?.status === "accepted";
  const rejected = stage >= 4 && decision?.status === "rejected";
  const recovered =
    stage >= 5 &&
    accepted &&
    saved?.status === "saved" &&
    rerun?.status === "success" &&
    report?.approvedVersion != null;
  const evidence = captured
    ? (diagnosis?.evidence as FailureEvidence)
    : undefined;
  const nodeStatus: Record<NodeId, string> = {
    nova: recovered
      ? "MISSION RECOVERED"
      : rejected
        ? "RECOVERY BLOCKED"
        : failed
          ? "FAILURE OBSERVED"
          : "READY",
    orbital: failed ? "FAILURE CAPTURED" : "OFFLINE SCENARIO",
    glitch: captured
      ? evidence?.raindrop.delivered
        ? "EVIDENCE DELIVERED"
        : "EVIDENCE CAPTURED LOCALLY"
      : "AWAITING TOOL FAILURE",
    morph: proposed
      ? rejected
        ? "CANDIDATE REJECTED"
        : accepted
          ? "CANDIDATE ACCEPTED"
          : "CANDIDATE PROPOSED"
      : "AWAITING EVIDENCE",
    atlas: rejected
      ? "REJECTED · NOTHING SAVED"
      : accepted
        ? "REQUIREMENTS PASSED"
        : "AWAITING PROPOSAL",
    archive: recovered
      ? "VERIFIED FALLBACK ACTIVE"
      : rejected
        ? "REQUIREMENTS FAILED"
        : accepted
          ? "TESTED · RERUN PENDING"
          : proposed
            ? "PROPOSED · NOT APPROVED"
            : "AVAILABLE · UNBOUND",
  };
  const routes: Record<string, RouteState> = {
    primary: failed ? "failed" : "idle",
    capture: captured ? "evidence" : "idle",
    mutation: proposed ? "proposed" : "idle",
    verification: rejected ? "failed" : accepted ? "verified" : "idle",
    fallback: recovered
      ? "recovered"
      : proposed && !rejected
        ? "proposed"
        : "idle",
  };
  return {
    failed,
    captured,
    proposed,
    accepted,
    rejected,
    recovered,
    evidence,
    nodeStatus,
    routes,
  };
}
