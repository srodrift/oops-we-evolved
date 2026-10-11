"use client";

import { useEffect, useRef, useState } from "react";
import { toBoard } from "@/lib/harness/board";
import Link from "next/link";
import Image from "next/image";
import {
  type CycleReport,
  type HarnessConfig,
  type FailureEvidence,
} from "@/lib/harness/types";

const stages = [
  "Challenge",
  "Execution",
  "Raindrop Diagnosis",
  "Harness Mutation",
  "ATLAS Verification",
  "Evolution",
];
const nodes = [
  {
    id: "orbital",
    x: 570,
    y: 200,
    title: "ORBITAL UPLINK",
    sub: "Primary communications",
    color: "#ff856f",
    height: 96,
  },
  {
    id: "nova",
    x: 380,
    y: 330,
    title: "NOVA",
    sub: "Agent execution core",
    color: "#b9a0ff",
    height: 76,
  },
  {
    id: "archive",
    x: 690,
    y: 390,
    title: "GROUND ARCHIVE",
    sub: "Fallback communications",
    color: "#80e4c0",
    height: 45,
  },
  {
    id: "morph",
    x: 180,
    y: 440,
    title: "MORPH",
    sub: "Harness mutation lab",
    color: "#d5ef8a",
    height: 48,
  },
  {
    id: "atlas",
    x: 470,
    y: 510,
    title: "ATLAS",
    sub: "Verification & persistence",
    color: "#8bcfee",
    height: 55,
  },
];

