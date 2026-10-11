import { randomUUID } from "node:crypto";

/**
 * Structured Raindrop event for one tool failure.
 *
 * Span fields are the ones `Interaction.trackTool` sends (`name`, `input`,
 * `error`, `durationMs`, `properties`). Diagnostic fields are the ones
 * `Raindrop.selfDiagnose` sends (`eventId`, `description`, `category`,
 * `source`, `sentiment`, `properties`). The SDK does not return this payload,
 * so the local adapter and the live client both return the event they send.
 * GLITCH diagnoses from this object only.
 */
export type RaindropFailureEvent = {
  eventId: string;
  event: "glitch_investigation";
  userId: "morph-glitch";
  convoId: string;
  input: string;
  properties: Record<string, string>;
  span: {
    name: string;
    input: { taskId: string; invoked: true };
    error: { name: string; message: string };
    durationMs: number;
    properties: Record<string, string>;
  };
  diagnostic: {
    eventId: string;
    description: string;
    category: "tool_failure";
    source: "GLITCH";
    sentiment: "NEGATIVE";
    properties: {
      tool: string;
      error_name: string;
      error_message: string;
    };
  };
  delivered: boolean;
  sendError?: string;
};

export type Diagnosis = {
  eventId: string;
  unavailableTool: string;
  errorName: string;
  errorMessage: string;
  summary: string;
};

export type RaindropCause = {
  eventId: string;
  spanName: string;
  errorName: string;
  errorMessage: string;
};

export type CapturedThrow = {
  toolName: string;
  errorName: string;
  errorMessage: string;
  durationMs: number;
  taskId: string;
};

export function buildFailureEvent(thrown: CapturedThrow, delivered = false): RaindropFailureEvent {
  if (!thrown.toolName || !thrown.errorName || !thrown.errorMessage) {
    throw new Error("A Raindrop failure event needs the tool name and the thrown error.");
  }
  const eventId = randomUUID();
  const description = `Tool span ${thrown.toolName} failed: ${thrown.errorName}: ${thrown.errorMessage}`;
  return {
    eventId,
    event: "glitch_investigation",
    userId: "morph-glitch",
    convoId: `morph-${eventId}`,
    input: description,
    properties: {
      actor: "GLITCH",
      harness: "morph",
      tool: thrown.toolName,
      error_name: thrown.errorName,
    },
    span: {
      name: thrown.toolName,
      input: { taskId: thrown.taskId, invoked: true },
      error: { name: thrown.errorName, message: thrown.errorMessage },
      durationMs: thrown.durationMs,
      properties: { stage: "nova_execution", actor: "NOVA" },
    },
    diagnostic: {
      eventId,
      description,
      category: "tool_failure",
      source: "GLITCH",
      sentiment: "NEGATIVE",
      properties: {
        tool: thrown.toolName,
        error_name: thrown.errorName,
        error_message: thrown.errorMessage,
      },
    },
    delivered,
  };
}

export function diagnoseFromEvidence(evidence: RaindropFailureEvent): Diagnosis {
  const tool = evidence.span.name;
  const errorName = evidence.span.error.name;
  const errorMessage = evidence.span.error.message;
  if (
    evidence.diagnostic.eventId !== evidence.eventId ||
    evidence.diagnostic.properties.tool !== tool ||
    evidence.diagnostic.properties.error_name !== errorName ||
    evidence.diagnostic.properties.error_message !== errorMessage
  ) {
    throw new Error("Raindrop diagnostic does not match the tool span.");
  }
  return {
    eventId: evidence.eventId,
    unavailableTool: tool,
    errorName,
    errorMessage,
    summary: `Raindrop event ${evidence.eventId} span ${tool} failed with ${errorName}: ${errorMessage}.`,
  };
}

export function causeFromEvent(evidence: RaindropFailureEvent): RaindropCause {
  return {
    eventId: evidence.eventId,
    spanName: evidence.span.name,
    errorName: evidence.span.error.name,
    errorMessage: evidence.span.error.message,
  };
}
