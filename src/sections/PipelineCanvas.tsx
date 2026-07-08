import { useEffect, useRef } from "react";

/**
 * Animated 2D-canvas diagram of my actual delivery loop:
 *
 *   plan → parallel AI agents → human review → CI/CD → QA/staging → production
 *
 * Work items start gray and pick up color as they mature through each gate,
 * reaching full accent green in production. Items rejected at review, CI/CD,
 * or QA return to plan (yellow, along the lower arc) and re-enter the flow.
 * Production stacks every shipped item into a chip; when the chip completes,
 * the version ships and the board clears for the next build.
 *
 * Colors come from the site's CSS variables so the canvas follows the theme.
 * The loop pauses off-screen and falls back to a static frame when the user
 * prefers reduced motion.
 */

const LANES = 3;
const SPAWN_MS = 650;
const JOURNEY_MS = 5600;
const RETURN_MS = 2200;
const MAX_PARTICLES = 18;
const CHIP = 36;
const GRID = 4;
const TARGET = GRID * GRID;
const CELEBRATE_MS = 1700;

interface Point {
  x: number;
  y: number;
}

type Gate = "review" | "cicd" | "staging";

interface Geometry {
  w: number;
  h: number;
  plan: Point;
  laneStarts: Point[];
  laneEnds: Point[];
  review: Point;
  cicd: Point;
  staging: Point;
  prod: Point;
  /** cumulative boundaries (0..1) per lane: curve-in, lane, review, cicd, staging */
  segments: number[][];
}

interface Particle {
  lane: number;
  t: number;
  /** where this item will be sent back, decided at spawn; null = ships */
  fate: Gate | null;
  mode: "fwd" | "ret";
  retFrom: Point | null;
}

