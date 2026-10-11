"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  LAB_STAGES,
  simulationState,
  type NodeId,
} from "@/lib/harness/simulation";
import type { CycleReport } from "@/lib/harness/types";
export const infrastructureNodes = [
  {
    id: "orbital",
    short: "Uplink",
    x: 570,
    y: 200,
    title: "ORBITAL UPLINK",
    sub: "Primary communications",
    color: "#ff856f",
    height: 96,
  },
  {
    id: "nova",
    short: "NOVA",
    x: 380,
    y: 330,
    title: "NOVA",
    sub: "Agent execution core",
    color: "#b9a0ff",
    height: 76,
  },
  {
    id: "archive",
    short: "Archive",
    x: 690,
    y: 390,
    title: "GROUND ARCHIVE",
    sub: "Fallback communications",
    color: "#80e4c0",
    height: 45,
  },
  {
    id: "morph",
    short: "MORPH",
    x: 180,
    y: 440,
    title: "MORPH",
    sub: "Harness mutation lab",
    color: "#d5ef8a",
    height: 48,
  },
  {
    id: "atlas",
    short: "ATLAS",
    x: 470,
    y: 510,
    title: "ATLAS",
    sub: "Verification & persistence",
    color: "#8bcfee",
    height: 55,
  },
  {
    id: "glitch",
    short: "GLITCH",
    x: 170,
    y: 300,
    title: "GLITCH / RAINDROP",
    sub: "Failure evidence station",
    color: "#eab778",
    height: 33,
  },
] satisfies {
  id: NodeId;
  short: string;
  x: number;
  y: number;
  title: string;
  sub: string;
  color: string;
  height: number;
}[];
const routes = [
  {
    id: "primary",
    path: "M380 330L460 285 570 200",
    stage: 1,
    color: "#ff856f",
    label: "TOOL CALL / EXCEPTION",
    labelX: 398,
    labelY: 280,
  },
  {
    id: "capture",
    path: "M570 200L390 245 170 300",
    stage: 2,
    color: "#eab778",
    label: "FAILURE EVIDENCE",
    labelX: 270,
    labelY: 258,
  },
  {
    id: "mutation",
    path: "M170 300L115 375 180 440L315 493 470 510",
    stage: 3,
    color: "#d5ef8a",
    label: "CANDIDATE CONFIG",
    labelX: 226,
    labelY: 472,
  },
  {
    id: "verification",
    path: "M470 510L560 465 690 390",
    stage: 4,
    color: "#8bcfee",
    label: "ATLAS TEST CALL",
    labelX: 584,
    labelY: 478,
  },
  {
    id: "fallback",
    path: "M690 390L525 411 380 330",
    stage: 5,
    color: "#80e4c0",
    label: "VERIFIED BRIEF",
    labelX: 500,
    labelY: 380,
  },
];

