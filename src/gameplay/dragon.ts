import { WORLD } from "../core/canvas";
import { angleDelta, approachAngle, clamp, dist, len, TAU } from "../core/math";
import type { Thief } from "./thief";
import type { Circle, LairLayout } from "./types";

export type DragonState = "asleep" | "waking" | "awake";

export interface Flame {
  active: boolean;
  t: number;
  dur: number;
  x: number;
  y: number;
  angle: number;
  len: number;
  width: number;
}

export interface GroundFire {
  x: number;
  y: number;
  r: number;
  t: number;
  max: number;
}

export interface DragonEvents {
  onStage: (stage: number) => void;
  onWake: () => void;
  onTelegraph: () => void;
  onFire: () => void;
  onSnore: () => void;
}

export const DRAGON_AWAKE_R = 64;

/**
 * The dragon: a Wake meter while asleep (noise, greed and time push it up; silence lets it sink),
 * then a chase with telegraphed fire breath once awake.
 */
export class Dragon {
  state: DragonState = "asleep";
  x: number;
  y: number;
  angle = Math.PI / 2;
  meter = 0;
  floor = 0;
  stage = 0;
  snorePhase = 0;
  readonly snoreCycle = 3.6;
  snoring = false;
  t = 0;
  wakeTimer = 0;
  speed = 0;
  fireCooldown = 0;
  telegraph = 0;
  telegraphing = false;
  flame: Flame = { active: false, t: 0, dur: 0.62, x: 0, y: 0, angle: 0, len: 0, width: 64 };
  groundFires: GroundFire[] = [];
  /** Eye openness 0..1 for rendering. */
  eye = 0;
  twitch = 0;
  private raw = 0;
  private snoreFired = false;
  private wakePending = false;

  constructor(private readonly layout: LairLayout) {
    this.x = layout.dragon.x;
    this.y = layout.dragon.y;
  }

  get asleep(): boolean {
    return this.state === "asleep";
  }

  /** Footstep noise is masked while the dragon snores loudly. */
  get snoreMask(): number {
    return this.state === "asleep" && this.snoring ? 0.35 : 1;
  }

  addNoise(n: number): void {
    if (this.state !== "asleep") return;
    this.raw += n;
    if (this.raw >= 100) {
      this.raw = 100;
      this.wakePending = true;
    }
    if (n > 2.5) this.twitch = Math.max(this.twitch, Math.min(1, n / 10));
  }

  /** Lullaby: push the meter down (never below the floor). */
  calm(n: number): void {
    this.raw = Math.max(this.floor, this.raw - n);
  }

  mouth(): { x: number; y: number } {
    const d = this.state === "awake" ? 58 : 78;
    return { x: this.x + Math.cos(this.angle) * d, y: this.y + Math.sin(this.angle) * d };
  }

