import type { Profile } from "./profile";
import { LAIRS } from "./lairs";
import { artefactsOf } from "./collection";

export interface MilestoneDef {
  id: string;
  name: string;
  blurb: string;
  reward: number;
  skin?: string;
  check: (p: Profile) => boolean;
}

export interface SkinDef {
  id: string;
  name: string;
  hood: string;
  hoodDark: string;
  face: string;
  sack: string;
}

export const SKINS: readonly SkinDef[] = [
  { id: "hood", name: "Hooded Thief", hood: "#7a4f2a", hoodDark: "#55361c", face: "#f3c9a0", sack: "#9c7a4f" },
  { id: "shadow", name: "Shadow", hood: "#2d2f45", hoodDark: "#1b1c2b", face: "#e9d3c0", sack: "#4b4d66" },
  { id: "emerald", name: "Emerald Rogue", hood: "#2f8f5a", hoodDark: "#1f6640", face: "#f3c9a0", sack: "#7a9a5a" },
  { id: "frost", name: "Frost Walker", hood: "#7fc4ea", hoodDark: "#4d8fbb", face: "#f7e3d3", sack: "#9fd0e6" },
  { id: "ember", name: "Ember Runner", hood: "#e25a3d", hoodDark: "#a63a28", face: "#f3c9a0", sack: "#b8603f" },
  { id: "royal", name: "Royal Thief", hood: "#e9b93a", hoodDark: "#b8871f", face: "#f3c9a0", sack: "#f0d58a" },
];

export const skinById = (id: string): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];

const museumComplete = (p: Profile, lair: string): boolean => artefactsOf(lair).every((a) => p.museum.includes(a.id));

export const MILESTONES: readonly MilestoneDef[] = [
  { id: "escape1", name: "First Escape", blurb: "Escape a lair with loot.", reward: 40, check: (p) => p.escapes >= 1 },
  { id: "artefact1", name: "Collector", blurb: "Bank your first artefact.", reward: 60, check: (p) => p.museum.length >= 1 },
  { id: "haul500", name: "Pocket Money", blurb: "Bank 500 gold in one heist.", reward: 100, check: (p) => p.bestHaul >= 500 },
  { id: "haul2k", name: "Big Haul", blurb: "Bank 2,000 gold in one heist.", reward: 300, check: (p) => p.bestHaul >= 2000 },
  { id: "haul10k", name: "Dragon's Nightmare", blurb: "Bank 10,000 gold in one heist.", reward: 1000, check: (p) => p.bestHaul >= 10000 },
  { id: "haul50k", name: "Legend of the Vault", blurb: "Bank 50,000 gold in one heist.", reward: 5000, check: (p) => p.bestHaul >= 50000 },
  { id: "close5", name: "Close Calls", blurb: "Escape an awake dragon 5 times.", reward: 150, skin: "shadow", check: (p) => p.closeCalls >= 5 },
  { id: "caught10", name: "Crispy", blurb: "Get caught 10 times. Ouch.", reward: 120, check: (p) => p.caught >= 10 },
  { id: "escapes25", name: "Professional", blurb: "Escape 25 heists.", reward: 400, check: (p) => p.escapes >= 25 },
  { id: "escapes100", name: "Master Thief", blurb: "Escape 100 heists.", reward: 2000, check: (p) => p.escapes >= 100 },
  { id: "museum.cave", name: "Cave Curator", blurb: "Complete the Mossy Cave collection.", reward: 500, skin: "emerald", check: (p) => museumComplete(p, "cave") },
  { id: "museum.ice", name: "Ice Curator", blurb: "Complete the Frozen Hollow collection.", reward: 1500, skin: "frost", check: (p) => museumComplete(p, "ice") },
  { id: "museum.volcano", name: "Ember Curator", blurb: "Complete the Ember Pit collection.", reward: 4000, skin: "ember", check: (p) => museumComplete(p, "volcano") },
  { id: "museum.vault", name: "Royal Curator", blurb: "Complete the Royal Vault collection.", reward: 10000, skin: "royal", check: (p) => museumComplete(p, "vault") },
  ...LAIRS.filter((l) => l.tier > 1).map((l) => ({
    id: `unlock.${l.id}`,
    name: `${l.name} Unlocked`,
    blurb: `Reach the ${l.name}.`,
    reward: l.unlockCost / 10,
    check: (p: Profile) => p.unlocked.includes(l.id),
  })),
];

/** Returns newly completed milestones (and marks them). */
export const checkMilestones = (p: Profile): MilestoneDef[] => {
  const out: MilestoneDef[] = [];
  for (const m of MILESTONES) {
    if (p.milestones.includes(m.id)) continue;
    if (m.check(p)) {
      p.milestones.push(m.id);
      p.gold += m.reward;
      p.totalGold += m.reward;
      if (m.skin && !p.skins.includes(m.skin)) p.skins.push(m.skin);
      out.push(m);
    }
  }
  return out;
};

/** 0..100 for the SDK's reportGameCompletedPercentage. */
export const completionPercent = (p: Profile): number => {
  const total = MILESTONES.length;
  return Math.round((100 * p.milestones.length) / total);
};
