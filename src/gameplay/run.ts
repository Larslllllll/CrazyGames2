import { Emitter } from "../core/events";
import type { MoveInput } from "../core/input";
import { dist, len } from "../core/math";
import type { LairDef } from "../progression/lairs";
import { Dragon } from "./dragon";
import { Thief, type ThiefStats } from "./thief";
import type { Item, LairLayout, ObstacleKind } from "./types";

export type RunPhase = "ready" | "play" | "escaped" | "caught";
export type EndCause = "dragon" | "fire" | "lava" | "sneeze" | null;

export interface RunResult {
  phase: "escaped" | "caught";
  haul: number;
  baseHaul: number;
  bonus: number;
  closeCall: boolean;
  items: Item[];
  artefacts: Item[];
  coins: number;
  gems: number;
  time: number;
  takenFraction: number;
  woke: boolean;
  cause: EndCause;
  lair: LairDef;
  daily: boolean;
}

export type RunEvents = {
  start: null;
  pickup: { item: Item; x: number; y: number };
  grabStart: Item;
  bagfull: null;
  stage: number;
  wake: null;
  telegraph: null;
  fire: null;
  snore: null;
  step: { x: number; y: number; speed: number };
  bump: { x: number; y: number; kind: ObstacleKind | "dragon" | "wall"; speed: number };
  plate: { x: number; y: number };
  lullaby: number;
  lullabyFail: null;
  ice: boolean;
  end: RunResult;
};

/** One heist: a thief, a dragon and a hoard. Emits everything the presentation layer needs. */
export class Run {
  phase: RunPhase = "ready";
  readonly events = new Emitter<RunEvents>();
  readonly thief: Thief;
  readonly dragon: Dragon;
  time = 0;
  takenValue = 0;
  coins = 0;
  gems = 0;
  readonly collected: Item[] = [];
  result: RunResult | null = null;
  private bagfullCooldown = 0;
  private readonly lullabyAmount: number;

  constructor(
    readonly layout: LairLayout,
    stats: ThiefStats,
    lullabyLevel: number,
    lullabyAmount: number,
  ) {
    this.thief = new Thief(layout.spawn.x, layout.spawn.y, stats);
    this.thief.lullabyUses = lullabyLevel > 0 ? 1 : 0;
    this.lullabyAmount = lullabyAmount;
    this.dragon = new Dragon(layout);
  }

  get takenFraction(): number {
    return this.layout.hoardValue > 0 ? this.takenValue / this.layout.hoardValue : 0;
  }

  get remainingItems(): number {
    let n = 0;
    for (const it of this.layout.items) if (!it.taken) n++;
    return n;
  }

  start(): void {
    if (this.phase !== "ready") return;
    this.phase = "play";
    this.events.emit("start", null);
  }

  useLullaby(): void {
    if (this.phase !== "play") return;
    if (this.thief.lullabyUses <= 0 || !this.dragon.asleep) {
      this.events.emit("lullabyFail", null);
      return;
    }
    this.thief.lullabyUses--;
    this.dragon.calm(this.lullabyAmount);
    this.events.emit("lullaby", this.lullabyAmount);
  }

  /** Rewarded ad: the dragon sneezes the thief out of the lair with everything in the bag. */
  sneezeEscape(): void {
    if (this.phase !== "caught") return;
    this.phase = "play";
    this.end("escaped", "sneeze");
  }

