import { WORLD } from "../core/canvas";
import { clamp, damp, dist, len, type Vec } from "../core/math";
import type { MoveInput } from "../core/input";
import type { LairLayout } from "./types";

export interface ThiefStats {
  maxSpeed: number;
  stepNoise: number;
  capacity: number;
  magnet: number;
}

export interface ThiefEvents {
  onStep: (x: number, y: number, speed: number) => void;
  onBump: (x: number, y: number, kind: "rock" | "bone" | "stalagmite" | "pillar" | "dragon" | "wall", speed: number) => void;
  onNoise: (amount: number) => void;
  onIce: (sliding: boolean) => void;
}

export class Thief {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  readonly r = 15;
  facing = -Math.PI / 2;
  /** 0..1 of max speed (for animation + noise). */
  speedFrac = 0;
  moving = false;
  sneaking = false;
  onIce = false;
  bob = 0;
  stepTimer = 0;
  bagWeight = 0;
  bagValue = 0;
  invuln = 0;
  lullabyUses = 0;
  /** Squash/stretch scale for juice. */
  squash = 1;
  private bumpCooldown = 0;

  constructor(
    x: number,
    y: number,
    readonly stats: ThiefStats,
  ) {
    this.x = x;
    this.y = y;
  }

  get loadFactor(): number {
    return 1 - 0.35 * clamp(this.bagWeight / this.stats.capacity, 0, 1);
  }

  canCarry(weight: number): boolean {
    return this.bagWeight + weight <= this.stats.capacity + 1e-6;
  }

  update(dt: number, input: MoveInput, layout: LairLayout, snoreMask: number, ev: ThiefEvents): void {
    const maxSpeed = this.stats.maxSpeed * this.loadFactor;
    const mag = len(input.x, input.y);
    this.sneaking = input.sneak || (mag > 0 && mag < 0.5);
    const tx = input.x * maxSpeed;
    const ty = input.y * maxSpeed;

    // Surface: ice patches reduce grip.
    let ice = false;
    for (const h of layout.hazards) {
      if (h.kind === "ice" && dist(this.x, this.y, h.x, h.y) < h.r) {
        ice = true;
        break;
      }
    }
    if (ice !== this.onIce) ev.onIce(ice);
    this.onIce = ice;
    const rate = ice ? 1.6 : 16;
    this.vx = damp(this.vx, tx, rate, dt);
    this.vy = damp(this.vy, ty, rate, dt);
    if (!ice && mag === 0 && len(this.vx, this.vy) < 4) {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Collisions: walls, obstacles, the dragon.
    this.bumpCooldown = Math.max(0, this.bumpCooldown - dt);
    const speedBefore = len(this.vx, this.vy);
    const m = 20;
    let wallHit = false;
    if (this.x < m) {
      this.x = m;
      if (this.vx < 0) this.vx = 0;
      wallHit = true;
    }
    if (this.x > WORLD - m) {
      this.x = WORLD - m;
      if (this.vx > 0) this.vx = 0;
      wallHit = true;
    }
    if (this.y < m) {
      this.y = m;
      if (this.vy < 0) this.vy = 0;
      wallHit = true;
    }
    if (this.y > WORLD - m) {
      this.y = WORLD - m;
      if (this.vy > 0) this.vy = 0;
      wallHit = true;
    }
    if (wallHit && speedBefore > 140 && this.bumpCooldown === 0) {
      this.bumpCooldown = 0.4;
      ev.onBump(this.x, this.y, "wall", speedBefore);
    }
    for (const o of layout.obstacles) this.pushOut(o.x, o.y, o.r + this.r, o.kind, speedBefore, ev);
    for (const c of layout.dragonCircles) this.pushOut(c.x, c.y, c.r + this.r - 2, "dragon", speedBefore, ev);

    // Animation + noise.
    const speed = len(this.vx, this.vy);
    this.speedFrac = clamp(speed / this.stats.maxSpeed, 0, 1.2);
    this.moving = speed > 8;
    if (speed > 8) this.facing = Math.atan2(this.vy, this.vx);
    this.bob += dt * (6 + 16 * this.speedFrac);
    if (this.moving) {
      // Footsteps: noise ∝ speed² (sneaking is nearly silent), masked by snoring.
      const noise = 11 * this.speedFrac * this.speedFrac * this.stats.stepNoise * snoreMask * layout.def.noiseMult * dt;
      ev.onNoise(noise);
      this.stepTimer -= dt * (0.6 + this.speedFrac);
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.32;
        ev.onStep(this.x, this.y, this.speedFrac);
      }
    } else {
      this.stepTimer = 0.05;
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.squash = damp(this.squash, 1, 10, dt);
  }

  private pushOut(
    cx: number,
    cy: number,
    minDist: number,
    kind: "rock" | "bone" | "stalagmite" | "pillar" | "dragon",
    speedBefore: number,
    ev: ThiefEvents,
  ): void {
    const dx = this.x - cx;
    const dy = this.y - cy;
    const d = len(dx, dy);
    if (d >= minDist || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    this.x = cx + nx * minDist;
    this.y = cy + ny * minDist;
    const vn = this.vx * nx + this.vy * ny;
    if (vn < 0) {
      this.vx -= vn * nx;
      this.vy -= vn * ny;
    }
    if (speedBefore > 150 && this.bumpCooldown === 0) {
      this.bumpCooldown = 0.45;
      this.squash = 0.7;
      ev.onBump(this.x - nx * this.r, this.y - ny * this.r, kind, speedBefore);
    }
  }

  pos(): Vec {
    return { x: this.x, y: this.y };
  }
}
