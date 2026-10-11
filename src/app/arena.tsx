"use client";

import { useState, type ReactNode } from "react";
import { AtlasGuardian, GlitchFox, MorphCreature, NovaPulse, NovaSpark } from "@/components/characters";
import { toBoard, type Board, type HarnessColumn } from "@/lib/harness/board";
import { ARENA_TASK, type CycleReport, type HarnessConfig } from "@/lib/harness/types";

export function Arena({ seed }: { seed: HarnessConfig }) {
  const [report, setReport] = useState<CycleReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const board = toBoard(seed, report);
  const outcome = board.ran ? readOutcome(board) : null;
  const evolved = board.morph.v2State === "approved" && board.atlas.verdict === "Accepted";
  const showGlitch = Boolean(board.glitch.summary);
  const showMorph = board.morph.v2State === "approved" || board.morph.v2State === "proposed";
  const showAtlas = Boolean(board.atlas.verdict);

  const novaLine = evolved
    ? "The job is done. I became Pulse."
    : "I run the job with the one tool I'm allowed.";
  const glitchLine = outcome?.deadTool
    ? `I caught ${outcome.deadTool} and filed the Raindrop event.`
    : "I caught the failure and filed the Raindrop event.";
  const morphLine = outcome?.deadTool && outcome.workingTool
    ? `I retired ${outcome.deadTool} and saved ${outcome.workingTool}.`
    : "I retired the dead tool and saved the new rules.";
  const atlasLine = "I checked the rerun. The old failure is gone.";

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

  return (
    <main className="arena-root">
      <div className="arena-beam" />
      <div className="arena-floor" />
      <header className="relative z-20 flex items-center justify-between gap-6 px-8 pt-6">
        <div>
          <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">Glitch Theory</p>
          <h1 className="font-serif text-4xl leading-none tracking-tight">Oops, We Evolved!</h1>
        </div>
        <button
          type="button"
          onClick={runCycle}
          disabled={running}
          className="h-14 bg-accent px-10 text-lg font-semibold tracking-wide text-black disabled:opacity-60"
        >
          {running ? "Running" : "Run"}
        </button>
      </header>

      <section className="relative z-10 grid min-h-0 flex-1 grid-cols-[1fr_1.15fr_1fr] items-center gap-2 px-8">
        <div className="flex h-full items-center justify-center">
          {showGlitch ? (
            <Cast name="GLITCH" tone="text-glitch" line={glitchLine} className="cast-arrive">
              <div className="h-64 w-64">
                <GlitchFox />
              </div>
            </Cast>
          ) : null}
        </div>

        <div className="flex h-full flex-col items-center justify-center" data-nova-form={evolved ? "pulse" : "spark"}>
          <Cast name="NOVA" tone="text-nova" line={novaLine} form={evolved ? "pulse" : "spark"}>
            <div className={`nova-bob relative h-96 w-96 ${evolved ? "is-evolved" : ""}`}>
              <div className="nova-spark">
                <NovaSpark />
              </div>
              <div className="nova-pulse">
                <NovaPulse />
              </div>
              <div className="nova-flash pointer-events-none absolute inset-0 bg-white/70 opacity-0" />
            </div>
          </Cast>
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-1">
          {showMorph ? (
            <Cast name="MORPH" tone="text-morph" line={morphLine} className="cast-arrive cast-morph">
              <div className="h-48 w-48">
                <MorphCreature />
              </div>
            </Cast>
          ) : null}
          {showAtlas ? (
            <Cast name="ATLAS" tone="text-atlas" line={atlasLine} className="cast-arrive cast-atlas">
              <div className="h-48 w-48">
                <AtlasGuardian />
              </div>
            </Cast>
          ) : null}
        </div>
      </section>

      <footer className="relative z-20 border-t border-line px-8 py-3">
        {error ? <p className="text-sm text-fail">{error}</p> : null}
        {outcome ? (
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="text-xs tracking-[0.22em] text-muted uppercase">Before</p>
              <p className="font-serif text-2xl leading-none">{outcome.deadTool ?? "—"}</p>
              <p className="text-xs tracking-[0.18em] text-muted uppercase">Off</p>
            </div>
            <p className="font-serif text-3xl text-muted" aria-hidden="true">
              →
            </p>
            <div>
              <p className="text-xs tracking-[0.22em] text-muted uppercase">After</p>
              <p className="font-serif text-2xl leading-none">{outcome.workingTool ?? "—"}</p>
              <p className="text-xs tracking-[0.18em] text-accent uppercase">On</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-xs text-muted">{outcome.eventId ?? "Raindrop not recorded"}</p>
              <p className="text-sm">{outcome.atlasVersion ? `Atlas version ${outcome.atlasVersion}` : "Atlas not saved"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Press Run. NOVA is waiting as Spark.</p>
        )}
      </footer>
    </main>
  );
}

function Cast({
  name,
  tone,
  line,
  form,
  className,
  children,
}: {
  name: "NOVA" | "GLITCH" | "MORPH" | "ATLAS";
  tone: string;
  line: string;
  form?: "spark" | "pulse";
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={`flex max-w-xs flex-col items-center text-center ${className ?? ""}`} data-voice-character={name} data-voice-text={line} data-voice-form={form}>
      {children}
      <figcaption className="mt-1">
        <p className={`text-xs font-semibold tracking-[0.22em] uppercase ${tone}`}>{name}</p>
        <p className="mt-1 text-sm leading-snug text-foreground">{line}</p>
      </figcaption>
    </figure>
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
