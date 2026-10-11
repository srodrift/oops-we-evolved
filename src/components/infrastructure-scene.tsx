"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { InfrastructureMap, infrastructureNodes } from "./infrastructure-map";
import {
  LAB_STAGES,
  simulationState,
  type NodeId,
  type RouteState,
} from "@/lib/harness/simulation";
import type { CycleReport } from "@/lib/harness/types";

const positions: Record<NodeId, [number, number]> = {
  nova: [0, 0],
  orbital: [2, -5],
  glitch: [-5, -2],
  morph: [-5, 4],
  atlas: [1, 6],
  archive: [6, 2],
};
const heights: Record<NodeId, number> = {
  nova: 2.4,
  orbital: 3.7,
  glitch: 1.25,
  morph: 1.5,
  atlas: 1.9,
  archive: 1.6,
};
const paths = [
  {
    id: "primary",
    stage: 1,
    points: [
      [0, 0],
      [1, -2],
      [2, -5],
    ],
  },
  {
    id: "capture",
    stage: 2,
    points: [
      [2, -5],
      [-2, -5],
      [-5, -2],
    ],
  },
  {
    id: "mutation",
    stage: 3,
    points: [
      [-5, -2],
      [-7, 1],
      [-5, 4],
      [-2, 6],
      [1, 6],
    ],
  },
  {
    id: "verification",
    stage: 4,
    points: [
      [1, 6],
      [4, 5],
      [6, 2],
    ],
  },
  {
    id: "fallback",
    stage: 5,
    points: [
      [6, 2],
      [4, 1],
      [0, 0],
    ],
  },
];
const routeColors: Record<RouteState, string> = {
  idle: "#355446",
  failed: "#ff856f",
  evidence: "#eab778",
  proposed: "#d5ef8a",
  verified: "#8bcfee",
  recovered: "#80e4c0",
};

type Props = {
  report: CycleReport | null;
  stage: number;
  selected: NodeId;
  onSelect: (id: NodeId) => void;
  playing: boolean;
  running: boolean;
  speed: number;
};

