import type { ArtefactDef } from "../progression/collection";
import type { LairDef } from "../progression/lairs";

export type ItemKind = "coin" | "bigcoin" | "gem" | "artefact";

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  r: number;
  value: number;
  weight: number;
  noise: number;
  taken: boolean;
  /** Visual phase for bobbing / glints. */
  phase: number;
  /** Gem colour tier (0..2). */
  tier: number;
  artefact?: ArtefactDef;
  /** Grab progress for artefacts (0..1). */
  grab: number;
  /** Magnet pull in progress. */
  pulled: boolean;
}

export type ObstacleKind = "rock" | "bone" | "stalagmite" | "pillar";

export interface Obstacle {
  x: number;
  y: number;
  r: number;
  kind: ObstacleKind;
  seed: number;
}

export type HazardKind = "ice" | "lava" | "plate";

export interface Hazard {
  kind: HazardKind;
  x: number;
  y: number;
  r: number;
  /** Pressure plate cooldown. */
  cooldown: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface LairLayout {
  def: LairDef;
  seed: number;
  daily: boolean;
  dragon: { x: number; y: number };
  dragonCircles: Circle[];
  exit: Circle;
  spawn: { x: number; y: number };
  obstacles: Obstacle[];
  hazards: Hazard[];
  items: Item[];
  hoardValue: number;
}
