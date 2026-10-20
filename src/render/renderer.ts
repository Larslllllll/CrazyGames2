import { WORLD, type Viewport } from "../core/canvas";
import type { Input } from "../core/input";
import { clamp, clamp01, lerp } from "../core/math";
import type { Particles } from "../entities/particles";
import type { Popups } from "../entities/popups";
import type { Dragon } from "../gameplay/dragon";
import type { Run } from "../gameplay/run";
import type { Thief } from "../gameplay/thief";
import type { Hazard, Item, LairLayout, Obstacle } from "../gameplay/types";
import { RARITY_COLORS } from "../progression/collection";
import type { LairPalette } from "../progression/lairs";
import type { SkinDef } from "../progression/milestones";
import type { Juice } from "../systems/juice";
import { drawArtefact } from "./artefacts";
import { drawSleepingDragonArt, drawThiefArt } from "./dragonArt";
import { Background } from "./background";
import { SpriteCache } from "./sprites";
import { circle, ellipse, poly, roundRect, seeded, shadow, star, text, type Ctx } from "./draw";

export interface Scene {
  run: Run | null;
  particles: Particles;
  popups: Popups;
  juice: Juice;
  skin: SkinDef;
  time: number;
  showExitHint: boolean;
  input: Input;
}


/** Per-section render timings (ms, exponential average) for profiling via the debug API. */
export const PERF: Record<string, number> = {};
const mark = (name: string, t0: number): number => {
  const t = performance.now();
  PERF[name] = (PERF[name] ?? 0) * 0.9 + (t - t0) * 0.1;
  return t;
};

export class Renderer {
  private readonly bg = new Background();
  private readonly sprites = new SpriteCache();
  private backdrop: HTMLCanvasElement | null = null;
  private backdropKey = "";
  declare edgeArrow: (c: Ctx, wx: number, wy: number, color: string, label: string) => void;
  constructor(private readonly vp: Viewport) {}

  draw(s: Scene): void {
    const c = this.vp.ctx;
    const run = s.run;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0b1114";
    c.fillRect(0, 0, this.vp.canvas.width, this.vp.canvas.height);
    if (!run) return;
    const layout = run.layout;
    const j = s.juice;
    const v = this.vp.view;
    this.drawBackdrop(c, layout.def.palette.wallDark, s.time);
    c.save();
    // Clip to the view area, then draw the world through the camera.
    this.vp.applyScreen();
    c.beginPath();
    c.rect(v.x, v.y, v.w, v.h);
    c.clip();
    this.vp.applyWorld(j.shakeX, j.shakeY, j.zoom);
    c.beginPath();
    c.rect(0, 0, WORLD, WORLD);
    c.clip();
    let t0 = performance.now();
    const bgc = this.bg.get(layout, this.vp.worldPixelSize);
    c.drawImage(bgc, 0, 0, WORLD, WORLD);
    t0 = mark("bg", t0);
    this.drawHazards(c, layout, s.time);
    this.drawGroundFire(c, run.dragon, s.time);
    t0 = mark("hazards", t0);
    this.drawItems(c, layout, s.time);
    t0 = mark("items", t0);
    for (const o of layout.obstacles) this.drawObstacle(c, o, layout.def.palette);
    t0 = mark("obstacles", t0);
    if (run.dragon.state === "asleep" || run.dragon.state === "waking") this.drawSleepingDragon(c, run.dragon, layout.def.palette, s.time);
    this.drawExit(c, layout, run, s);
    this.drawThief(c, run.thief, s, run.dragon.state !== "asleep");
    if (run.dragon.state === "awake") this.drawAwakeDragon(c, run.dragon, layout.def.palette, s.time);
    this.drawFlame(c, run.dragon, s.time);
    t0 = mark("actors", t0);
    s.particles.draw(c);
    t0 = mark("particles", t0);
    s.popups.draw(c);
    c.restore();
    this.drawOverlay(c, s);
    mark("overlay", t0);
  }