  update(dt: number, input: MoveInput): void {
    const d = this.dragon;
    const t = this.thief;
    const dragonEv = {
      onStage: (s: number) => this.events.emit("stage", s),
      onWake: () => this.events.emit("wake", null),
      onTelegraph: () => this.events.emit("telegraph", null),
      onFire: () => this.events.emit("fire", null),
      onSnore: () => this.events.emit("snore", null),
    };
    if (this.phase !== "play") {
      // Idle animation only (snoring, bobbing loot).
      if (this.phase === "ready") {
        d.snorePhase = (d.snorePhase + dt / d.snoreCycle) % 1;
        const was = d.snoring;
        d.snoring = d.snorePhase < 0.36;
        if (d.snoring && !was) this.events.emit("snore", null);
      }
      return;
    }
    this.time += dt;
    this.bagfullCooldown = Math.max(0, this.bagfullCooldown - dt);

    t.update(dt, input, this.layout, d.snoreMask, {
      onStep: (x, y, speed) => this.events.emit("step", { x, y, speed }),
      onBump: (x, y, kind, speed) => {
        const base = kind === "bone" ? 7 : kind === "dragon" ? 10 : kind === "wall" ? 2.5 : 4;
        d.addNoise(base * this.layout.def.noiseMult * d.snoreMask);
        this.events.emit("bump", { x, y, kind, speed });
      },
      onNoise: (n) => d.addNoise(n),
      onIce: (sliding) => this.events.emit("ice", sliding),
    });

    // Hazards.
    for (const h of this.layout.hazards) {
      if (h.kind === "plate") {
        h.cooldown = Math.max(0, h.cooldown - dt);
        if (h.cooldown === 0 && dist(h.x, h.y, t.x, t.y) < h.r + t.r - 6) {
          h.cooldown = 1.6;
          d.addNoise(14 * this.layout.def.noiseMult);
          this.events.emit("plate", { x: h.x, y: h.y });
        }
      } else if (h.kind === "lava") {
        if (t.invuln <= 0 && dist(h.x, h.y, t.x, t.y) < h.r + t.r - 10) {
          this.end("caught", "lava");
          return;
        }
      }
    }

    this.updateLoot(dt);

    d.update(dt, t, this.takenFraction, dragonEv);
    if (d.state === "awake" && t.invuln <= 0) {
      if (d.touches(t.x, t.y, t.r)) {
        this.end("caught", "dragon");
        return;
      }
      if (d.flameHits(t.x, t.y, t.r) || d.groundFireHits(t.x, t.y, t.r)) {
        this.end("caught", "fire");
        return;
      }
    }

    // Escape through the tunnel.
    const ex = this.layout.exit;
    if (dist(t.x, t.y, ex.x, ex.y) < ex.r - 8 && (t.bagValue > 0 || d.state !== "asleep")) {
      this.end("escaped", null);
    }
  }

  private updateLoot(dt: number): void {
    const t = this.thief;
    const d = this.dragon;
    const reach = t.stats.magnet;
    for (const it of this.layout.items) {
      if (it.taken) continue;
      it.phase += dt * 2;
      const dd = dist(it.x, it.y, t.x, t.y);
      if (it.kind === "artefact") {
        if (dd < it.r + t.r + 10) {
          if (!t.canCarry(it.weight)) {
            this.bagFull();
            continue;
          }
          if (it.grab === 0) this.events.emit("grabStart", it);
          it.grab += dt / 0.55;
          if (it.grab >= 1) this.collect(it);
        } else if (it.grab > 0) {
          it.grab = Math.max(0, it.grab - dt * 1.6);
        }
        continue;
      }
      if (it.pulled) {
        const dx = t.x - it.x;
        const dy = t.y - it.y;
        const l = len(dx, dy);
        const step = (420 + 1400 * (1 - Math.min(1, l / (reach + 60)))) * dt;
        if (l <= step + 6) {
          this.collect(it);
        } else {
          it.x += (dx / l) * step;
          it.y += (dy / l) * step;
        }
        continue;
      }
      if (dd < reach + it.r) {
        if (!t.canCarry(it.weight)) {
          if (dd < it.r + t.r + 4) this.bagFull();
          continue;
        }
        it.pulled = true;
      }
    }
    void d;
  }

  private bagFull(): void {
    if (this.bagfullCooldown > 0) return;
    this.bagfullCooldown = 1.8;
    this.events.emit("bagfull", null);
  }

  private collect(it: Item): void {
    const t = this.thief;
    it.taken = true;
    it.pulled = false;
    t.bagWeight += it.weight;
    t.bagValue += it.value;
    t.squash = 1.18;
    this.takenValue += it.value;
    this.collected.push(it);
    if (it.kind === "gem") this.gems++;
    else if (it.kind !== "artefact") this.coins++;
    this.dragon.addNoise(it.noise * this.dragon.snoreMask);
    this.events.emit("pickup", { item: it, x: t.x, y: t.y });
  }

  private end(phase: "escaped" | "caught", cause: EndCause): void {
    if (this.phase !== "play") return;
    this.phase = phase;
    const woke = this.dragon.state !== "asleep";
    const closeCall = phase === "escaped" && woke && cause !== "sneeze";
    const baseHaul = phase === "escaped" ? this.thief.bagValue : 0;
    const bonus = closeCall ? Math.round(baseHaul * 0.2) : 0;
    this.result = {
      phase,
      haul: baseHaul + bonus,
      baseHaul,
      bonus,
      closeCall,
      items: this.collected.slice(),
      artefacts: this.collected.filter((i) => i.kind === "artefact"),
      coins: this.coins,
      gems: this.gems,
      time: this.time,
      takenFraction: this.takenFraction,
      woke,
      cause,
      lair: this.layout.def,
      daily: this.layout.daily,
    };
    this.events.emit("end", this.result);
  }
}
