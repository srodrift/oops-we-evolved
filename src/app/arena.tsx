"use client";

import { useState, type ReactNode } from "react";
import { toBoard, type HarnessColumn } from "@/lib/harness/board";
import { ARENA_TASK, type HarnessConfig } from "@/lib/harness/types";
import type { CycleReport } from "@/lib/harness/types";

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

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-3 px-4 py-3 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold tracking-[0.28em] text-morph">GLITCH THEORY</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Oops, We Evolved!</h1>
          <p className="max-w-3xl text-lg text-foreground">{ARENA_TASK.instruction}</p>
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <button
            type="button"
            onClick={runCycle}
            disabled={running}
            className="h-14 min-w-40 bg-atlas px-8 text-2xl font-bold text-black disabled:opacity-60"
          >
            {running ? "Running" : "Run"}
          </button>
          <p className="text-sm text-muted">No API keys required.</p>
        </div>
      </header>

      {error ? <p className="bg-fail px-4 py-2 text-lg font-semibold text-black">{error}</p> : null}
      {board.banner ? <p className="bg-foreground px-4 py-2 text-lg font-semibold text-black">{board.banner}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Stage name="NOVA" tone="nova">
          <p className="text-lg">{board.nova.call ?? board.nova.waiting}</p>
          {board.nova.errorName ? (
            <div className="mt-2 border-2 border-fail bg-black/40 p-2">
              <p className="font-mono text-2xl font-bold text-fail">{board.nova.errorName}</p>
              <p className="mt-1 font-mono text-lg leading-snug">{board.nova.errorMessage}</p>
              <p className="mt-2 text-base font-semibold">Invoked: {board.nova.invoked ? "yes" : "no"}</p>
            </div>
          ) : null}
          {board.nova.rerun ? <p className="mt-2 text-lg font-semibold text-atlas">{board.nova.rerun}</p> : null}
        </Stage>

        <Stage name="GLITCH" tone="glitch">
          <p className="text-lg leading-snug">{board.glitch.summary ?? board.glitch.waiting}</p>
          {board.glitch.raindrop ? <p className="mt-2 text-lg font-semibold">{board.glitch.raindrop}</p> : null}
        </Stage>

        <Stage name="MORPH" tone="morph">
          <p className="text-lg">
            {board.morph.proposer ? `${board.morph.proposer} ${board.morph.rationale ?? ""}` : board.morph.waiting}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <HarnessPane column={board.morph.v1} />
            {board.morph.v2 ? (
              <HarnessPane column={board.morph.v2} approved={board.morph.v2State === "approved"} />
            ) : (
              <div className="border border-dashed border-morph/60 p-3 text-base text-muted">No approved harness yet.</div>
            )}
          </div>
        </Stage>

        <Stage name="ATLAS" tone="atlas">
          {board.atlas.verdict ? (
            <>
              <p className="text-3xl font-bold">{board.atlas.verdict}</p>
              <p className="text-lg">
                {board.atlas.passed} passed, {board.atlas.failed} failed.
              </p>
              {board.atlas.saved ? <p className="text-lg font-semibold">{board.atlas.saved}</p> : null}
              {board.atlas.resolution ? <p className="text-base leading-snug">{board.atlas.resolution}</p> : null}
              <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-4">
                {board.atlas.tests.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-base leading-snug">
                    <span className={item.passed ? "font-bold text-atlas" : "font-bold text-fail"}>
                      {item.passed ? "PASS" : "FAIL"}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-lg">{board.atlas.waiting}</p>
          )}
        </Stage>
      </div>
    </main>
  );
}

function Stage({
  name,
  tone,
  children,
}: {
  name: "NOVA" | "GLITCH" | "MORPH" | "ATLAS";
  tone: "nova" | "glitch" | "morph" | "atlas";
  children: ReactNode;
}) {
  const frame = {
    nova: "border-nova bg-nova-bg",
    glitch: "border-glitch bg-glitch-bg",
    morph: "border-morph bg-morph-bg",
    atlas: "border-atlas bg-atlas-bg",
  }[tone];
  const chip = {
    nova: "bg-nova",
    glitch: "bg-glitch",
    morph: "bg-morph",
    atlas: "bg-atlas",
  }[tone];

  return (
    <section className={`border-2 p-3 ${frame}`}>
      <h2 className={`inline-block px-3 py-0.5 text-xl font-bold text-black ${chip}`}>{name}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function HarnessPane({ column, approved = false }: { column: HarnessColumn; approved?: boolean }) {
  return (
    <div className={`border p-2 ${approved ? "border-atlas" : "border-white/20"}`}>
      <p className="text-base font-bold">{column.versionLabel}</p>
      <p className="mt-2 text-sm font-bold tracking-wide text-muted">TOOLS</p>
      <ul className="mt-1 space-y-0.5">
        {column.tools.map((tool) => (
          <li key={tool.name} className="flex items-center justify-between gap-2 font-mono text-base">
            <span>{tool.name}</span>
            <span className={tool.enabled ? "font-bold text-atlas" : "text-muted"}>{tool.enabled ? "ON" : "OFF"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm font-bold tracking-wide text-muted">RULES</p>
      <ul className="mt-1 space-y-0.5 text-base leading-tight">
        {column.rules.map((rule) => (
          <li key={rule.id}>{rule.text}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm font-bold tracking-wide text-muted">GUARDRAILS</p>
      <ul className="mt-1 space-y-0.5 text-base leading-tight">
        {column.guardrails.map((guardrail) => (
          <li key={guardrail.id}>{guardrail.text}</li>
        ))}
      </ul>
    </div>
  );
}