export function InfrastructureMap({
  report,
  stage,
  selected,
  onSelect,
  playing,
  running,
  speed,
}: {
  report: CycleReport | null;
  stage: number;
  selected: NodeId;
  onSelect: (id: NodeId) => void;
  playing: boolean;
  running: boolean;
  speed: number;
}) {
  const simulation = simulationState(report, stage);
  const renderedNodes = infrastructureNodes.map((node) => ({
    ...node,
    color:
      (node.id === "orbital" && simulation.failed) ||
      (node.id === "archive" && simulation.rejected)
        ? "#ff856f"
        : node.color,
  }));
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{
    x: number;
    y: number;
    cameraX: number;
    cameraY: number;
  } | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (playing && !reducedMotion) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, reducedMotion, stage]);
  function point(event: PointerEvent<SVGSVGElement>) {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
  }
  function startPan(event: PointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest("[data-node]")) return;
    const p = point(event);
    panRef.current = { x: p.x, y: p.y, cameraX: camera.x, cameraY: camera.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: PointerEvent<SVGSVGElement>) {
    if (!panRef.current) return;
    const p = point(event),
      origin = panRef.current;
    setCamera((c) => ({
      ...c,
      x: Math.max(-250, Math.min(250, origin.cameraX + p.x - origin.x)),
      y: Math.max(-180, Math.min(180, origin.cameraY + p.y - origin.y)),
    }));
  }
  function endPan() {
    panRef.current = null;
  }
  return (
    <div
      className={`map-wrap phase-${stage} ${playing ? "is-playing" : "is-paused"}`}
      data-recovered={simulation.recovered}
    >
      <svg
        viewBox="0 0 900 650"
        ref={svgRef}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        role="group"
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
        <g
          transform={`translate(${camera.x} ${camera.y}) translate(450 325) scale(${camera.zoom}) translate(-450 -325)`}
        >
          <ellipse cx="450" cy="360" rx="390" ry="240" fill="url(#halo)" />
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
              <path d={`M${x} ${y}l22 -12 22 12 -22 12Z`} fill="#31473d" />
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
            {routes.map((route) => {
              const state = simulation.routes[route.id];
              const packetColor = state === "failed" ? "#ff856f" : route.color;
              const isActive =
                report && route.stage === stage && state !== "idle";
              return (
                <g key={route.id}>
                  <path
                    id={`route-${route.id}`}
                    className={`route route-${state} ${isActive ? "flow" : ""}`}
                    d={route.path}
                  />
                  {isActive && (
                    <text
                      x={route.labelX}
                      y={route.labelY}
                      className="route-label"
                      fill={packetColor}
                    >
                      {route.label}
                    </text>
                  )}
                  {isActive &&
                    !reducedMotion &&
                    [0, 0.7].map((delay) => (
                      <circle
                        key={delay}
                        r="4"
                        opacity="0"
                        fill={packetColor}
                        stroke="none"
                        className="route-packet"
                      >
                        <animate
                          attributeName="opacity"
                          values="0;1;1;0"
                          keyTimes="0;.07;.92;1"
                          dur={`${1.8 / speed}s`}
                          repeatCount="indefinite"
                          begin={`${delay / speed}s`}
                        />
                        <animateMotion
                          dur={`${1.8 / speed}s`}
                          repeatCount="indefinite"
                          begin={`${delay / speed}s`}
                          path={route.path}
                        />
                      </circle>
                    ))}
                </g>
              );
            })}
          </g>
          {renderedNodes.map((n) => (
            <g
              key={n.id}
              data-node={n.id}
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${n.title}`}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(n.id);
                }
              }}
              className={`map-node ${selected === n.id ? "selected" : ""} ${report && LAB_STAGES[stage].actor === n.id ? "stage-active" : ""} ${(n.id === "orbital" && simulation.failed) || (n.id === "archive" && simulation.rejected) ? "node-failed" : ""}`}
              style={{ "--node-color": n.color } as React.CSSProperties}
            >
              <title>{`${n.title}: ${simulation.nodeStatus[n.id]}`}</title>
              {report && LAB_STAGES[stage].actor === n.id && (
                <ellipse
                  className="activity-ring"
                  cx={n.x}
                  cy={n.y + 6}
                  rx="56"
                  ry="30"
                  stroke={n.color}
                  fill="none"
                />
              )}
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
              {n.id === "glitch" && (
                <g fill="none" stroke={n.color}>
                  <ellipse cx={n.x} cy={n.y - n.height - 12} rx="22" ry="11" />
                  <path
                    d={`M${n.x - 15} ${n.y - n.height - 12}h30m-15 -8v16`}
                  />
                </g>
              )}
              {n.id === "orbital" && simulation.failed && (
                <text
                  x={n.x}
                  y={n.y - n.height - 49}
                  fill="#ff856f"
                  fontSize="25"
                  textAnchor="middle"
                >
                  ×
                </text>
              )}
              {n.id === "archive" && simulation.recovered && (
                <text
                  x={n.x}
                  y={n.y - n.height - 42}
                  fill="#80e4c0"
                  fontSize="25"
                  textAnchor="middle"
                >
                  ✓
                </text>
              )}
              {n.id === "nova" && (
                <path d="M380 224l12 7v14l-12 7 -12 -7v-14Z" fill={n.color} />
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
                {running && n.id === "nova"
                  ? "EXECUTING"
                  : simulation.nodeStatus[n.id]}
              </text>
            </g>
          ))}
        </g>
        <text x="42" y="625" fill="#5e796b" fontSize="10" letterSpacing="2">
          SAN FRANCISCO / NETWORK TESTBED
        </text>
        <text x="825" y="625" fill="#5e796b" fontSize="10">
          N ↗
        </text>
      </svg>
      <div className="simulation-hud" aria-live="polite">
        <span className="eyebrow">
          {running
            ? "BACKEND EXECUTING"
            : report
              ? `REPLAY / STAGE ${String(stage + 1).padStart(2, "0")}`
              : "MISSION READY"}
        </span>
        <h3>
          {running
            ? "Waiting for real evidence…"
            : report
              ? simulation.rejected
                ? "ATLAS blocks the candidate"
                : LAB_STAGES[stage].title
              : "A city of agent infrastructure."}
        </h3>
        <p>
          {running
            ? "The pipeline is executing. The recorded sequence begins when the backend responds."
            : report
              ? simulation.rejected
                ? "The fallback response failed requirements. No harness was saved. No evolution is authorized."
                : LAB_STAGES[stage].caption
              : "Choose a fault, run the mission, and follow the evidence through the network."}
        </p>
      </div>
      <div className="camera-controls" aria-label="Map camera">
        <button
          aria-label="Zoom in"
          disabled={camera.zoom >= 1.8}
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(1.8, c.zoom + 0.2) }))
          }
        >
          +
        </button>
        <span>{Math.round(camera.zoom * 100)}%</span>
        <button
          aria-label="Zoom out"
          disabled={camera.zoom <= 1}
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(1, c.zoom - 0.2) }))
          }
        >
          −
        </button>
        <button
          aria-label="Fit map"
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
        >
          ⌖
        </button>
      </div>
      <div className="map-note">
        <span className="map-cross">+</span> Select to inspect · Drag to pan ·
        Zoom to explore
      </div>
    </div>
  );
}
