"use client";

import { useEffect, useState } from "react";
import { toBoard, type Board, type HarnessColumn } from "@/lib/harness/board";
import { ARENA_TASK, type CycleReport, type HarnessConfig } from "@/lib/harness/types";

type Stage = "challenge" | "failure" | "diagnosis" | "mutation" | "atlas" | "evolution";

const STAGE_LABEL: Record<Stage, string> = {
  challenge: "Challenge",
  failure: "Failure",
  diagnosis: "Raindrop Diagnosis",
  mutation: "Harness Mutation",
  atlas: "ATLAS Evaluation",
  evolution: "Evolution",
};

export function Arena({ seed }: { seed: HarnessConfig }) {
  const [report, setReport] = useState<CycleReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<Stage>("challenge");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const board = toBoard(seed, report);
  const outcome = board.ran ? readOutcome(board) : null;
  const approved = board.morph.v2State === "approved" && board.atlas.verdict === "Accepted";
  const showPulse = stage === "evolution" && approved;
  const line = dialogue(stage, outcome, approved);

  useEffect(() => {
    if (!report) {
      return;
    }
    const next = toBoard(seed, report);
    const ok = next.morph.v2State === "approved" && next.atlas.verdict === "Accepted";
    const sequence = sequenceFrom(next, ok);
    let index = 0;
    setStage(sequence[0] ?? "failure");
    const timer = window.setInterval(() => {
      index += 1;
      if (index >= sequence.length) {
        window.clearInterval(timer);
        return;
      }
      setStage(sequence[index]);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [report, seed]);

  async function runCycle() {
    setRunning(true);
    setError(null);
    setEvidenceOpen(false);
    setStage("challenge");
    try {
      const response = await fetch("/api/cycle", { method: "POST" });
      const body = (await response.json()) as CycleReport & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Cycle failed");
      }
      setReport(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cycle failed");
      setStage("challenge");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="cine-root" data-stage={stage} data-nova-form={showPulse ? "pulse" : "spark"} data-approved={approved ? "true" : "false"}>
      <img
        src="/arena/sf-arena-before.jpg"
        alt="NOVA as Spark on the arena platform"
        className={`cine-shot ${showPulse ? "cine-shot-out" : "cine-shot-in"}`}
      />
      <img
        src="/arena/sf-arena-after.jpg"
        alt="NOVA as Pulse after the harness is approved"
        className={`cine-shot ${showPulse ? "cine-shot-in" : "cine-shot-out"}`}
      />
      <div className={`cine-treatment treatment-${stage}`} />
      <div className="cine-shade" />

      <header className="cine-top">
        <h1 className="font-serif text-4xl leading-none text-white">Oops, We Evolved!</h1>
        <button
          type="button"
          onClick={runCycle}
          disabled={running}
          className="h-12 bg-accent px-8 text-base font-semibold tracking-wide text-black disabled:opacity-60"
        >
          {running ? "Running" : "Run"}
        </button>
      </header>

      <p className="cine-stage">{STAGE_LABEL[stage]}</p>

      <footer className="cine-caption">
        <p className="cine-speaker" data-voice-character={line.speaker}>
          {line.speaker}
        </p>
        <p key={`${stage}-${line.text}`} className="cine-line" data-voice-text={line.text} data-voice-form={showPulse ? "pulse" : "spark"}>
          {line.text}
        </p>
        {error ? <p className="mt-2 text-sm text-fail">{error}</p> : null}
        <button type="button" className="cine-evidence-toggle" onClick={() => setEvidenceOpen((open) => !open)} aria-expanded={evidenceOpen}>
          {evidenceOpen ? "Hide evidence" : "Evidence"}
        </button>
        {evidenceOpen ? (
          <p className="cine-evidence">
            {outcome
              ? `${outcome.deadTool ?? "—"} → ${outcome.workingTool ?? "—"} · ${outcome.eventId ?? "no event"} · Atlas ${outcome.atlasVersion ? `v${outcome.atlasVersion}` : "not saved"} · ${board.atlas.passed} passed / ${board.atlas.failed} failed`
              : "No cycle yet."}
          </p>
        ) : null}
      </footer>
    </main>
  );
}

function sequenceFrom(board: Board, approved: boolean): Stage[] {
  const sequence: Stage[] = [];
  if (board.nova.invoked && board.nova.errorName) {
    sequence.push("failure");
  }
  if (board.glitch.summary) {
    sequence.push("diagnosis");
  }
  if (board.morph.v2) {
    sequence.push("mutation");
  }
  if (board.atlas.verdict) {
    sequence.push("atlas");
  }
  if (approved) {
    sequence.push("evolution");
  }
  return sequence;
}

function dialogue(
  stage: Stage,
  outcome: ReturnType<typeof readOutcome> | null,
  approved: boolean,
): { speaker: string; text: string } {
  const dead = outcome?.deadTool ?? "the dead tool";
  const live = outcome?.workingTool ?? "the working tool";
  if (stage === "failure") {
    return { speaker: "NOVA", text: "That tool died. I won't invent the headline." };
  }
  if (stage === "diagnosis") {
    return { speaker: "GLITCH", text: `I caught ${dead} and filed the Raindrop event.` };
  }
  if (stage === "mutation") {
    return { speaker: "MORPH", text: `I retired ${dead} and saved ${live}.` };
  }
  if (stage === "atlas") {
    return {
      speaker: "ATLAS",
      text: approved ? "I checked the rerun. The old failure is gone." : "I checked the rerun. It does not hold.",
    };
  }
  if (stage === "evolution") {
    return { speaker: "NOVA", text: "The job is done. I became Pulse." };
  }
  return { speaker: "NOVA", text: "I'll run it with the only tool I'm allowed." };
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