export function Arena({ seed }: { seed: HarnessConfig }) {
  const [report, setReport] = useState<CycleReport | null>(null);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState("nova");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runNumber, setRunNumber] = useState(0);
  const [view, setView] = useState<"lab" | "world">("lab");
  const [speed, setSpeed] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const board = toBoard(seed, report);
  const approved =
    report?.approvedVersion != null && board.atlas.verdict === "Accepted";
  const evolved = stage === 5 && approved;
  const failure = report?.steps.find((s) => s.index === 3)?.evidence as
    | FailureEvidence
    | undefined;
  const activeStep = report?.steps.find(
    (s) => s.index === [1, 2, 3, 4, 5, 7][stage],
  );
  const visibleTests = stage >= 4 ? board.atlas.tests : [];
  const selectedNode = nodes.find((n) => n.id === selected)!;

  useEffect(() => {
    if (!playing || !report) return;
    const timer = window.setTimeout(() => {
      if (stage < 5) setStage(stage + 1);
      else setPlaying(false);
    }, 1900 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, report, stage, speed]);

  useEffect(() => {
    if (evidenceOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [evidenceOpen]);

  async function runMission() {
    setRunning(true);
    setPlaying(false);
    setError(null);
    setStage(0);
    setReport(null);
    try {
      const response = await fetch("/api/cycle", { method: "POST" });
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
    setPlaying(true);
  }
  function status(id: string) {
    if (id === "orbital")
      return report && stage >= 1 ? "FAILURE CAPTURED" : "OFFLINE SCENARIO";
    if (id === "archive")
      return evolved ? "FALLBACK ACTIVE" : "AVAILABLE · UNBOUND";
    if (id === "nova")
      return running
        ? "EXECUTING"
        : evolved
          ? "MISSION RECOVERED"
          : report && stage >= 1
            ? "FAILURE OBSERVED"
            : "READY";
    if (id === "morph")
      return report && stage >= 3
        ? (board.morph.proposer ?? "NO PROPOSAL")
        : "AWAITING EVIDENCE";
    return report && stage >= 4
      ? (board.atlas.verdict?.toUpperCase() ?? "SKIPPED")
      : "AWAITING PROPOSAL";
  }
  const detail =
    selected === "orbital"
      ? (board.nova.errorMessage ??
        "The scenario deliberately throws a real ToolUnavailableError when NOVA invokes orbital_uplink.")
      : selected === "archive"
        ? board.nova.rerun && evolved
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
          <p className="eyebrow">EXPERIMENT 001 / RESILIENT COMMUNICATIONS</p>
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
            <div className="map-wrap">
              <svg
                viewBox="0 0 900 650"
                role="img"
                aria-label="Selectable isometric agent network"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="42"
                    height="42"
                    patternUnits="userSpaceOnUse"
                    patternTransform="matrix(1 .5 -1 .5 450 60)"
                  >
                    <path
                      d="M 42 0 L 0 0 0 42"
                      fill="none"
                      stroke="#28413c"
                      strokeWidth=".8"
                    />
                  </pattern>
                  <radialGradient id="halo">
                    <stop stopColor="#87d5b2" stopOpacity=".13" />
                    <stop offset="1" stopColor="#87d5b2" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>
                <rect width="900" height="650" fill="url(#grid)" />
                <ellipse
                  cx="450"
                  cy="360"
                  rx="390"
                  ry="240"
                  fill="url(#halo)"
                />
                <path
                  d="M65 294L442 104 838 306 450 527Z"
                  fill="#142924"
                  stroke="#35554a"
                />
                <path
                  d="M65 294v18L450 550 838 330v-24L450 527Z"
                  fill="#101d1b"
                  stroke="#2b463b"
                />
                <path
                  d="M95 310L468 123M160 351L532 160M238 394L610 200M314 438L688 239M387 480L763 279M164 246L552 474M245 205L631 430M324 164L710 386"
                  stroke="#2d473d"
                  strokeWidth="2"
                />
                {/* San Francisco bridge silhouette stays part of the lab, not a tool. */}
                <g opacity=".6" stroke="#dd846a" fill="none" strokeWidth="3">
                  <path d="M92 258L261 165M125 240v-68m12 61v-68m82 23v-66m12 60v-66M125 178Q180 224 231 130M92 249L261 156" />
                  <path d="M149 216v-22m22 10v-15m22 3v-21" strokeWidth="1" />
                </g>
                {[
                  [300, 235, 28],
                  [340, 214, 45],
                  [390, 186, 65],
                  [740, 304, 35],
                  [775, 324, 28],
                  [120, 348, 25],
                ].map(([x, y, h], i) => (
                  <g key={i} opacity=".7">
                    <path
                      d={`M${x} ${y}l22 -12 22 12 -22 12Z`}
                      fill="#31473d"
                    />
                    <path
                      d={`M${x} ${y}v${-h}l22 -12 22 12v${h}l-22 12Z`}
                      fill="#243930"
                      stroke="#385448"
                    />
                    <path
                      d={`M${x} ${y - h}l22 12v${h}m0 ${-h}l22 -12`}
                      fill="none"
                      stroke="#4a6050"
                    />
                  </g>
                ))}
                <g fill="none" strokeWidth="3">
                  <path
                    className={stage >= 1 && report ? "route failed" : "route"}
                    d="M380 330L460 285 570 200"
                  />
                  <path
                    className={
                      evolved ? "route recovered flow" : "route standby"
                    }
                    d="M380 330L525 411 690 390"
                  />
                  <path
                    className={
                      stage >= 3 && report
                        ? "route mutation flow"
                        : "route standby"
                    }
                    d="M380 330L180 440 470 510"
                  />
                  <path
                    className={
                      stage >= 4 && report
                        ? "route recovered flow"
                        : "route standby"
                    }
                    d="M470 510L560 465 690 390"
                  />
                </g>
                {nodes.map((n) => (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${n.title}`}
                    onClick={() => setSelected(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(n.id);
                      }
                    }}
                    className={`map-node ${selected === n.id ? "selected" : ""}`}
                    style={{ "--node-color": n.color } as React.CSSProperties}
                  >
                    <ellipse
                      cx={n.x}
                      cy={n.y + 10}
                      rx="68"
                      ry="30"
                      fill={n.color}
                      opacity=".07"
                    />
                    <path
                      d={`M${n.x - 48} ${n.y}l48 -26 48 26 -48 26Z`}
                      fill="#1b302b"
                      stroke={n.color}
                      strokeOpacity=".6"
                    />
                    <path
                      d={`M${n.x - 30} ${n.y - 6}v${-n.height}l30 -17 30 17v${n.height}l-30 17Z`}
                      fill="#223b33"
                      stroke={n.color}
                      strokeOpacity=".6"
                    />
                    <path
                      d={`M${n.x - 30} ${n.y - 6 - n.height}l30 17 30 -17m-30 17v${n.height}`}
                      fill="none"
                      stroke={n.color}
                      strokeOpacity=".7"
                    />
                    <path
                      d={`M${n.x - 19} ${n.y - n.height + 6}l12 7m-12 9l12 7m-12 9l12 7m25 -32l12 -7m-12 23l12 -7`}
                      stroke={n.color}
                      opacity=".65"
                      strokeWidth="3"
                    />
                    {n.id === "orbital" && (
                      <g stroke={n.color} fill="none">
                        <path
                          d={`M570 87v-43m-17 16q17 -19 34 0m-26 8q9 -10 18 0`}
                          strokeWidth="3"
                        />
                        <circle cx="570" cy="43" r="4" fill={n.color} />
                      </g>
                    )}
                    {n.id === "nova" && (
                      <path
                        d="M380 224l12 7v14l-12 7 -12 -7v-14Z"
                        fill={n.color}
                      />
                    )}
                    <text
                      x={n.x}
                      y={n.y + 49}
                      textAnchor="middle"
                      fill={n.color}
                      fontSize="12"
                      fontWeight="600"
                      letterSpacing="1"
                    >
                      {n.title}
                    </text>
                    <text
                      x={n.x}
                      y={n.y + 67}
                      textAnchor="middle"
                      fill="#8a9f95"
                      fontSize="9"
                    >
                      {status(n.id)}
                    </text>
                  </g>
                ))}
                <text
                  x="42"
                  y="598"
                  fill="#5e796b"
                  fontSize="10"
                  letterSpacing="2"
                >
                  SAN FRANCISCO / NETWORK TESTBED
                </text>
                <text x="825" y="598" fill="#5e796b" fontSize="10">
                  N ↗
                </text>
              </svg>
              <div className="map-note">
                <span className="map-cross">+</span> Select infrastructure to
                inspect its role and evidence.
              </div>
            </div>
          )}
          <div className="map-footer">
            <div>
              <span className="legend-dot coral" /> Failed primary{" "}
              <span className="legend-dot mint" /> Verified fallback{" "}
              <span className="legend-dot muted" /> Unbound path
            </div>
            <span>TOOL NETWORK / LOCAL SCENARIO</span>
          </div>
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
                }}
                disabled={running}
              >
                Reset View
              </button>
            </div>
            <p className="control-note">
              Run executes the backend. Replay and Reset only change the view.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="node-inspector">
              <div className="eyebrow">
                SELECTED INFRASTRUCTURE <span>↗</span>
              </div>
              <h3 style={{ color: selectedNode.color }}>
                {selectedNode.title}
              </h3>
              <span className="node-status">{status(selected)}</span>
              <p>{detail}</p>
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
            <button
              disabled={!report || running}
              onClick={() => setPlaying((p) => !p)}
            >
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
          </div>
        </div>
        <div className="stages">
          {stages.map((label, i) => (
            <button
              key={label}
              className={`stage ${stage === i ? "current" : ""} ${report && i < stage ? "complete" : ""}`}
              disabled={!report || running}
              onClick={() => {
                setPlaying(false);
                setStage(i);
              }}
            >
              <span>
                {String(i + 1).padStart(2, "0")}{" "}
                {report && i < stage ? "✓" : ""}
              </span>
              <strong>{label}</strong>
              <small>
                {report
                  ? report.steps.find((s) => s.index === [1, 2, 3, 4, 5, 7][i])
                      ?.status
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
              ? `${board.morph.v2.versionLabel} · ${board.morph.v2.rules.length} rules · ${board.morph.v2.guardrails.length} guardrails`
              : `Harness v${seed.version} · mutation awaits evidence`}
          </p>
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
