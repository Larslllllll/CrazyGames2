import { WORLD } from "../core/canvas";
import { dist } from "../core/math";
import { Rng } from "../core/rng";
import { artefactsOf, RARITY_BASE_VALUE, RARITY_WEIGHTS, type ArtefactDef } from "../progression/collection";
import type { LairDef } from "../progression/lairs";
import type { Circle, Hazard, Item, LairLayout, Obstacle } from "./types";

export const DRAGON_HEAD = { x: 500, y: 335, r: 82 };
export const EXIT = { x: 500, y: 952, r: 50 };
export const SPAWN = { x: 500, y: 892 };

/** Collision circles of the sleeping dragon (head, neck, body, shoulders, tail). */
export const dragonCircles = (): Circle[] => [
  { x: DRAGON_HEAD.x, y: DRAGON_HEAD.y, r: DRAGON_HEAD.r },
  { x: 500, y: 250, r: 72 },
  { x: 500, y: 160, r: 128 },
  { x: 372, y: 130, r: 86 },
  { x: 628, y: 130, r: 86 },
  { x: 660, y: 290, r: 42 },
  { x: 735, y: 352, r: 38 },
  { x: 805, y: 428, r: 34 },
  { x: 862, y: 516, r: 30 },
  { x: 900, y: 608, r: 24 },
];

const COIN_R = 9;
const BIG_R = 12;
const GEM_R = 12;
const ART_R = 18;

interface Zone {
  /** 0 = next to the head, 1 = inner ring, 2 = outer floor. */
  of(x: number, y: number): number;
}

const zoneOf: Zone = {
  of(x, y) {
    const d = dist(x, y, DRAGON_HEAD.x, DRAGON_HEAD.y);
    return d < 210 ? 0 : d < 370 ? 1 : 2;
  },
};

export interface GenOptions {
  charmMult: number;
  /** Artefacts already in the museum get a small penalty so new ones show up a bit more often. */
  museum: string[];
}