  update(dt: number, thief: Thief, takenFraction: number, ev: DragonEvents): void {
    this.t += dt;
    this.twitch = Math.max(0, this.twitch - dt * 2.2);
    const def = this.layout.def;
    if (this.state === "asleep") {
      this.snorePhase = (this.snorePhase + dt / this.snoreCycle) % 1;
      const wasSnoring = this.snoring;
      this.snoring = this.snorePhase < 0.36;
      if (this.snoring && !wasSnoring && !this.snoreFired) ev.onSnore();
      this.snoreFired = this.snoring;
      // Greed and time make the sleep lighter.
      this.floor = clamp(def.greedFloor * takenFraction + Math.max(0, this.t - def.graceTime) * def.sleepLighten, 0, 100);
      const decay = thief.speedFrac < 0.12 ? 3.2 : 1.1;
      if (!this.wakePending) this.raw = Math.max(this.floor, this.raw - decay * dt);
      this.meter = this.raw;
      const stage = this.meter >= 80 ? 2 : this.meter >= 50 ? 1 : 0;
      if (stage !== this.stage) {
        this.stage = stage;
        ev.onStage(stage);
      }
      const base = stage === 0 ? 0 : stage === 1 ? 0.42 : 0.68;
      const pulse = stage === 2 ? 0.12 * Math.sin(this.t * 9) : 0;
      this.eye = clamp(base + pulse + this.twitch * 0.35, 0, 0.95);
      if (this.wakePending || this.meter >= 100) {
        this.state = "waking";
        this.wakeTimer = 0.9;
        this.eye = 1;
        this.snoring = false;
        ev.onWake();
      }
      return;
    }
    if (this.state === "waking") {
      this.eye = 1;
      this.wakeTimer -= dt;
      if (this.wakeTimer <= 0) {
        this.state = "awake";
        this.speed = 0;
        this.fireCooldown = 1.1;
      }
      return;
    }
    // --- awake: chase + fire ---------------------------------------------------------------
    this.eye = 1;
    const target = Math.atan2(thief.y - this.y, thief.x - this.x);
    const turn = this.flame.active ? def.dragonTurn * 0.25 : this.telegraphing ? def.dragonTurn * 0.6 : def.dragonTurn;
    this.angle = approachAngle(this.angle, target, turn * dt);
    this.angle = ((this.angle % TAU) + TAU) % TAU;
    const want = this.flame.active ? 0 : this.telegraphing ? def.dragonSpeed * 0.3 : def.dragonSpeed;
    this.speed += clamp(want - this.speed, -def.dragonSpeed * dt * 2.5, def.dragonSpeed * dt / 1.1);
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    // Obstacles: slide around them.
    for (const o of this.layout.obstacles) this.pushOut(o, DRAGON_AWAKE_R - 6);
    this.x = clamp(this.x, 50, WORLD - 50);
    this.y = clamp(this.y, 50, WORLD - 50);

    // Fire breath.
    if (this.flame.active) {
      this.flame.t += dt;
      if (this.flame.t >= this.flame.dur) {
        this.flame.active = false;
        this.fireCooldown = def.fireCooldown;
        // Leave burning ground along the flame.
        const steps = Math.floor(this.flame.len / 58);
        for (let i = 1; i <= steps; i++) {
          const d = i * 58;
          this.groundFires.push({
            x: this.flame.x + Math.cos(this.flame.angle) * d,
            y: this.flame.y + Math.sin(this.flame.angle) * d,
            r: 24,
            t: 2.2,
            max: 2.2,
          });
        }
      }
    } else if (this.telegraphing) {
      this.telegraph += dt / 0.48;
      if (this.telegraph >= 1) {
        this.telegraphing = false;
        this.telegraph = 0;
        const m = this.mouth();
        this.flame = {
          active: true,
          t: 0,
          dur: 0.62,
          x: m.x,
          y: m.y,
          angle: this.angle,
          len: this.rayLength(m.x, m.y, this.angle, def.fireRange),
          width: 64,
        };
        ev.onFire();
      }
    } else {
      this.fireCooldown -= dt;
      const d = dist(this.x, this.y, thief.x, thief.y);
      if (this.fireCooldown <= 0 && d < def.fireRange + 30 && Math.abs(angleDelta(this.angle, target)) < 0.5) {
        this.telegraphing = true;
        this.telegraph = 0;
        ev.onTelegraph();
      }
    }
    for (let i = this.groundFires.length - 1; i >= 0; i--) {
      const g = this.groundFires[i];
      g.t -= dt;
      if (g.t <= 0) this.groundFires.splice(i, 1);
    }
  }

  private pushOut(c: Circle, r: number): void {
    const dx = this.x - c.x;
    const dy = this.y - c.y;
    const d = len(dx, dy);
    const min = c.r + r;
    if (d >= min || d === 0) return;
    this.x = c.x + (dx / d) * min;
    this.y = c.y + (dy / d) * min;
  }

  /** Length of a ray until it hits an obstacle (fire is blocked by rocks). */
  private rayLength(x: number, y: number, angle: number, max: number): number {
    let best = max;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (const o of this.layout.obstacles) {
      const fx = o.x - x;
      const fy = o.y - y;
      const proj = fx * dx + fy * dy;
      if (proj < 0 || proj > best) continue;
      const perp = Math.abs(fx * dy - fy * dx);
      if (perp < o.r + 10) best = Math.max(20, proj - o.r);
    }
    return best;
  }

  /** Is the thief inside the active flame capsule? */
  flameHits(tx: number, ty: number, tr: number): boolean {
    const f = this.flame;
    if (!f.active) return false;
    const grow = clamp(f.t / 0.18, 0, 1); // the flame extends quickly
    const L = f.len * grow;
    const dx = Math.cos(f.angle);
    const dy = Math.sin(f.angle);
    const fx = tx - f.x;
    const fy = ty - f.y;
    const proj = clamp(fx * dx + fy * dy, 0, L);
    const px = f.x + dx * proj;
    const py = f.y + dy * proj;
    return dist(px, py, tx, ty) < f.width * 0.5 + tr - 4;
  }

  groundFireHits(tx: number, ty: number, tr: number): boolean {
    for (const g of this.groundFires) if (dist(g.x, g.y, tx, ty) < g.r + tr - 8) return true;
    return false;
  }

  touches(tx: number, ty: number, tr: number): boolean {
    return this.state === "awake" && dist(this.x, this.y, tx, ty) < DRAGON_AWAKE_R + tr - 6;
  }
}
