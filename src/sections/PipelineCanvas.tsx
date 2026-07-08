import { useEffect, useRef } from "react";

/**
 * Animated 2D-canvas diagram of my actual workflow: work flows from a plan
 * into parallel AI coding agents, converges on human review — where some
 * diffs get rejected — and only approved work ships to production.
 *
 * Colors come from the site's CSS variables so the canvas follows the
 * light/dark theme. The loop pauses off-screen and falls back to a static
 * frame when the user prefers reduced motion.
 */

const LANES = 3;
const SPAWN_MS = 620;
const JOURNEY_MS = 4200;
const REJECT_RATE = 0.18;

interface Point {
  x: number;
  y: number;
}

interface Geometry {
  w: number;
  h: number;
  plan: Point;
  laneStarts: Point[];
  laneEnds: Point[];
  review: Point;
  ship: Point;
  /** cumulative segment boundaries (0..1) per lane: curve-in, lane, curve-out, ship */
  segments: number[][];
}

interface Particle {
  lane: number;
  t: number; // 0..1 along the whole journey
  rejected: boolean;
  /** set once the particle reaches review and gets rejected */
  fall: { x: number; y: number; vy: number; alpha: number } | null;
}

interface Colors {
  fg: string;
  muted: string;
  border: string;
  accent: string;
}

function readColors(): Colors {
  const s = getComputedStyle(document.documentElement);
  return {
    fg: s.getPropertyValue("--fg").trim(),
    muted: s.getPropertyValue("--muted").trim(),
    border: s.getPropertyValue("--border").trim(),
    accent: s.getPropertyValue("--accent").trim(),
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

/** ease a straight segment between two points */
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
  const [b1, b2, b3] = g.segments[lane];
  if (t <= b1) return curveIn(g, lane, t / b1);
  if (t <= b2) return lerp(g.laneStarts[lane], g.laneEnds[lane], (t - b1) / (b2 - b1));
  if (t <= b3) return curveOut(g, lane, (t - b2) / (b3 - b2));
  return lerp(g.review, g.ship, (t - b3) / (1 - b3));
}

function computeGeometry(w: number, h: number): Geometry {
  const cy = h * 0.44;
  const spread = Math.min(h * 0.26, 46);
  const plan = { x: w * 0.06, y: cy };
  const review = { x: w * 0.76, y: cy };
  const ship = { x: w * 0.94, y: cy };
  const laneStarts: Point[] = [];
  const laneEnds: Point[] = [];
  for (let i = 0; i < LANES; i++) {
    const y = cy + (i - (LANES - 1) / 2) * spread;
    laneStarts.push({ x: w * 0.26, y });
    laneEnds.push({ x: w * 0.55, y });
  }
  // per-lane cumulative boundaries weighted by rough segment lengths
  const segments = laneStarts.map((s, i) => {
    const e = laneEnds[i];
    const l1 = Math.hypot(s.x - plan.x, s.y - plan.y);
    const l2 = Math.hypot(e.x - s.x, e.y - s.y);
    const l3 = Math.hypot(review.x - e.x, review.y - e.y);
    const l4 = Math.hypot(ship.x - review.x, ship.y - review.y);
    const total = l1 + l2 + l3 + l4;
    return [l1 / total, (l1 + l2) / total, (l1 + l2 + l3) / total];
  });
  return { w, h, plan, laneStarts, laneEnds, review, ship, segments };
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
    const pulses = { review: 0, ship: 0, plan: 0 };
    let raf = 0;
    let running = false;
    let lastSpawn = 0;
    let lastFrame = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
      ctx.lineTo(g.ship.x, g.ship.y);
      ctx.stroke();
    };

    const drawNode = (p: Point, label: string, pulse: number, ring = false) => {
      if (pulse > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + (1 - pulse) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = pulse * 0.5;
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
      ctx.font = "10px ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y + 24);
    };

    const drawLaneLabels = (g: Geometry) => {
      ctx.font = "9px ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "left";
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < LANES; i++) {
        const s = g.laneStarts[i];
        ctx.fillText(`agent 0${i + 1}`, s.x + 4, s.y - 7);
      }
      ctx.globalAlpha = 1;
    };

    const drawScene = (g: Geometry) => {
      ctx.clearRect(0, 0, g.w, g.h);
      drawEdges(g);
      drawLaneLabels(g);
      drawNode(g.plan, "plan", pulses.plan);
      drawNode(g.review, "review · human", pulses.review, true);
      drawNode(g.ship, "production", pulses.ship);
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
      drawScene(geometry);
      // a frozen frame that still tells the story
      [0.18, 0.42, 0.68, 0.92].forEach((t, i) => {
        drawParticle(pointAt(geometry!, i % LANES, t), 1, colors.accent);
      });
    };

    const frame = (now: number) => {
      if (!geometry) return;
      const g = geometry;
      const dt = lastFrame ? Math.min(now - lastFrame, 64) : 16;
      lastFrame = now;

      if (now - lastSpawn > SPAWN_MS && particles.length < 14) {
        lastSpawn = now;
        particles.push({
          lane: Math.floor(Math.random() * LANES),
          t: 0,
          rejected: Math.random() < REJECT_RATE,
          fall: null,
        });
        pulses.plan = 1;
      }

      for (const p of particles) {
        if (p.fall) {
          p.fall.vy += 0.012 * dt;
          p.fall.y += p.fall.vy;
          p.fall.x -= 0.008 * dt;
          p.fall.alpha -= 0.0011 * dt;
          continue;
        }
        p.t += dt / JOURNEY_MS;
        const reviewT = g.segments[p.lane][2];
        if (p.t >= reviewT && p.rejected) {
          const pos = pointAt(g, p.lane, reviewT);
          p.fall = { x: pos.x, y: pos.y, vy: 0.2, alpha: 1 };
          pulses.review = 1;
        } else if (p.t >= reviewT && p.t - dt / JOURNEY_MS < reviewT) {
          pulses.review = 1;
        }
        if (p.t >= 1) pulses.ship = 1;
      }
      particles = particles.filter(
        (p) => (p.fall ? p.fall.alpha > 0 : p.t < 1)
      );

      pulses.plan = Math.max(0, pulses.plan - 0.0016 * dt);
      pulses.review = Math.max(0, pulses.review - 0.0016 * dt);
      pulses.ship = Math.max(0, pulses.ship - 0.0016 * dt);

      drawScene(g);
      for (const p of particles) {
        if (p.fall) {
          drawParticle({ x: p.fall.x, y: p.fall.y }, Math.max(p.fall.alpha, 0), colors.muted);
        } else {
          drawParticle(pointAt(g, p.lane, p.t), 1, colors.accent);
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
        className="block h-[190px] w-full"
        role="img"
        aria-label="Animated diagram of my workflow: tasks flow from a plan through parallel AI coding agents into human code review — where some diffs are rejected — and approved work ships to production."
      />
    </div>
  );
}
