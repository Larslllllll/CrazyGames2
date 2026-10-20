export type UpgradeId = "boots" | "bag" | "legs" | "magnet" | "charm" | "lullaby";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  blurb: string;
  maxLevel: number;
  baseCost: number;
  growth: number;
  /** Human readable effect at a level. */
  effect: (level: number) => string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: "bag",
    name: "Big Bag",
    blurb: "Carry more loot per heist.",
    maxLevel: 6,
    baseCost: 50,
    growth: 1.75,
    effect: (l) => `Capacity ${bagCapacity(l)}`,
  },
  {
    id: "boots",
    name: "Quiet Boots",
    blurb: "Footsteps make less noise.",
    maxLevel: 5,
    baseCost: 60,
    growth: 1.75,
    effect: (l) => `Step noise ${Math.round(stepNoiseMult(l) * 100)}%`,
  },
  {
    id: "legs",
    name: "Fast Legs",
    blurb: "Run faster. Escape faster.",
    maxLevel: 5,
    baseCost: 80,
    growth: 1.75,
    effect: (l) => `Speed +${Math.round((speedMult(l) - 1) * 100)}%`,
  },
  {
    id: "magnet",
    name: "Gold Magnet",
    blurb: "Pull coins from further away.",
    maxLevel: 5,
    baseCost: 70,
    growth: 1.75,
    effect: (l) => `Reach ${magnetRadius(l)}`,
  },
  {
    id: "charm",
    name: "Lucky Charm",
    blurb: "Rarer artefacts appear in the hoard.",
    maxLevel: 5,
    baseCost: 120,
    growth: 1.8,
    effect: (l) => `Rare odds +${Math.round((charmMult(l) - 1) * 100)}%`,
  },
  {
    id: "lullaby",
    name: "Lullaby",
    blurb: "Once per heist: hum the dragon back to sleep.",
    maxLevel: 5,
    baseCost: 150,
    growth: 1.8,
    effect: (l) => (l === 0 ? "Locked" : `Calms ${lullabyAmount(l)} sleep`),
  },
];

export const upgradeById = (id: UpgradeId): UpgradeDef => UPGRADES.find((u) => u.id === id)!;
export const upgradeCost = (def: UpgradeDef, level: number): number =>
  Math.round(def.baseCost * Math.pow(def.growth, level));

export const bagCapacity = (l: number): number => 40 + 12 * l;
export const stepNoiseMult = (l: number): number => 1 - 0.12 * l;
export const speedMult = (l: number): number => 1 + 0.08 * l;
export const magnetRadius = (l: number): number => 34 + 12 * l;
export const charmMult = (l: number): number => 1 + 0.35 * l;
export const lullabyAmount = (l: number): number => (l <= 0 ? 0 : 30 + 10 * l);