  /** Dark rock outside the lair (visible when the view is larger than the world). */
  private drawBackdrop(c: Ctx, color: string, t: number): void {
    this.vp.applyScreen();
    const w = this.vp.width;
    const h = this.vp.height;
    // Only the strips the world does not cover need painting.
    const tl = this.vp.worldToScreen(0, 0);
    const br = this.vp.worldToScreen(WORLD, WORLD);
    c.fillStyle = color;
    if (tl.x > 0) c.fillRect(0, 0, Math.ceil(tl.x), h);
    if (br.x < w) c.fillRect(Math.floor(br.x), 0, w - Math.floor(br.x), h);
    if (tl.y > 0) c.fillRect(0, 0, w, Math.ceil(tl.y));
    if (br.y < h) c.fillRect(0, Math.floor(br.y), w, h - Math.floor(br.y));
    void t;
    if (tl.x <= 0 && tl.y <= 0 && br.x >= w && br.y >= h) return;
    const key = `${w}x${h}:${color}`;
    if (!this.backdrop || this.backdropKey !== key) {
      this.backdropKey = key;
      const cv = this.backdrop ?? document.createElement("canvas");
      cv.width = Math.max(2, Math.round(w / 4));
      cv.height = Math.max(2, Math.round(h / 4));
      const b = cv.getContext("2d")!;
      b.fillStyle = color;
      b.fillRect(0, 0, cv.width, cv.height);
      const g = b.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.2, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.8);
      g.addColorStop(0, "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.45)");
      b.fillStyle = g;
      b.fillRect(0, 0, cv.width, cv.height);
      this.backdrop = cv;
    }
    // Soft lighting over the strips (skip when the world fills the screen).
    c.globalAlpha = 0.9;
    if (tl.x > 0) c.drawImage(this.backdrop, 0, 0, tl.x / 4, h / 4, 0, 0, tl.x, h);
    if (br.x < w) c.drawImage(this.backdrop, br.x / 4, 0, (w - br.x) / 4, h / 4, br.x, 0, w - br.x, h);
    c.globalAlpha = 1;
  }

  // --- hazards ---------------------------------------------------------------------------
  private drawHazards(c: Ctx, layout: LairLayout, t: number): void {
    for (const h of layout.hazards) {
      if (h.kind === "ice") {
        c.globalAlpha = 0.5;
        ellipse(c, h.x, h.y, h.r, h.r * 0.82, "#cfefff", 0.3);
        ellipse(c, h.x + h.r * 0.1, h.y - h.r * 0.1, h.r * 0.85, h.r * 0.75, "#e8f8ff", -0.4);
        c.globalAlpha = 0.55;
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(h.x - h.r * 0.5, h.y - h.r * 0.2);
        c.lineTo(h.x - h.r * 0.1, h.y + h.r * 0.1);
        c.lineTo(h.x + h.r * 0.3, h.y - h.r * 0.3);
        c.stroke();
        c.globalAlpha = 1;
      } else if (h.kind === "lava") {
        const g = c.createRadialGradient(h.x, h.y, h.r * 0.3, h.x, h.y, h.r * 1.8);
        g.addColorStop(0, "rgba(255,120,40,0.35)");
        g.addColorStop(1, "rgba(255,120,40,0)");
        c.fillStyle = g;
        c.fillRect(h.x - h.r * 2, h.y - h.r * 2, h.r * 4, h.r * 4);
        circle(c, h.x, h.y, h.r, "#c0392b", "#6b1d12", 5);
        circle(c, h.x, h.y, h.r * 0.75, "#ff7a2d");
        circle(c, h.x - h.r * 0.2, h.y - h.r * 0.15, h.r * 0.4, "#ffc24d");
        for (let i = 0; i < 3; i++) {
          const ph = (t * 1.3 + i * 2.1 + h.x * 0.01) % 2;
          const br = ph < 1 ? ph * h.r * 0.25 : 0;
          if (br > 0) circle(c, h.x + Math.cos(i * 2.4) * h.r * 0.45, h.y + Math.sin(i * 2.4) * h.r * 0.4, br, "#ff9d5c", "#c0392b", 2);
        }
      } else {
        const on = h.cooldown > 0;
        shadow(c, h.x, h.y + 3, h.r, h.r * 0.7, 0.2);
        circle(c, h.x, h.y, h.r, on ? "#fff3b0" : "#c9a53a", "#6b4f12", 4);
        circle(c, h.x, h.y, h.r * 0.55, on ? "#ffe066" : "#e2bd4c", "#8a6a1a", 2);
        if (on) {
          c.globalAlpha = clamp01(h.cooldown / 1.6);
          c.strokeStyle = "#fff6c8";
          c.lineWidth = 3;
          c.beginPath();
          c.arc(h.x, h.y, h.r + 10 + (1.6 - h.cooldown) * 40, 0, 6.283);
          c.stroke();
          c.globalAlpha = 1;
        }
      }
    }
  }

  private drawGroundFire(c: Ctx, d: Dragon, t: number): void {
    for (const g of d.groundFires) {
      const k = g.t / g.max;
      const flick = 0.8 + 0.3 * Math.sin(t * 30 + g.x);
      c.globalAlpha = Math.min(1, k * 2.5) * 0.9;
      circle(c, g.x, g.y, g.r * flick, "#ff6a2a");
      circle(c, g.x + Math.sin(t * 20 + g.y) * 4, g.y - 6, g.r * 0.55 * flick, "#ffd25a");
      c.globalAlpha = 1;
    }
  }

  // --- loot --------------------------------------------------------------------------------
  private drawItems(c: Ctx, layout: LairLayout, t: number): void {
    const sp = this.sprites;
    sp.ensure(this.vp.scale * this.vp.dpr);
    const vis = this.vp.visible();
    const x0 = vis.x - 40;
    const y0 = vis.y - 40;
    const x1 = vis.x + vis.w + 40;
    const y1 = vis.y + vis.h + 40;
    const blit = (s: { canvas: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }, x: number, y: number): void => {
      c.drawImage(s.canvas, x + s.ox, y + s.oy, s.w, s.h);
    };
    for (const it of layout.items) {
      if (it.taken) continue;
      if (it.x < x0 || it.x > x1 || it.y < y0 || it.y > y1) continue;
      const bob = Math.sin(it.phase + t * 2) * 2;
      switch (it.kind) {
        case "coin":
          blit(sp.coin, it.x, it.y - bob * 0.5);
          break;
        case "bigcoin":
          blit(sp.bigcoin, it.x, it.y - bob * 0.4);
          break;
        case "gem": {
          blit(sp.gems[it.tier], it.x, it.y - bob);
          if (Math.sin(it.phase * 3 + t * 4) > 0.92) star(c, it.x + 7, it.y - bob - 9, 7, "#ffffff", 4);
          break;
        }
        case "artefact": {
          const a = it.artefact!;
          const col = RARITY_COLORS[a.rarity];
          const pulse = 0.75 + 0.25 * Math.sin(t * 3 + it.phase);
          const g = c.createRadialGradient(it.x, it.y, 4, it.x, it.y, 46);
          g.addColorStop(0, col + (a.rarity >= 3 ? "77" : "44"));
          g.addColorStop(1, col + "00");
          c.globalAlpha = pulse;
          c.fillStyle = g;
          c.fillRect(it.x - 50, it.y - 50, 100, 100);
          c.globalAlpha = 1;
          shadow(c, it.x, it.y + 12, 18, 8, 0.3);
          c.save();
          c.translate(it.x, it.y - bob);
          drawArtefact(c, a.shape, a.color, 15);
          c.restore();
          if (a.rarity >= 2 && Math.sin(t * 5 + it.phase) > 0.8) star(c, it.x + 14, it.y - 16, 9, "#ffffff", 4);
          if (it.grab > 0) {
            c.strokeStyle = "rgba(0,0,0,0.5)";
            c.lineWidth = 7;
            c.beginPath();
            c.arc(it.x, it.y, 28, 0, 6.283);
            c.stroke();
            c.strokeStyle = "#ffffff";
            c.lineWidth = 5;
            c.beginPath();
            c.arc(it.x, it.y, 28, -Math.PI / 2, -Math.PI / 2 + it.grab * 6.283);
            c.stroke();
          }
          break;
        }
      }
    }
  }

  // --- obstacles ---------------------------------------------------------------------------
  private drawObstacle(c: Ctx, o: Obstacle, p: LairPalette): void {
    const rnd = seeded(o.seed);
    switch (o.kind) {
      case "rock": {
        shadow(c, o.x + 4, o.y + 6, o.r * 1.05, o.r * 0.8, 0.3);
        const pts: number[] = [];
        const n = 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283;
          const rr = o.r * (0.82 + rnd() * 0.3);
          pts.push(o.x + Math.cos(a) * rr, o.y + Math.sin(a) * rr);
        }
        poly(c, pts, "#7a7468", "#3b3833", 3);
        const hp: number[] = [];
        for (let i = 0; i < 5; i++) {
          const a = -2.2 + (i / 5) * 2.4;
          hp.push(o.x + Math.cos(a) * o.r * 0.55, o.y + Math.sin(a) * o.r * 0.5);
        }
        poly(c, hp, "rgba(255,255,255,0.14)");
        break;
      }
      case "bone": {
        c.save();
        c.translate(o.x, o.y);
        c.rotate(rnd() * 3.1);
        shadow(c, 3, 5, o.r * 1.2, o.r * 0.5, 0.25);
        roundRect(c, -o.r, -5, o.r * 2, 10, 5, "#efe8d6", "#9c8f74", 2.5);
        for (const sx of [-o.r, o.r]) {
          circle(c, sx, -6, 7, "#efe8d6", "#9c8f74", 2.5);
          circle(c, sx, 6, 7, "#efe8d6", "#9c8f74", 2.5);
        }
        c.restore();
        break;
      }
      case "stalagmite": {
        shadow(c, o.x + 6, o.y + 8, o.r * 1.1, o.r * 0.6, 0.3);
        poly(c, [o.x - o.r, o.y + o.r * 0.5, o.x + o.r, o.y + o.r * 0.5, o.x + o.r * 0.25, o.y - o.r * 2.1, o.x - o.r * 0.3, o.y - o.r * 1.6], p.wall, p.wallDark, 3);
        poly(c, [o.x - o.r * 0.5, o.y + o.r * 0.3, o.x - o.r * 0.1, o.y - o.r * 1.5, o.x - o.r * 0.3, o.y - o.r * 1.6], "rgba(255,255,255,0.12)");
        break;
      }
      case "pillar": {
        shadow(c, o.x + 6, o.y + 8, o.r * 1.2, o.r * 0.7, 0.32);
        roundRect(c, o.x - o.r, o.y - o.r * 1.4, o.r * 2, o.r * 2.4, 6, "#8c8577", "#3b3833", 3);
        roundRect(c, o.x - o.r * 1.1, o.y - o.r * 1.9, o.r * 2.2, o.r * 0.9, 6, "#a59d8d", "#3b3833", 3);
        break;
      }
    }
  }

  // --- the dragon ------------------------------------------------------------------------
  private drawSleepingDragon(c: Ctx, d: Dragon, p: LairPalette, t: number): void {
    drawSleepingDragonArt(c, p, {
      hx: d.x,
      hy: d.y,
      eye: d.eye,
      stage: d.stage,
      breath: d.state === "asleep" ? Math.sin(d.snorePhase * 6.283 - 1.2) : 0,
      waking: d.state === "waking" ? 1 - d.wakeTimer / 0.9 : 0,
      t,
      snoring: d.state === "asleep" && d.snoring,
      snorePhase: d.snorePhase,
    });
  }

  private drawAwakeDragon(c: Ctx, d: Dragon, p: LairPalette, t: number): void {
    c.save();
    c.translate(d.x, d.y);
    shadow(c, -60, 22, 170, 70, 0.3);
    c.rotate(d.angle);
    c.scale(1.3, 1.3);
    const flap = 0.7 + 0.3 * Math.sin(t * 13);
    const stride = Math.sin(t * 14) * (d.speed > 40 ? 10 : 0);
    // Tail.
    c.lineCap = "round";
    for (const [col, w] of [
      [p.dragonDark, 34],
      [p.dragon, 22],
    ] as [string, number][]) {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(-110, 0);
      c.quadraticCurveTo(-170, Math.sin(t * 8) * 45, -235, Math.sin(t * 8 + 1.2) * 35);
      c.stroke();
    }
    const tx = -235;
    const ty = Math.sin(t * 8 + 1.2) * 35;
    poly(c, [tx + 10, ty, tx - 22, ty - 20, tx - 30, ty, tx - 22, ty + 20], p.dragonDark);
    poly(c, [tx + 6, ty, tx - 18, ty - 13, tx - 24, ty, tx - 18, ty + 13], p.dragon);
    // Legs (walk cycle).
    for (const [lx, ly, ph] of [
      [20, 62, 0],
      [20, -62, 1],
      [-95, 70, 1],
      [-95, -70, 0],
    ] as [number, number, number][]) {
      const off = ph === 0 ? stride : -stride;
      const sy = Math.sign(ly);
      ellipse(c, lx + off, ly, 24, 15, p.dragon, 0, p.dragonDark, 4);
      for (let i = -1; i <= 1; i++) poly(c, [lx + off + i * 11 - 5, ly + sy * 10, lx + off + i * 11 + 5, ly + sy * 10, lx + off + i * 11, ly + sy * 24], p.dragonHorn, p.dragonDark, 2);
    }
    // Wings.
    for (const side of [-1, 1]) {
      poly(c, [-30, side * 18, -60, side * 185 * flap, -150, side * 150 * flap, -150, side * 55, -120, side * 26], p.dragonDark, p.wallDark, 3);
      poly(c, [-38, side * 24, -64, side * 160 * flap, -140, side * 132 * flap, -140, side * 58], p.dragon);
      c.strokeStyle = "rgba(0,0,0,0.25)";
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-40, side * 24);
        c.lineTo(-70 - i * 30, side * (150 - i * 20) * flap);
        c.stroke();
      }
    }
    // Body, spine, neck, head.
    ellipse(c, -45, 0, 92, 64, p.dragon, 0, p.dragonDark, 5);
    for (let x = -120; x <= 10; x += 26) poly(c, [x - 7, -6, x + 7, -6, x, -30], p.dragonHorn, p.dragonDark, 2);
    ellipse(c, 22, 0, 52, 42, p.dragon, 0, p.dragonDark, 5);
    ellipse(c, 62, 0, 52, 48, p.dragon, 0, p.dragonDark, 5);
    roundRect(c, 78, -28, 72, 56, 22, p.dragon, p.dragonDark, 5);
    ellipse(c, 122, 0, 18, 10, p.dragonBelly);
    ellipse(c, 134, -9, 5, 3.5, p.dragonDark, 0.4);
    ellipse(c, 134, 9, 5, 3.5, p.dragonDark, -0.4);
    // Horns.
    for (const side of [-1, 1]) {
      c.strokeStyle = p.dragonDark;
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(44, side * 30);
      c.quadraticCurveTo(10, side * 54, -20, side * 40);
      c.stroke();
      c.strokeStyle = p.dragonHorn;
      c.lineWidth = 9;
      c.stroke();
    }
    // Mouth / telegraph glow.
    const open = d.telegraphing ? d.telegraph : d.flame.active ? 1 : 0.1;
    roundRect(c, 104, -20 * open, 46, 40 * open + 2, 7, "#3b0f0a");
    if (d.telegraphing) {
      const g = c.createRadialGradient(150, 0, 4, 150, 0, 60 + d.telegraph * 50);
      g.addColorStop(0, `rgba(255,220,120,${0.95 * d.telegraph})`);
      g.addColorStop(1, "rgba(255,120,30,0)");
      c.fillStyle = g;
      c.fillRect(80, -110, 200, 220);
    }
    // Angry eyes.
    for (const side of [-1, 1]) {
      ellipse(c, 64, side * 26, 13, 16, "#fff6c8", 0, p.dragonDark, 3);
      ellipse(c, 68, side * 26, 9, 12, "#ff5f2a");
      ellipse(c, 70, side * 26, 3.5, 9, "#1b0f0a");
      c.strokeStyle = p.dragonDark;
      c.lineWidth = 7;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(50, side * 40);
      c.lineTo(80, side * 24);
      c.stroke();
    }
    c.restore();
  }

  private drawFlame(c: Ctx, d: Dragon, t: number): void {
    const f = d.flame;
    if (!f.active) return;
    const grow = clamp01(f.t / 0.18);
    const fade = f.t > f.dur - 0.15 ? (f.dur - f.t) / 0.15 : 1;
    const L = f.len * grow;
    c.save();
    c.translate(f.x, f.y);
    c.rotate(f.angle);
    c.globalAlpha = fade;
    const layers: [number, string][] = [
      [1.25, "rgba(220,60,30,0.85)"],
      [0.9, "#ff8a2a"],
      [0.55, "#ffd25a"],
      [0.25, "#fff8d0"],
    ];
    for (const [k, col] of layers) {
      c.beginPath();
      c.moveTo(0, 0);
      const segs = 10;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const w = f.width * k * (0.25 + 0.75 * u) * (1 + 0.18 * Math.sin(t * 40 + i * 1.7));
        c.lineTo(u * L, -w * 0.5);
      }
      for (let i = segs; i >= 0; i--) {
        const u = i / segs;
        const w = f.width * k * (0.25 + 0.75 * u) * (1 + 0.18 * Math.cos(t * 37 + i * 2.3));
        c.lineTo(u * L, w * 0.5);
      }
      c.closePath();
      c.fillStyle = col;
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  // --- the thief ---------------------------------------------------------------------------
  private drawThief(c: Ctx, th: Thief, s: Scene, scared: boolean): void {
    if (th.invuln > 0 && Math.floor(s.time * 14) % 2 === 0) c.globalAlpha = 0.45;
    drawThiefArt(c, s.skin, {
      x: th.x,
      y: th.y,
      facing: th.facing,
      bob: th.bob,
      moving: th.moving,
      sneaking: th.sneaking,
      fill: clamp01(th.bagWeight / th.stats.capacity),
      scared,
      squash: th.squash,
      scale: 1.12,
    });
    c.globalAlpha = 1;
    if (th.lullabyUses > 0) {
      c.globalAlpha = 0.25 + 0.1 * Math.sin(s.time * 4);
      c.strokeStyle = "#cfe8ff";
      c.lineWidth = 2;
      c.setLineDash([6, 8]);
      c.beginPath();
      c.arc(th.x, th.y, 26, s.time * 1.2, s.time * 1.2 + 6.283);
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }
  }

  private drawExit(c: Ctx, layout: LairLayout, run: Run, s: Scene): void {
    const ex = layout.exit;
    const awake = run.dragon.state !== "asleep";
    if (s.showExitHint || awake) {
      const k = 0.5 + 0.5 * Math.sin(s.time * 5);
      const y = ex.y - 72 - k * 10;
      poly(c, [ex.x - 16, y - 20, ex.x + 16, y - 20, ex.x + 16, y - 4, ex.x + 30, y - 4, ex.x, y + 22, ex.x - 30, y - 4, ex.x - 16, y - 4], awake ? "#ff8a5a" : "#ffe066", "rgba(0,0,0,0.5)", 3);
      text(c, awake ? "RUN!" : "EXIT", ex.x, y - 42, 24, "#ffffff", { stroke: "rgba(0,0,0,0.6)" });
    }
  }

  // --- screen-space overlay ----------------------------------------------------------------
  private drawOverlay(c: Ctx, s: Scene): void {
    this.vp.applyScreen();
    const w = this.vp.width;
    const h = this.vp.height;
    const j = s.juice;
    void j;
    void w;
    void h;
    // Off-screen indicators: the exit (when it matters) and the awake dragon.
    const run = s.run;
    if (run) {
      const vis = this.vp.visible();
      const inside = (x: number, y: number): boolean => x > vis.x + 20 && x < vis.x + vis.w - 20 && y > vis.y + 20 && y < vis.y + vis.h - 20;
      const awake = run.dragon.state === "awake";
      const ex = run.layout.exit;
      if ((s.showExitHint || awake) && !inside(ex.x, ex.y - 30)) this.edgeArrow(c, ex.x, ex.y - 30, awake ? "#ff8a5a" : "#ffe066", "EXIT");
      if (awake && !inside(run.dragon.x, run.dragon.y)) this.edgeArrow(c, run.dragon.x, run.dragon.y, "#ff4a2a", "!");
    }
    // Virtual joystick.
    const inp = s.input;
    if (inp.dragging && inp.touchDevice) {
      const js = inp.joystick;
      c.globalAlpha = 0.28;
      circle(c, js.ox, js.oy, js.r, "rgba(255,255,255,0.15)", "#ffffff", 2);
      const dx = js.x - js.ox;
      const dy = js.y - js.oy;
      const dd = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dd / js.r);
      c.globalAlpha = 0.5;
      circle(c, js.ox + (dx / dd) * k * js.r, js.oy + (dy / dd) * k * js.r, js.r * 0.38, "#ffffff");
      c.globalAlpha = 1;
    }
  }
}