export const generateLair = (def: LairDef, seed: number, daily: boolean, opts: GenOptions): LairLayout => {
  const rng = new Rng(seed);
  const dragon = dragonCircles();
  const obstacles: Obstacle[] = [];
  const hazards: Hazard[] = [];
  const items: Item[] = [];
  const margin = 34;

  const insideDragon = (x: number, y: number, pad: number): boolean =>
    dragon.some((c) => dist(x, y, c.x, c.y) < c.r + pad);
  const nearExit = (x: number, y: number, pad: number): boolean => dist(x, y, EXIT.x, EXIT.y) < EXIT.r + pad;
  const hitsObstacle = (x: number, y: number, pad: number): boolean =>
    obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + pad);
  const hitsHazard = (x: number, y: number, pad: number): boolean =>
    hazards.some((h) => dist(x, y, h.x, h.y) < h.r + pad);
  const free = (x: number, y: number, pad: number): boolean =>
    x > margin &&
    x < WORLD - margin &&
    y > 96 &&
    y < WORLD - margin &&
    !insideDragon(x, y, pad) &&
    !nearExit(x, y, pad + 40) &&
    !hitsObstacle(x, y, pad);

  // --- obstacles -------------------------------------------------------------------------
  const kinds: Obstacle["kind"][] =
    def.gimmick === "lava" ? ["rock", "rock", "stalagmite", "pillar"] : ["rock", "bone", "bone", "stalagmite", "pillar"];
  let tries = 0;
  while (obstacles.length < def.obstacles && tries++ < 600) {
    const x = rng.range(70, WORLD - 70);
    const y = rng.range(150, WORLD - 110);
    const r = rng.range(18, 34);
    if (!free(x, y, r + 40)) continue;
    if (obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + r + 70)) continue;
    // keep a clear lane in front of the exit so escapes are never blocked
    if (Math.abs(x - EXIT.x) < 90 && y > 700) continue;
    obstacles.push({ x, y, r, kind: rng.pick(kinds), seed: rng.int(0, 1e6) });
  }

  // --- hazards -------------------------------------------------------------------------
  const hazardKind: Hazard["kind"] | null = def.gimmick === "none" ? null : def.gimmick === "plates" ? "plate" : def.gimmick;
  const hazardCount = hazardKind === null ? 0 : hazardKind === "plate" ? 7 : 5;
  tries = 0;
  while (hazards.length < hazardCount && tries++ < 600) {
    const x = rng.range(90, WORLD - 90);
    const y = rng.range(170, WORLD - 130);
    const r = def.gimmick === "ice" ? rng.range(62, 108) : def.gimmick === "lava" ? rng.range(38, 64) : 26;
    if (!free(x, y, def.gimmick === "ice" ? 10 : r + 24)) continue;
    if (hazards.some((h) => dist(x, y, h.x, h.y) < h.r + r + 50)) continue;
    if (Math.abs(x - EXIT.x) < 110 && y > 680) continue;
    if (dist(x, y, SPAWN.x, SPAWN.y) < r + 90) continue;
    if (hazardKind === null) break;
    hazards.push({ kind: hazardKind, x, y, r, cooldown: 0 });
  }

  // --- loot -----------------------------------------------------------------------------
  let nextId = 1;
  const push = (
    kind: Item["kind"],
    x: number,
    y: number,
    r: number,
    value: number,
    weight: number,
    noise: number,
    tier = 0,
    artefact?: ArtefactDef,
  ): void => {
    items.push({
      id: nextId++,
      kind,
      x,
      y,
      r,
      value: Math.round(value * def.valueMult),
      weight,
      noise: noise * def.noiseMult,
      taken: false,
      phase: rng.range(0, 6.283),
      tier,
      artefact,
      grab: 0,
      pulled: false,
    });
  };
  const lavaFree = (x: number, y: number, pad: number): boolean =>
    def.gimmick !== "lava" || !hitsHazard(x, y, pad);

  // Artefacts first: rarer ones sit closer to the head.
  const pool = artefactsOf(def.id);
  const weights = pool.map((a) => {
    let w = RARITY_WEIGHTS[a.rarity];
    if (a.rarity >= 2) w *= opts.charmMult;
    if (opts.museum.includes(a.id)) w *= 0.7;
    return w;
  });
  const chosen: ArtefactDef[] = [];
  for (let i = 0; i < def.artefacts; i++) {
    const a = rng.weighted(pool, weights);
    if (chosen.includes(a) && rng.chance(0.75)) {
      i--;
      if (tries++ > 2000) break;
      continue;
    }
    chosen.push(a);
  }
  for (const a of chosen) {
    const wantZone = a.rarity >= 3 ? 0 : a.rarity === 2 ? rng.pick([0, 1]) : rng.pick([1, 2, 2]);
    tries = 0;
    while (tries++ < 400) {
      const x = rng.range(70, WORLD - 70);
      const y = rng.range(120, WORLD - 120);
      if (!free(x, y, ART_R + 14) || !lavaFree(x, y, ART_R + 20)) continue;
      if (zoneOf.of(x, y) !== wantZone) continue;
      if (items.some((it) => dist(x, y, it.x, it.y) < 110)) continue;
      push("artefact", x, y, ART_R, RARITY_BASE_VALUE[a.rarity], 8, 8, a.rarity, a);
      break;
    }
  }

  // Gems: mostly inner ring and next to the head.
  tries = 0;
  let gems = 0;
  while (gems < def.gems && tries++ < 2000) {
    const x = rng.range(60, WORLD - 60);
    const y = rng.range(110, WORLD - 110);
    if (!free(x, y, GEM_R + 8) || !lavaFree(x, y, GEM_R + 16)) continue;
    const z = zoneOf.of(x, y);
    const accept = z === 0 ? 0.9 : z === 1 ? 0.6 : 0.18;
    if (!rng.chance(accept)) continue;
    if (items.some((it) => dist(x, y, it.x, it.y) < (it.kind === "artefact" ? 50 : 40))) continue;
    const tier = z === 0 ? (rng.chance(0.5) ? 2 : 1) : z === 1 ? (rng.chance(0.35) ? 1 : 0) : 0;
    push("gem", x, y, GEM_R, [12, 20, 35][tier], 3, 3.5, tier);
    gems++;
  }

  // Coins come in piles: pick cluster centres, scatter coins around them.
  const clusters: { x: number; y: number; s: number; z: number }[] = [];
  tries = 0;
  while (clusters.length < 12 && tries++ < 500) {
    const x = rng.range(70, WORLD - 70);
    const y = rng.range(120, WORLD - 110);
    if (!free(x, y, 20)) continue;
    if (clusters.some((c) => dist(x, y, c.x, c.y) < 120)) continue;
    clusters.push({ x, y, s: rng.range(45, 95), z: zoneOf.of(x, y) });
  }
  const bigTotal = def.bigCoins;
  let coins = 0;
  let bigs = 0;
  tries = 0;
  while (coins + bigs < def.coins + bigTotal && tries++ < 6000) {
    const c = rng.pick(clusters);
    const a = rng.range(0, 6.283);
    const d = Math.abs(rng.range(-1, 1) + rng.range(-1, 1)) * c.s;
    const x = c.x + Math.cos(a) * d;
    const y = c.y + Math.sin(a) * d;
    const big = bigs < bigTotal && (c.z <= 1 ? rng.chance(0.3) : rng.chance(0.08));
    const r = big ? BIG_R : COIN_R;
    if (!free(x, y, r + 2) || !lavaFree(x, y, r + 14)) continue;
    if (items.some((it) => dist(x, y, it.x, it.y) < r + it.r + 4)) continue;
    if (big) {
      push("bigcoin", x, y, BIG_R, 5, 2, 2);
      bigs++;
    } else {
      push("coin", x, y, COIN_R, c.z === 0 ? 3 : c.z === 1 ? 2 : 1, 1, 1.2);
      coins++;
    }
  }

  const hoardValue = items.reduce((s, it) => s + it.value, 0);
  return {
    def,
    seed,
    daily,
    dragon: { x: DRAGON_HEAD.x, y: DRAGON_HEAD.y },
    dragonCircles: dragon,
    exit: { ...EXIT },
    spawn: { ...SPAWN },
    obstacles,
    hazards,
    items,
    hoardValue,
  };
};
