"use client";

import { useEffect, useRef, useState } from "react";
import { toBoard } from "@/lib/harness/board";
import Link from "next/link";
import Image from "next/image";
import {
  InfrastructureMap,
  infrastructureNodes,
} from "@/components/infrastructure-map";
import {
  LAB_STAGES,
  EXPERIMENTS,
  recordedStep,
  simulationState,
  type ExperimentId,
  type NodeId,
} from "@/lib/harness/simulation";
import {
  type CycleReport,
  type HarnessConfig,
  type FailureEvidence,
} from "@/lib/harness/types";

const stages = LAB_STAGES.map((stage) => stage.label);

export function Arena({ seed }: { seed: HarnessConfig }) {
  const [report, setReport] = useState<CycleReport | null>(null);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState<NodeId>("nova");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runNumber, setRunNumber] = useState(0);
  const [view, setView] = useState<"lab" | "world">("lab");
  const [speed, setSpeed] = useState(1);
  const [experiment, setExperiment] = useState<ExperimentId>("primary-outage");
  const [cameraReset, setCameraReset] = useState(0);
  const [follow, setFollow] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const board = toBoard(seed, report);
  const simulation = simulationState(report, stage);
  const evolved = simulation.recovered;
  const failure = recordedStep(report, 3)?.evidence as
    | FailureEvidence
    | undefined;
  const proposal = recordedStep(report, 4)?.evidence as
    | HarnessConfig
    | undefined;
  const activeStep = recordedStep(report, LAB_STAGES[stage].step);

  const visibleTests = stage >= 4 ? board.atlas.tests : [];
  const selectedNode = infrastructureNodes.find((n) => n.id === selected)!;

  useEffect(() => {
    if (!playing || !report) return;
    const timer = window.setTimeout(() => {
      if (stage < 5) {
        setStage(stage + 1);
        if (follow) setSelected(LAB_STAGES[stage + 1].actor);
      } else setPlaying(false);
    }, 3600 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, report, stage, speed, follow]);

  useEffect(() => {
    if (evidenceOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [evidenceOpen]);

  async function runMission() {
    setRunning(true);
    setPlaying(false);
    setError(null);
    setStage(0);
    setSelected("nova");
    setFollow(true);
    setReport(null);
    try {
      const response = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: experiment }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Mission failed");
      setReport(body);
      setRunNumber((n) => n + 1);
      setPlaying(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mission failed");
    } finally {
      setRunning(false);
    }
  }

  function replay() {
    setStage(0);
    if (follow) setSelected("nova");
    setPlaying(true);
  }
  function togglePlayback() {
    if (stage === 5 && !playing) {
      setStage(0);
      if (follow) setSelected("nova");
    }
    setPlaying((p) => !p);
  }
  function goToStage(next: number) {
    setPlaying(false);
    setStage(next);
    if (follow) setSelected(LAB_STAGES[next].actor);
  }
  function status(id: NodeId) {
    return running && id === "nova" ? "EXECUTING" : simulation.nodeStatus[id];
  }

  const detail =
    selected === "glitch"
      ? simulation.captured
        ? (simulation.evidence?.diagnosis.summary ?? "No diagnosis recorded.")
        : "GLITCH diagnoses the actual thrown tool error and captures its span in Raindrop evidence."
      : selected === "orbital"
        ? ((simulation.failed ? board.nova.errorMessage : null) ??
          "The scenario deliberately throws a real ToolUnavailableError when NOVA invokes orbital_uplink.")
        : selected === "archive"
          ? simulation.rejected
            ? (recordedStep(report, 5)?.detail ??
              "The fallback failed requirements.")
            : board.nova.rerun && evolved
              ? board.nova.rerun
              : "Local tool implementation holds the status brief. MORPH must authorize it before NOVA can use it."
          : selected === "morph"
            ? stage >= 3
              ? (board.morph.rationale ?? "No mutation was proposed.")
              : "Changes tools, rules and guardrails using captured failure evidence."
            : selected === "atlas"
              ? stage >= 4
                ? (board.atlas.saved ?? board.atlas.verdict ?? "No decision.")
                : "Runs requirements checks before approving and persisting a harness."
              : evolved
                ? board.nova.rerun
                : "Retrieve the arena status brief. A failed call is evidence for a new harness, never permission to invent a result.";

  return (
    <main className="lab-root">
      <header className="lab-header">
        <Link className="brand" href="/" aria-label="MORPH LAB home">
          <span className="brand-mark">◈</span> MORPH
          <span className="brand-light">LAB</span>
        </Link>
        <nav aria-label="Views">
          <button
            className={view === "lab" ? "tab active" : "tab"}
            onClick={() => setView("lab")}
          >
            Control room
          </button>
          <button
            className={view === "world" ? "tab active" : "tab"}
            onClick={() => setView("world")}
          >
            World
          </button>
        </nav>
        <span className="header-meta">
          <i className="dot" /> AGENT EVOLUTION LABORATORY <span>SF / 01</span>
        </span>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">
            RESILIENT COMMUNICATIONS / CONTROLLED EXPERIMENT
          </p>
          <h1>Failure is the beginning.</h1>
          <p className="intro-copy">
            Break the connection. Observe the evidence. Evolve the harness.
          </p>
        </div>
        <div className="mission-state">
          <span className="eyebrow">MISSION STATE</span>
          <strong>
            {running
              ? "Executing harness"
              : playing
                ? "Replaying execution"
                : simulation.rejected
                  ? "Candidate rejected"
                  : evolved
                    ? "Recovery verified"
                    : report
                      ? "Execution recorded"
                      : "Awaiting operator"}
          </strong>
          <span>
            {report
              ? `Run ${String(runNumber).padStart(3, "0")} · recorded backend result`
              : "Controlled tool scenario · real harness"}
          </span>
        </div>
      </section>
      <div className="workspace">
        <section
          className="simulation"
          aria-label="Agent infrastructure digital twin"
        >
          <div className="panel-top">
            <span>
              <i className="dot" />{" "}
              {view === "lab"
                ? "INFRASTRUCTURE DIGITAL TWIN"
                : "SAN FRANCISCO / WORLD"}
            </span>
            <span className={running ? "mode live" : "mode"}>
              {running
                ? "LIVE REQUEST"
                : report
                  ? playing
                    ? "EXECUTION REPLAY"
                    : "RECORDED RESULT"
                  : "SCENARIO READY"}
            </span>
          </div>
          {view === "world" ? (
            <div className="world-scene">
              <Image
                width={1600}
                height={900}
                src={
                  evolved
                    ? "/arena/sf-arena-after.jpg"
                    : "/arena/sf-arena-before.jpg"
                }
                alt={
                  evolved
                    ? "Original Pulse artwork after verified recovery"
                    : "Original Spark artwork before verified recovery"
                }
              />
              <div>
                <span className="eyebrow">
                  {evolved
                    ? "PULSE / VERIFIED EVOLUTION"
                    : "SPARK / ORIGINAL HARNESS"}
                </span>
                <p>
                  {evolved
                    ? board.nova.rerun
                    : "Pulse unlocks only after ATLAS approval, persistence and a successful rerun."}
                </p>
              </div>
            </div>
          ) : (
            <InfrastructureMap
              key={cameraReset}
              stage={stage}
              report={report}
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
                setFollow(false);
              }}
              playing={playing}
              running={running}
              speed={speed}
            />
          )}
          <div className="map-footer">
            <div>
              <span className="legend-dot coral" /> Failed primary{" "}
              <span className="legend-dot mint" /> Verified fallback{" "}
              <span className="legend-dot muted" /> Unbound path
            </div>
            <span>TOOL NETWORK / LOCAL SCENARIO</span>
          </div>
          {view === "lab" && (
            <div
              className="execution-stream"
              aria-label="Recorded execution events"
            >
              <div className="stream-heading">
                <span className="eyebrow">
                  {report ? "RECORDED EVENT STREAM" : "EXECUTION TELEMETRY"}
                </span>
                <span>
                  {report
                    ? `${report.steps.filter((step) => step.index <= LAB_STAGES[stage].step).length} / ${report.steps.length} events revealed`
                    : "Awaiting mission"}
                </span>
              </div>
              <div className="stream-events">
                {report ? (
                  report.steps
                    .filter((step) => step.index <= LAB_STAGES[stage].step)
                    .slice(-3)
                    .map((step) => (
                      <button
                        key={step.index}
                        onClick={() => {
                          goToStage(
                            Math.max(
                              0,
                              LAB_STAGES.findIndex(
                                (item) =>
                                  item.step ===
                                  (step.index === 6 ? 7 : step.index),
                              ),
                            ),
                          );
                        }}
                      >
                        <span className="event-seq">
                          {String(step.index).padStart(2, "0")}
                        </span>
                        <span className={`event-state ${step.status}`}>
                          {step.status}
                        </span>
                        <span>
                          <b>{step.actor}</b> {step.title}
                        </span>
                        <span>↗</span>
                      </button>
                    ))
                ) : (
                  <p>
                    Tool calls, diagnosis, configuration changes and
                    verification appear here after a real backend execution.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
        <aside className="operator">
          <div className="panel-top">
            <span>OPERATOR CONSOLE</span>
            <span>01</span>
          </div>
          <div className="operator-body">
            <p className="eyebrow">MISSION BRIEF</p>
            <h2>Restore the signal.</h2>
            <p>
              NOVA must retrieve the status brief with an unavailable primary
              tool. Watch MORPH repair the harness from the failure.
            </p>
            <div className="experiment-picker">
              <label className="eyebrow" htmlFor="experiment">
                FAULT INJECTION / LOCAL TOOLS
              </label>
              <select
                id="experiment"
                value={experiment}
                disabled={running}
                onChange={(e) => setExperiment(e.target.value as ExperimentId)}
              >
                {EXPERIMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p>
                {
                  EXPERIMENTS.find((item) => item.id === experiment)
                    ?.description
                }
              </p>
              {report && report.scenario !== experiment && (
                <p className="scenario-notice">
                  Showing the previous experiment. Run Mission to apply this
                  selection.
                </p>
              )}
            </div>
            <button
              className="run-button"
              onClick={runMission}
              disabled={running}
            >
              <span>{running ? "Executing…" : "Run Mission"}</span>
              <span>↗</span>
            </button>
            <div className="secondary-controls">
              <button onClick={replay} disabled={!report || running}>
                ↻ Replay Execution
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setStage(0);
                  setSelected("nova");
                  setFollow(true);
                  setCameraReset((n) => n + 1);
                }}
                disabled={running}
              >
                Reset View
              </button>
            </div>
            {report && (
              <div className="console-playback">
                <div>
                  <span className="eyebrow">
                    REPLAY / {String(stage + 1).padStart(2, "0")} OF 06
                  </span>
                  <span>{LAB_STAGES[stage].label}</span>
                </div>
                <div>
                  <button onClick={togglePlayback} disabled={running}>
                    {playing ? "Ⅱ Pause replay" : "▷ Play replay"}
                  </button>
                  <button
                    onClick={() => goToStage(stage + 1)}
                    disabled={running || stage === 5}
                  >
                    Next stage →
                  </button>
                </div>
                <progress max={5} value={stage} aria-label="Replay progress" />
              </div>
            )}
            <p className="control-note">
              Run executes the selected local experiment. Replay and Reset only
              change the view.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <label className="follow-control">
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => {
                  setFollow(e.target.checked);
                  if (e.target.checked) setSelected(LAB_STAGES[stage].actor);
                }}
              />{" "}
              Follow execution focus
            </label>
            <div className="node-inspector">
              <div className="eyebrow">
                SELECTED INFRASTRUCTURE <span>↗</span>
              </div>
              <div
                className="infrastructure-selector"
                aria-label="Select infrastructure"
              >
                {infrastructureNodes.map((node) => (
                  <button
                    key={node.id}
                    aria-pressed={selected === node.id}
                    onClick={() => {
                      setSelected(node.id);
                      setFollow(false);
                    }}
                  >
                    {node.short}
                  </button>
                ))}
              </div>
              <h3 style={{ color: selectedNode.color }}>
                {selectedNode.title}
              </h3>
              <span className="node-status">{status(selected)}</span>
              <p>{detail}</p>
              {selected === "glitch" && simulation.evidence && (
                <code className="inline-event-id">
                  {simulation.evidence.raindrop.eventId}
                </code>
              )}
            </div>
            <div className="integrations">
              <div>
                <span>Raindrop</span>
                <strong>
                  {stage >= 2 && failure
                    ? failure.raindrop.delivered
                      ? "Delivered"
                      : failure.raindrop.sendError
                        ? "Delivery failed"
                        : "Local capture"
                    : "Not observed"}
                </strong>
              </div>
              <div>
                <span>Persistence</span>
                <strong>
                  {stage === 5 && report
                    ? `${report.store} · ${report.steps.find((s) => s.index === 6)?.status}`
                    : "Not observed"}
                </strong>
              </div>
              <div>
                <span>Proposer</span>
                <strong>
                  {stage >= 3
                    ? (board.morph.proposer ?? "Skipped")
                    : "Not observed"}
                </strong>
              </div>
            </div>
            <button
              className="evidence-button"
              onClick={() => setEvidenceOpen(true)}
              disabled={!report}
            >
              Inspect Evidence <span>↗</span>
            </button>
          </div>
        </aside>
      </div>
      <section className="timeline">
        <div className="timeline-head">
          <div>
            <span className="eyebrow">EXECUTION PIPELINE</span>
            <h2>
              {running
                ? "Waiting for backend result"
                : activeStep
                  ? activeStep.title
                  : "One failure. A better architecture."}
            </h2>
          </div>
          <div className="playback">
            <button disabled={!report || running} onClick={togglePlayback}>
              {playing ? "Ⅱ Pause" : "▷ Play"}
            </button>
            <select
              aria-label="Replay speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1× speed</option>
              <option value={2}>2× speed</option>
              <option value={0.5}>0.5× speed</option>
            </select>
            <button
              disabled={!report || running || stage === 5}
              onClick={() => {
                goToStage(stage + 1);
              }}
            >
              Step →
            </button>
          </div>
        </div>
        <div className="stages">
          {stages.map((label, i) => (
            <button
              key={label}
              className={`stage ${stage === i ? "current" : ""} ${report && i < stage ? "complete" : ""}`}
              disabled={!report || running}
              onClick={() => {
                goToStage(i);
              }}
            >
              <span>
                {String(i + 1).padStart(2, "0")}{" "}
                {report && i < stage ? "•" : ""}
              </span>
              <strong>{label}</strong>
              <small>
                {report
                  ? i > stage
                    ? "Queued"
                    : recordedStep(report, LAB_STAGES[i].step)?.status
                  : "Pending"}
              </small>
            </button>
          ))}
        </div>
        <p className="step-detail" aria-live="polite">
          {activeStep?.detail ??
            "Run a mission to capture a new execution. Events are replayed sequentially after the backend returns."}
        </p>
      </section>
      <section className="verification-grid">
        <div className="verification-card">
          <p className="eyebrow">HARNESS CONFIGURATION</p>
          <h3>Change the architecture.</h3>
          <div className="config-row">
            <span>orbital_uplink</span>
            <code>enabled</code>
            <span>→</span>
            <code className={stage >= 3 && board.morph.v2 ? "removed" : ""}>
              {stage >= 3 && board.morph.v2
                ? String(
                    board.morph.v2.tools.find(
                      (t) => t.name === "orbital_uplink",
                    )?.enabled ?? false,
                  )
                : "pending"}
            </code>
          </div>
          <div className="config-row">
            <span>ground_archive</span>
            <code>unbound</code>
            <span>→</span>
            <code className={stage >= 3 && board.morph.v2 ? "added" : ""}>
              {stage >= 3 && board.morph.v2
                ? String(
                    board.morph.v2.tools.find(
                      (t) => t.name === "ground_archive",
                    )?.enabled ?? false,
                  )
                : "pending"}
            </code>
          </div>
          <p>
            {stage >= 3 && board.morph.v2
              ? `${stage < 4 ? `Candidate v${proposal?.version}` : simulation.rejected ? `Rejected candidate v${proposal?.version}` : board.morph.v2.versionLabel} · ${board.morph.v2.rules.length} rules · ${board.morph.v2.guardrails.length} guardrails`
              : `Harness v${seed.version} · mutation awaits evidence`}
          </p>
          <div className="config-row">
            <span>Retain failure evidence</span>
            <code>{String(seed.contextPolicy.retainFailureEvidence)}</code>
            <span>→</span>
            <code className={simulation.proposed ? "added" : ""}>
              {simulation.proposed
                ? String(proposal?.contextPolicy?.retainFailureEvidence)
                : "pending"}
            </code>
          </div>
          {simulation.proposed && board.morph.v2 && (
            <details className="config-diff">
              <summary>
                Inspect rules & guardrails <span>＋</span>
              </summary>
              <div>
                {board.morph.v2.rules
                  .filter(
                    (rule) =>
                      !seed.rules.some(
                        (original) =>
                          original.id === rule.id &&
                          original.text === rule.text,
                      ),
                  )
                  .map((rule) => (
                    <p key={rule.id}>
                      <span className="added">+ Rule</span> {rule.text}
                    </p>
                  ))}
                {board.morph.v2.guardrails
                  .filter(
                    (rule) =>
                      !seed.guardrails.some(
                        (original) =>
                          original.id === rule.id &&
                          original.text === rule.text,
                      ),
                  )
                  .map((rule) => (
                    <p key={rule.id}>
                      <span className="added">+ Guardrail</span> {rule.text}
                    </p>
                  ))}
                <p>
                  <span className="retained">Preserved</span> No fabricated
                  headline · Errors in context ·{" "}
                  {proposal?.contextPolicy?.maxContextChars} character context
                  cap
                </p>
              </div>
            </details>
          )}
        </div>
        <div className="verification-card">
          <p className="eyebrow">ATLAS / REQUIREMENTS VERIFICATION</p>
          <h3>
            {visibleTests.length
              ? `${board.atlas.passed} passed · ${board.atlas.failed} failed`
              : "Evidence before approval."}
          </h3>
          <div className="test-list">
            {visibleTests.length ? (
              visibleTests.map((t) => (
                <div key={t.label}>
                  <span className={t.passed ? "pass" : "fail"}>
                    {t.passed ? "✓" : "×"}
                  </span>
                  {t.label}
                </div>
              ))
            ) : (
              <p>
                ATLAS evaluates the proposed harness. These runtime checks are
                separate from the repository test suite.
              </p>
            )}
          </div>
        </div>
      </section>
      <footer className="lab-footer">
        <span>
          MORPH LAB <span>/ OOPS, WE EVOLVED!</span>
        </span>
        <span>
          Controlled environment. Real execution. Traceable evolution.
        </span>
      </footer>
      <dialog
        ref={dialog}
        className="evidence-dialog"
        onCancel={() => setEvidenceOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setEvidenceOpen(false);
        }}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">
              RUN {String(runNumber).padStart(3, "0")} / RECORDED EVIDENCE
            </p>
            <h2>Every change has a cause.</h2>
          </div>
          <button
            aria-label="Close evidence"
            onClick={() => setEvidenceOpen(false)}
          >
            ✕
          </button>
        </div>
        <p>
          Local tools are controlled scenario implementations. Raindrop delivery
          and MongoDB persistence are verified only when this report records
          them.
        </p>
        {failure && (
          <div className="event-id">
            RAINDROP EVENT <code>{failure.raindrop.eventId}</code>
            <span>
              {failure.raindrop.delivered
                ? "Delivered to Raindrop"
                : "Captured locally; delivery not confirmed"}
            </span>
          </div>
        )}
        <button
          className="download-button"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(report, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `morph-run-${runNumber}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download execution JSON ↓
        </button>
        {report?.steps.map((s) => (
          <details key={s.index}>
            <summary>
              {s.index}. {s.actor} / {s.title} <span>{s.status}</span>
            </summary>
            <p>{s.detail}</p>
            <pre>{JSON.stringify(s.evidence, null, 2)}</pre>
          </details>
        ))}
      </dialog>
    </main>
  );
}