export const lerpColor = (a: number, b: number, t: number): number => Math.round(lerp(a, b, t));

/** Draws an arrow on the edge of the view pointing at a world position (screen space). */
function edgeArrowImpl(this: Renderer, c: Ctx, wx: number, wy: number, color: string, label: string): void {
  const vp = (this as unknown as { vp: Viewport }).vp;
  const v = vp.view;
  const p = vp.worldToScreen(wx, wy);
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h / 2;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const m = 34;
  const kx = dx !== 0 ? (v.w / 2 - m) / Math.abs(dx) : Infinity;
  const ky = dy !== 0 ? (v.h / 2 - m) / Math.abs(dy) : Infinity;
  const k = Math.min(kx, ky, 1);
  const x = cx + dx * k;
  const y = cy + dy * k;
  const a = Math.atan2(dy, dx);
  c.save();
  c.translate(x, y);
  c.rotate(a);
  poly(c, [16, 0, -8, -12, -4, 0, -8, 12], color, "rgba(0,0,0,0.55)", 3);
  c.restore();
  text(c, label, x - Math.cos(a) * 26, y - Math.sin(a) * 26, 15, "#ffffff", { stroke: "rgba(0,0,0,0.6)" });
}
(Renderer.prototype as unknown as { edgeArrow: typeof edgeArrowImpl }).edgeArrow = edgeArrowImpl;
export const clampPx = clamp;
export type { Item, Hazard };