interface Colors {
  fg: string;
  muted: string;
  border: string;
  accent: string;
  yellow: string;
  stage1: string; // review → ci/cd
  stage2: string; // ci/cd → staging
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

function readColors(): Colors {
  const s = getComputedStyle(document.documentElement);
  const muted = s.getPropertyValue("--muted").trim();
  const accent = s.getPropertyValue("--accent").trim();
  const bg = s.getPropertyValue("--bg").trim();
  const [r, g, b] = hexToRgb(bg);
  const darkTheme = (r + g + b) / 3 < 128;
  return {
    fg: s.getPropertyValue("--fg").trim(),
    muted,
    border: s.getPropertyValue("--border").trim(),
    accent,
    yellow: darkTheme ? "#fbbf24" : "#b45309",
    stage1: mix(muted, accent, 0.45),
    stage2: mix(muted, accent, 0.72),
  };
}

function cubicAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function quadAt(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function curveIn(g: Geometry, lane: number, t: number): Point {
  const s = g.laneStarts[lane];
  const midX = (g.plan.x + s.x) / 2;
  return cubicAt(g.plan, { x: midX, y: g.plan.y }, { x: midX, y: s.y }, s, t);
}

function curveOut(g: Geometry, lane: number, t: number): Point {
  const e = g.laneEnds[lane];
  const midX = (e.x + g.review.x) / 2;
  return cubicAt(e, { x: midX, y: e.y }, { x: midX, y: g.review.y }, g.review, t);
}

function pointAt(g: Geometry, lane: number, t: number): Point {
  const [b1, b2, b3, b4, b5] = g.segments[lane];
  if (t <= b1) return curveIn(g, lane, t / b1);
  if (t <= b2) return lerp(g.laneStarts[lane], g.laneEnds[lane], (t - b1) / (b2 - b1));
  if (t <= b3) return curveOut(g, lane, (t - b2) / (b3 - b2));
  if (t <= b4) return lerp(g.review, g.cicd, (t - b3) / (b4 - b3));
  if (t <= b5) return lerp(g.cicd, g.staging, (t - b4) / (b5 - b4));
  return lerp(g.staging, g.prod, (t - b5) / (1 - b5));
}

function computeGeometry(w: number, h: number): Geometry {
  const cy = h * 0.42;
  const spread = Math.min(h * 0.24, 46);
  const plan = { x: w * 0.05, y: cy };
  const review = { x: w * 0.5, y: cy };
  const cicd = { x: w * 0.63, y: cy };
  const staging = { x: w * 0.76, y: cy };
  const prod = { x: w * 0.92, y: cy };
  const laneStarts: Point[] = [];
  const laneEnds: Point[] = [];
  for (let i = 0; i < LANES; i++) {
    const y = cy + (i - (LANES - 1) / 2) * spread;
    laneStarts.push({ x: w * 0.17, y });
    laneEnds.push({ x: w * 0.37, y });
  }
  const segments = laneStarts.map((s, i) => {
    const e = laneEnds[i];
    const lens = [
      Math.hypot(s.x - plan.x, s.y - plan.y),
      Math.hypot(e.x - s.x, e.y - s.y),
      Math.hypot(review.x - e.x, review.y - e.y),
      cicd.x - review.x,
      staging.x - cicd.x,
      prod.x - staging.x,
    ];
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    return lens.slice(0, 5).map((l) => (acc += l) / total);
  });
  return { w, h, plan, laneStarts, laneEnds, review, cicd, staging, prod, segments };
}

/** decide at spawn where (if anywhere) this item gets sent back */
function rollFate(): Gate | null {
  const r = Math.random();
  if (r < 0.14) return "review";
  if (r < 0.24) return "cicd";
  if (r < 0.32) return "staging";
  return null;
}

export default function PipelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let colors = readColors();
    let geometry: Geometry | null = null;
    let particles: Particle[] = [];
    const pulses: Record<string, { v: number; color: string }> = {};
    let totalBuilt = 0;
    let celebrateUntil = 0;
    let celebratedVersion = 0;
    let raf = 0;
    let running = false;
    let lastSpawn = 0;
    let lastFrame = 0;
    let now = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const gatePoint = (g: Geometry, gate: Gate): Point =>
      gate === "review" ? g.review : gate === "cicd" ? g.cicd : g.staging;

    const gateBoundary = (g: Geometry, lane: number, gate: Gate): number =>
      gate === "review"
        ? g.segments[lane][2]
        : gate === "cicd"
          ? g.segments[lane][3]
          : g.segments[lane][4];

    const stageColor = (g: Geometry, lane: number, t: number): string => {
      const [, , b3, b4, b5] = g.segments[lane];
      if (t <= b3) return colors.muted;
      if (t <= b4) return colors.stage1;
      if (t <= b5) return colors.stage2;
      return colors.accent;
    };

    const pulse = (key: string, color: string) => {
      pulses[key] = { v: 1, color };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      geometry = computeGeometry(w, h);
      if (reducedMotion.matches) drawStatic();
    };

    const drawEdges = (g: Geometry) => {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (let i = 0; i < LANES; i++) {
        ctx.beginPath();
        let p = curveIn(g, i, 0);
        ctx.moveTo(p.x, p.y);
        for (let s = 1; s <= 20; s++) {
          p = curveIn(g, i, s / 20);
          ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(g.laneEnds[i].x, g.laneEnds[i].y);
        for (let s = 1; s <= 20; s++) {
          p = curveOut(g, i, s / 20);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(g.review.x, g.review.y);
      ctx.lineTo(g.prod.x - CHIP / 2 - 2, g.prod.y);
      ctx.stroke();
      // faint hint of the send-back loop
      ctx.beginPath();
      ctx.setLineDash([2, 5]);
      const ctrl = { x: (g.review.x + g.plan.x) / 2, y: g.h * 1.12 };
      let p = quadAt(g.review, ctrl, g.plan, 0);
      ctx.moveTo(p.x, p.y);
      for (let s = 1; s <= 24; s++) {
        p = quadAt(g.review, ctrl, g.plan, s / 24);
        ctx.lineTo(p.x, p.y);
      }
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    };

    const mono = (size: number) =>
      `${size}px ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;

    const drawNode = (g: Geometry, p: Point, key: string, label: string, ring = false) => {
      const pu = pulses[key];
      if (pu && pu.v > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + (1 - pu.v) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = pu.color;
        ctx.globalAlpha = pu.v * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = colors.accent;
      ctx.fill();
      if (ring) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = mono(g.w < 560 ? 9 : 10);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y + 24);
    };

    const drawLaneLabels = (g: Geometry) => {
      ctx.font = mono(9);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "left";
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < LANES; i++) {
        const s = g.laneStarts[i];
        ctx.fillText(`agent 0${i + 1}`, s.x + 4, s.y - 7);
      }
      ctx.globalAlpha = 1;
    };

    const drawChip = (g: Geometry) => {
      const { x, y } = g.prod;
      const half = CHIP / 2;
      const celebrating = now < celebrateUntil;
      const fill = celebrating ? TARGET : totalBuilt % TARGET;

      const pu = pulses.prod;
      if (pu && pu.v > 0) {
        ctx.beginPath();
        ctx.arc(x, y, half + 4 + (1 - pu.v) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = pu.color;
        ctx.globalAlpha = pu.v * 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // chip body
      ctx.beginPath();
      ctx.roundRect(x - half, y - half, CHIP, CHIP, 5);
      ctx.strokeStyle = celebrating ? colors.accent : colors.border;
      ctx.lineWidth = celebrating ? 1.5 : 1;
      ctx.stroke();
      ctx.lineWidth = 1;

      // pins appear when the build completes
      if (celebrating) {
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 4; i++) {
          const o = -half + 6 + i * 8;
          ctx.beginPath();
          ctx.moveTo(x + o, y - half);
          ctx.lineTo(x + o, y - half - 4);
          ctx.moveTo(x + o, y + half);
          ctx.lineTo(x + o, y + half + 4);
          ctx.moveTo(x - half, y + o);
          ctx.lineTo(x - half - 4, y + o);
          ctx.moveTo(x + half, y + o);
          ctx.lineTo(x + half + 4, y + o);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // stacked blocks, bottom-up
      const cell = (CHIP - 8) / GRID;
      for (let i = 0; i < fill; i++) {
        const row = GRID - 1 - Math.floor(i / GRID);
        const col = i % GRID;
        const bx = x - half + 4 + col * cell;
        const by = y - half + 4 + row * cell;
        const newest = !celebrating && i === fill - 1;
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = newest ? 1 : 0.72;
        ctx.fillRect(bx + 0.5, by + 0.5, cell - 1.5, cell - 1.5);
      }
      ctx.globalAlpha = 1;

      if (celebrating) {
        ctx.font = mono(9);
        ctx.fillStyle = colors.accent;
        ctx.textAlign = "center";
        ctx.fillText(`v${celebratedVersion} shipped`, x, y - half - 10);
      }
    };

    const labels = (g: Geometry) => {
      const short = g.w < 560;
      return {
        review: short ? "review" : "review · human",
        cicd: "ci/cd",
        staging: short ? "qa" : "qa · staging",
        prod: short ? "prod" : "production",
      };
    };

    const drawScene = (g: Geometry) => {
      ctx.clearRect(0, 0, g.w, g.h);
      const l = labels(g);
      drawEdges(g);
      drawLaneLabels(g);
      drawNode(g, g.plan, "plan", "plan");
      drawNode(g, g.review, "review", l.review, true);
      drawNode(g, g.cicd, "cicd", l.cicd);
      drawNode(g, g.staging, "staging", l.staging);
      drawChip(g);
      ctx.font = mono(g.w < 560 ? 9 : 10);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(l.prod, g.prod.x, g.prod.y + CHIP / 2 + 14);
    };

    const drawParticle = (p: Point, alpha: number, color: string) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.15;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawStatic = () => {
      if (!geometry) return;
      const g = geometry;
      totalBuilt = 9;
      drawScene(g);
      drawParticle(pointAt(g, 0, 0.3), 1, colors.muted);
      drawParticle(pointAt(g, 1, g.segments[1][2] + 0.06), 1, colors.stage1);
      drawParticle(pointAt(g, 2, g.segments[2][4] + 0.04), 1, colors.accent);
      const ctrl = { x: (g.review.x + g.plan.x) / 2, y: g.h * 1.12 };
      drawParticle(quadAt(g.review, ctrl, g.plan, 0.5), 1, colors.yellow);
    };

    const frame = (ts: number) => {
      if (!geometry) return;
      const g = geometry;
      now = ts;
      const dt = lastFrame ? Math.min(ts - lastFrame, 64) : 16;
      lastFrame = ts;

      if (ts - lastSpawn > SPAWN_MS && particles.length < MAX_PARTICLES) {
        lastSpawn = ts;
        particles.push({
          lane: Math.floor(Math.random() * LANES),
          t: 0,
          fate: rollFate(),
          mode: "fwd",
          retFrom: null,
        });
        pulse("plan", colors.accent);
      }

      const survivors: Particle[] = [];
      for (const p of particles) {
        if (p.mode === "fwd") {
          p.t += dt / JOURNEY_MS;
          if (p.fate && p.t >= gateBoundary(g, p.lane, p.fate)) {
            p.mode = "ret";
            p.retFrom = gatePoint(g, p.fate);
            p.t = 0;
            pulse(p.fate, colors.yellow);
            survivors.push(p);
          } else if (p.t >= 1) {
            totalBuilt++;
            pulse("prod", colors.accent);
            if (totalBuilt % TARGET === 0) {
              celebrateUntil = ts + CELEBRATE_MS;
              celebratedVersion = totalBuilt / TARGET;
            }
          } else {
            const b = g.segments[p.lane];
            // pulse intermediate gates as items pass through
            for (const [key, bound] of [
              ["review", b[2]],
              ["cicd", b[3]],
              ["staging", b[4]],
            ] as const) {
              if (p.t >= bound && p.t - dt / JOURNEY_MS < bound) {
                pulse(key, colors.accent);
              }
            }
            survivors.push(p);
          }
        } else {
          p.t += dt / RETURN_MS;
          if (p.t >= 1) {
            // back on the board: re-enter the flow with a fresh fate
            pulse("plan", colors.yellow);
            p.mode = "fwd";
            p.t = 0;
            p.lane = Math.floor(Math.random() * LANES);
            p.fate = rollFate();
            p.retFrom = null;
          }
          survivors.push(p);
        }
      }
      particles = survivors;

      for (const k of Object.keys(pulses)) {
        pulses[k].v = Math.max(0, pulses[k].v - 0.0016 * dt);
      }

      drawScene(g);
      for (const p of particles) {
        if (p.mode === "ret" && p.retFrom) {
          const ctrl = { x: (p.retFrom.x + g.plan.x) / 2, y: g.h * 1.12 };
          drawParticle(quadAt(p.retFrom, ctrl, g.plan, p.t), 1, colors.yellow);
        } else {
          drawParticle(pointAt(g, p.lane, p.t), 1, stageColor(g, p.lane, p.t));
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reducedMotion.matches) return;
      running = true;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onTheme = () => {
      colors = readColors();
      if (reducedMotion.matches) drawStatic();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.1 }
    );
    io.observe(canvas);

    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", onTheme);
    const onMotion = () => {
      stop();
      if (reducedMotion.matches) drawStatic();
      else start();
    };
    reducedMotion.addEventListener("change", onMotion);

    resize();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", onTheme);
      reducedMotion.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div className="mb-10">
      <canvas
        ref={canvasRef}
        className="block h-[210px] w-full"
        role="img"
        aria-label="Animated diagram of my delivery loop: tasks flow from a plan through parallel AI coding agents into human code review, then CI/CD and QA/staging gates, and ship to production. Rejected items return to the plan and re-enter the flow. Production stacks shipped work into a chip that completes a version, clears, and starts the next build."
      />
    </div>
  );
}
