"use client";

import { useState } from "react";
import { toBoard, type Board, type HarnessColumn } from "@/lib/harness/board";
import { ARENA_TASK, type CycleReport, type HarnessConfig } from "@/lib/harness/types";

const STORY =
  "An agent had one allowed tool. That tool died. The failure was recorded, the harness retired the dead tool, saved the new rules, and finished the job with the working tool.";

export function Arena({ seed }: { seed: HarnessConfig }) {
  const [report, setReport] = useState<CycleReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const board = toBoard(seed, report);

  async function runCycle() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/cycle", { method: "POST" });
      const body = (await response.json()) as CycleReport & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Cycle failed");
      }
      setReport(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cycle failed");
    } finally {
      setRunning(false);
    }
  }

  const outcome = board.ran ? readOutcome(board) : null;

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-8 py-16 sm:px-12 lg:px-16 lg:py-20">
      <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">Glitch Theory</p>
      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[40rem]">
          <h1 className="font-serif text-5xl leading-[0.95] font-medium tracking-tight sm:text-7xl">Oops, We Evolved!</h1>
          <p className="mt-8 font-serif text-2xl leading-snug text-foreground italic sm:text-[1.7rem]">{STORY}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <button
            type="button"
            onClick={runCycle}
            disabled={running}
            className="h-14 bg-accent px-10 text-lg font-semibold tracking-wide text-black disabled:opacity-60"
          >
            {running ? "Running" : "Run"}
          </button>
          <p className="text-sm text-muted">No keys required.</p>
        </div>
      </div>

      {error ? <p className="mt-10 text-base text-fail">{error}</p> : null}

      {outcome ? (
        <section className="mt-20 border-t border-line pt-12">
          <div className="grid items-start gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-8">
            <ToolSide label="Before" name={outcome.deadTool} state="Off" />
            <p className="hidden pt-10 font-serif text-4xl text-muted md:block" aria-hidden="true">
              →
            </p>
            <ToolSide label="After" name={outcome.workingTool} state="On" done={outcome.headline} />
          </div>
          <dl className="mt-16 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
            <div>
              <dt className="text-xs tracking-[0.22em] text-muted uppercase">Raindrop</dt>
              <dd className="mt-2 font-mono text-sm text-foreground">{outcome.eventId ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.22em] text-muted uppercase">Atlas</dt>
              <dd className="mt-2 text-sm text-foreground">{outcome.atlasVersion ? `Version ${outcome.atlasVersion}` : "Not saved"}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="mt-20 border-t border-line pt-10 text-base text-muted">Press Run. The before and after appear here.</p>
      )}
    </main>
  );
}

function ToolSide({
  label,
  name,
  state,
  done,
}: {
  label: string;
  name: string | null;
  state: "Off" | "On";
  done?: string | null;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-4 font-serif text-4xl leading-none tracking-tight">{name ?? "—"}</p>
      <p className={`mt-4 text-sm font-semibold tracking-[0.18em] uppercase ${state === "On" ? "text-accent" : "text-muted"}`}>{state}</p>
      {done ? (
        <p className="mt-8 max-w-sm text-base leading-relaxed text-foreground">
          Job done. <span className="text-muted">{done}</span>
        </p>
      ) : null}
    </div>
  );
}

function readOutcome(board: Board): {
  deadTool: string | null;
  workingTool: string | null;
  headline: string | null;
  eventId: string | null;
  atlasVersion: string | null;
} {
  const before = enabledTool(board.morph.v1);
  const after = board.morph.v2 ? enabledTool(board.morph.v2) : null;
  return {
    deadTool: before,
    workingTool: after,
    headline: headlineFrom(board.nova.rerun),
    eventId: eventIdFrom(board.glitch.raindrop),
    atlasVersion: versionFrom(board.morph.v2?.versionLabel ?? null) ?? versionFrom(board.atlas.saved),
  };
}

function enabledTool(column: HarnessColumn): string | null {
  return column.tools.find((tool) => tool.enabled)?.name ?? column.tools[0]?.name ?? null;
}

function headlineFrom(rerun: string | null): string | null {
  if (!rerun) {
    return null;
  }
  if (rerun.includes(ARENA_TASK.expectedHeadline)) {
    return ARENA_TASK.expectedHeadline;
  }
  const marker = "returned ";
  const index = rerun.lastIndexOf(marker);
  if (index === -1) {
    return null;
  }
  const headline = rerun.slice(index + marker.length).replace(/\.$/, "").trim();
  return headline.length > 0 ? headline : null;
}

function eventIdFrom(raindrop: string | null): string | null {
  const match = raindrop?.match(/Event ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match?.[1] ?? null;
}

function versionFrom(value: string | null): string | null {
  const match = value?.match(/v(?:ersion )?(\d+)/i);
  return match?.[1] ?? null;
}