export function InfrastructureScene(props: Props) {
  const { report, stage, selected, onSelect, playing, running, speed } = props;
  const snapshot = simulationState(report, stage);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<Partial<Record<NodeId, HTMLButtonElement>>>({});
  const visualRef = useRef({
    snapshot,
    stage,
    selected,
    playing,
    running,
    speed,
  });
  const selectRef = useRef(onSelect);
  const actionsRef = useRef<{
    rotate: (direction: number) => void;
    zoom: (factor: number) => void;
    fit: () => void;
    orbit: (enabled: boolean) => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [orbit, setOrbit] = useState(false);
  useEffect(() => {
    visualRef.current = { snapshot, stage, selected, playing, running, speed };
    selectRef.current = onSelect;
  }, [snapshot, stage, selected, playing, running, speed, onSelect]);
  useEffect(() => {
    actionsRef.current?.orbit(orbit);
  }, [orbit]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      const fallbackTimer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#0c1b16");
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Rotatable 3D agent infrastructure",
    );
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);
    host.dataset.renderMode = "webgl";
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#0c1b16", 0.017);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 150);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 16;
    controls.maxDistance = 44;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.autoRotateSpeed = 0.8;
    const fit = () => {
      camera.position.set(19, 19, 24);
      controls.target.set(0, 0.7, 1);
      controls.update();
    };
    fit();
    actionsRef.current = {
      fit,
      rotate(direction) {
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          (direction * Math.PI) / 8,
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      zoom(factor) {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(factor);
        offset.setLength(THREE.MathUtils.clamp(offset.length(), 16, 44));
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      orbit(enabled) {
        controls.autoRotate = enabled;
      },
    };
    scene.add(new THREE.HemisphereLight("#bad8cc", "#15261a", 2));
    const sun = new THREE.DirectionalLight("#f0ffd0", 3.5);
    sun.position.set(-8, 18, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -15,
      right: 15,
      top: 15,
      bottom: -15,
    });
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const fill = new THREE.PointLight("#6b9dff", 35, 35);
    fill.position.set(8, 8, -5);
    scene.add(fill);
    const material = (color: string, emissive?: string) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.25,
        emissive: emissive || "#000000",
        emissiveIntensity: 0.3,
      });
    function box(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      parent: THREE.Object3D = scene,
    ) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    const baseMat = material("#1a3328"),
      roadMat = material("#243e31"),
      cityMat = material("#29443a"),
      edgeMat = material("#406450");
    box(21, 0.6, 18, 0, -0.4, 1, baseMat);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(21, 0.6, 18)),
      new THREE.LineBasicMaterial({ color: "#638661" }),
    );
    edges.position.set(0, -0.4, 1);
    scene.add(edges);
    const grid = new THREE.GridHelper(21, 21, "#43604a", "#284738");
    grid.position.set(0, -0.08, 1);
    scene.add(grid);
    for (const x of [-8, -3, 3, 8]) box(0.12, 0.025, 17, x, -0.03, 1, roadMat);
    for (const z of [-6, -1, 4, 8]) box(20, 0.025, 0.12, 0, -0.025, z, roadMat);
    // Bay and suspension bridge provide SF context, not fictional executable tools.
    box(3, 0.05, 16, -8.5, 0.02, 1, material("#123640"));
    const bridge = material("#975745", "#3b1710");
    box(0.7, 0.15, 11, -8.4, 0.55, -0.1, bridge);
    for (const z of [-4, 3]) {
      box(0.12, 2.6, 0.18, -8.85, 1.65, z, bridge);
      box(0.12, 2.6, 0.18, -7.95, 1.65, z, bridge);
      box(1.05, 0.12, 0.18, -8.4, 2.8, z, bridge);
    }
    for (const x of [-8.85, -7.95]) {
      const cable = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 2.8, -4),
        new THREE.Vector3(x, 1.1, -0.5),
        new THREE.Vector3(x, 2.8, 3),
      ]);
      scene.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(cable, 30, 0.025, 4, false),
          bridge,
        ),
      );
      for (let z = -3.5; z < 3; z += 0.7) {
        const t = (z + 4) / 7;
        const y = 2.8 - 1.7 * Math.sin(Math.PI * t);
        box(0.025, y - 0.65, 0.025, x, (y + 0.65) / 2, z, bridge);
      }
    }
    for (const [x, z, h] of [
      [-1, -6, 1.7],
      [0, -7, 2.6],
      [4, -6, 1.5],
      [5, -5, 2.1],
      [7, -4, 1.3],
      [8, -3, 0.8],
      [-6, 7, 0.6],
      [-3, 8, 0.7],
    ]) {
      box(0.85, h, 0.9, x, h / 2, z, cityMat);
      for (let y = 0.35; y < h - 0.1; y += 0.4)
        box(0.88, 0.04, 0.94, x, y, z, edgeMat);
    }
    for (const [x, z] of [
      [-6, -6],
      [-6, -5],
      [8, 5],
      [8, 6],
      [7, 7],
      [-2, 3],
    ]) {
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.9, 7),
        material("#496342"),
      );
      tree.position.set(x, 0.6, z);
      scene.add(tree);
      box(0.07, 0.3, 0.07, x, 0.15, z, cityMat);
    }
    const bodies = new Map<
      NodeId,
      {
        body: THREE.Mesh;
        trim: THREE.MeshStandardMaterial;
        ring: THREE.Mesh;
        anchor: THREE.Vector3;
      }
    >();
    const pickables: THREE.Object3D[] = [];
    for (const node of infrastructureNodes) {
      const [x, z] = positions[node.id],
        h = heights[node.id],
        w = node.id === "archive" ? 1.9 : 1.3;
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      scene.add(group);
      const trim = material(node.color, node.color),
        bodyMat = material("#213d32", node.color);
      bodyMat.emissiveIntensity = 0.05;
      const body = box(w, h, 1.3, 0, h / 2, 0, bodyMat, group);
      body.userData.nodeId = node.id;
      pickables.push(body);
      box(w + 0.4, 0.15, 1.65, 0, 0.08, 0, baseMat, group);
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(body.geometry),
        new THREE.LineBasicMaterial({ color: node.color }),
      );
      wire.position.copy(body.position);
      group.add(wire);
      for (let y = 0.3; y < h; y += 0.45) {
        box(w + 0.02, 0.045, 1.32, 0, y, 0, trim, group);
      }
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.025, 6, 60),
        trim,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.14;
      group.add(ring);
      if (node.id === "orbital") {
        box(0.07, 1.2, 0.07, 0, h + 0.6, 0, trim, group);
        for (const r of [0.45, 0.7]) {
          const dish = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.025, 6, 36, Math.PI),
            trim,
          );
          dish.position.set(0, h + 0.65, 0);
          group.add(dish);
        }
      } else if (node.id === "nova" || node.id === "morph") {
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), trim);
        core.position.set(0, h + 0.5, 0);
        group.add(core);
      } else if (node.id === "glitch") {
        const dish = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.04, 8, 36),
          trim,
        );
        dish.rotation.x = -Math.PI / 2;
        dish.position.y = h + 0.3;
        group.add(dish);
      } else if (node.id === "atlas") {
        box(0.55, 0.12, 0.55, 0, h + 0.25, 0, trim, group);
      }
      bodies.set(node.id, {
        body,
        trim,
        ring,
        anchor: new THREE.Vector3(x, h + 1.0, z),
      });
    }
    const connections = paths.map((path) => {
      const curve = new THREE.CatmullRomCurve3(
        path.points.map(([x, z]) => new THREE.Vector3(x, 0.2, z)),
        false,
        "centripetal",
      );
      const mat = new THREE.MeshStandardMaterial({
        color: "#355446",
        emissive: "#355446",
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.35,
      });
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 60, 0.035, 6, false),
        mat,
      );
      scene.add(tube);
      const packets = [0, 0.5].map(() => {
        const packet = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 10),
          new THREE.MeshBasicMaterial({ color: "#d5ef8a" }),
        );
        packet.visible = false;
        scene.add(packet);
        return packet;
      });
      return { ...path, curve, mat, packets };
    });
    const resize = () => {
      const width = host.clientWidth,
        height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const raycaster = new THREE.Raycaster();
    let pointerStart: { x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const pointerUp = (event: PointerEvent) => {
      if (
        !pointerStart ||
        Math.hypot(
          event.clientX - pointerStart.x,
          event.clientY - pointerStart.y,
        ) > 6
      )
        return;
      const bounds = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(pickables)[0];
      if (hit) selectRef.current(hit.object.userData.nodeId as NodeId);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      elapsed = 0,
      lastTime = performance.now(),
      lastStage = -1;
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const current = visualRef.current;
      if (current.stage !== lastStage) {
        elapsed = 0;
        lastStage = current.stage;
      }
      if (current.playing && !reduced.matches) elapsed += dt * current.speed;
      controls.update(dt);
      for (const node of infrastructureNodes) {
        const data = bodies.get(node.id)!;
        const failed =
          (node.id === "orbital" && current.snapshot.failed) ||
          (node.id === "archive" && current.snapshot.rejected);
        const color = failed ? "#ff856f" : node.color;
        data.trim.color.set(color);
        data.trim.emissive.set(color);
        const focused =
          current.selected === node.id ||
          (LAB_STAGES[current.stage].actor === node.id &&
            current.snapshot.failed);
        data.trim.emissiveIntensity = focused ? 0.65 : 0.15;
        (data.body.material as THREE.MeshStandardMaterial).emissive.set(color);
        (data.body.material as THREE.MeshStandardMaterial).emissiveIntensity =
          focused ? 0.13 : 0.035;
        data.ring.visible = focused;
        if (current.playing && !reduced.matches)
          data.ring.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.05);
        const point = data.anchor.clone().project(camera),
          label = labelsRef.current[node.id];
        if (label) {
          label.style.left = `${(point.x * 0.5 + 0.5) * host.clientWidth}px`;
          label.style.top = `${(-point.y * 0.5 + 0.5) * host.clientHeight}px`;
          label.style.visibility =
            point.z > 1 || Math.abs(point.x) > 1.1 || Math.abs(point.y) > 1.1
              ? "hidden"
              : "visible";
        }
      }
      for (const connection of connections) {
        const state = current.snapshot.routes[connection.id];
        const color = routeColors[state];
        connection.mat.color.set(color);
        connection.mat.emissive.set(color);
        connection.mat.opacity = state === "idle" ? 0.25 : 1;
        const active = current.stage === connection.stage && state !== "idle";
        connection.packets.forEach((packet, i) => {
          packet.visible = active && !reduced.matches;
          (packet.material as THREE.MeshBasicMaterial).color.set(color);
          packet.position.copy(
            connection.curve.getPointAt((elapsed * 0.55 + i * 0.5) % 1),
          );
        });
      }
      renderer.domElement.dataset.orbit = camera.position
        .toArray()
        .map((n) => n.toFixed(2))
        .join(",");
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      actionsRef.current = null;
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  if (failed)
    return (
      <div>
        <p className="webgl-fallback">
          3D graphics unavailable in this browser. Blueprint controls remain
          available.
        </p>
        <InfrastructureMap {...props} />
      </div>
    );
  return (
    <div className="scene-shell" data-recovered={snapshot.recovered}>
      <div ref={hostRef} className="scene-canvas" />
      <div className="scene-labels">
        {infrastructureNodes.map((node) => (
          <button
            key={node.id}
            ref={(element) => {
              if (element) labelsRef.current[node.id] = element;
            }}
            aria-label={`Inspect ${node.title} in 3D`}
            aria-pressed={selected === node.id}
            className={`scene-label ${selected === node.id ? "selected" : ""}`}
            onClick={() => onSelect(node.id)}
            style={
              {
                "--node-color":
                  (node.id === "orbital" && snapshot.failed) ||
                  (node.id === "archive" && snapshot.rejected)
                    ? "#ff856f"
                    : node.color,
              } as React.CSSProperties
            }
          >
            <strong>{node.title}</strong>
            <span>{snapshot.nodeStatus[node.id]}</span>
          </button>
        ))}
      </div>
      <div className="simulation-hud">
        <span className="eyebrow">
          {running
            ? "BACKEND EXECUTING"
            : report
              ? `EXECUTION REPLAY / ${String(stage + 1).padStart(2, "0")}`
              : "3D AGENT INFRASTRUCTURE"}
        </span>
        <h3>
          {running
            ? "Waiting for real evidence…"
            : snapshot.rejected
              ? "Wrong answer. Repair rejected."
              : report
                ? LAB_STAGES[stage].title
                : "Your brief. A verifiable repair."}
        </h3>
        <p>
          {snapshot.rejected
            ? "A responding tool isn't enough. The result must match the operator's source brief."
            : report
              ? LAB_STAGES[stage].caption
              : "Supply an incident brief, choose a fault, and follow the repair through the network."}
        </p>
      </div>
      <div className="scene-camera" aria-label="3D camera controls">
        <button
          aria-label="Rotate left"
          onClick={() => actionsRef.current?.rotate(-1)}
        >
          ↶
        </button>
        <button
          aria-label="Rotate right"
          onClick={() => actionsRef.current?.rotate(1)}
        >
          ↷
        </button>
        <button
          aria-label="Zoom in 3D"
          onClick={() => actionsRef.current?.zoom(0.85)}
        >
          +
        </button>
        <button
          aria-label="Zoom out 3D"
          onClick={() => actionsRef.current?.zoom(1.15)}
        >
          −
        </button>
        <button
          aria-label="Fit 3D scene"
          onClick={() => {
            setOrbit(false);
            actionsRef.current?.fit();
          }}
        >
          ⌖
        </button>
        <button aria-pressed={orbit} onClick={() => setOrbit((o) => !o)}>
          Auto orbit
        </button>
      </div>
      <p className="scene-hint">
        Drag to rotate · Scroll to zoom · Shift-drag to pan · Select
        infrastructure to inspect
      </p>
    </div>
  );
}
