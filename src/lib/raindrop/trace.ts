import type { NovaRun } from "../harness/types";
import { redactSecrets } from "../harness/redact";
import { buildFailureEvent, type RaindropFailureEvent } from "./evidence";

export type RaindropClient = {
  capture(run: NovaRun): Promise<RaindropFailureEvent>;
};

export function readRaindropWriteKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const apiKey = env.RAINDROP_API_KEY?.trim();
  if (apiKey) {
    return apiKey;
  }
  const writeKey = env.RAINDROP_WRITE_KEY?.trim();
  return writeKey || undefined;
}

export function createRaindropClient(
  env: NodeJS.ProcessEnv = process.env,
): RaindropClient {
  const writeKey = readRaindropWriteKey(env);
  if (!writeKey) {
    return createLocalRaindropClient();
  }
  return createLiveRaindropClient(writeKey);
}

export function createLocalRaindropClient(): RaindropClient {
  return {
    async capture(run) {
      return buildFailureEvent(throwFromRun(run), false);
    },
  };
}

function createLiveRaindropClient(writeKey: string): RaindropClient {
  return {
    async capture(run) {
      const event = buildFailureEvent(throwFromRun(run), true);
      try {
        await deliver(writeKey, event);
        return event;
      } catch (error) {
        const message = redactSecrets(
          error instanceof Error ? error.message : String(error),
          [writeKey],
        );
        return { ...event, delivered: false, sendError: message };
      }
    },
  };
}

function throwFromRun(run: NovaRun) {
  if (
    run.ok ||
    !run.invoked ||
    !run.toolName ||
    !run.errorName ||
    !run.errorMessage
  ) {
    throw new Error(
      "Raindrop capture requires a tool that was invoked and threw.",
    );
  }
  return {
    toolName: run.toolName,
    errorName: run.errorName,
    errorMessage: run.errorMessage,
    durationMs: run.durationMs,
    taskId: run.taskId,
  };
}

async function deliver(
  writeKey: string,
  event: RaindropFailureEvent,
): Promise<void> {
  const { Raindrop } = await import("raindrop-ai");
  const client = new Raindrop({
    writeKey,
    localWorkshopUrl: false,
    useExternalOtel: true,
    bypassOtelForTools: true,
  });
  try {
    const interaction = client.begin({
      eventId: event.eventId,
      event: event.event,
      userId: event.userId,
      convoId: event.convoId,
      input: event.input,
      properties: event.properties,
    });
    const tracedError = new Error(event.span.error.message);
    tracedError.name = event.span.error.name;
    interaction.trackTool({
      name: event.span.name,
      input: event.span.input,
      error: tracedError,
      durationMs: event.span.durationMs,
      properties: event.span.properties,
    });
    client.selfDiagnose({
      eventId: event.diagnostic.eventId,
      description: event.diagnostic.description,
      category: event.diagnostic.category,
      source: event.diagnostic.source,
      sentiment: event.diagnostic.sentiment,
      properties: event.diagnostic.properties,
    });
    // The terminal event is awaited by the SDK. Include the failure payload
    // here as well as in tool/signal telemetry, whose batching is separate.
    await interaction.finish({
      output: event.diagnostic.description,
      properties: {
        failure_event_id: event.eventId,
        failure_tool: event.span.name,
        failure_error_name: event.span.error.name,
        failure_error_message: event.span.error.message,
        diagnostic_category: event.diagnostic.category,
        diagnostic_source: event.diagnostic.source,
        delivery_scope: "terminal_event_acknowledgement",
      },
    });
  } finally {
    await client.close().catch(() => undefined);
  }
}
