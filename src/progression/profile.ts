import type { UpgradeId } from "./upgrades";
import { UPGRADES } from "./upgrades";

export interface Settings {
  sound: boolean;
  music: boolean;
}

export interface DailyState {
  key: string;
  played: boolean;
  best: number;
}

export interface Profile {
  v: number;
  gold: number;
  totalGold: number;
  upgrades: Record<UpgradeId, number>;
  unlocked: string[];
  lair: string;
  museum: string[];
  bestHaul: number;
  bestHaulByLair: Record<string, number>;
  runs: number;
  escapes: number;
  caught: number;
  closeCalls: number;
  skins: string[];
  skin: string;
  settings: Settings;
  daily: DailyState;
  milestones: string[];
  hints: Record<string, boolean>;
  playSeconds: number;
}

export const PROFILE_VERSION = 1;
export const PROFILE_KEY = "dwd.profile";

export const defaultProfile = (): Profile => ({
  v: PROFILE_VERSION,
  gold: 0,
  totalGold: 0,
  upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])) as Record<UpgradeId, number>,
  unlocked: ["cave"],
  lair: "cave",
  museum: [],
  bestHaul: 0,
  bestHaulByLair: {},
  runs: 0,
  escapes: 0,
  caught: 0,
  closeCalls: 0,
  skins: ["hood"],
  skin: "hood",
  settings: { sound: true, music: true },
  daily: { key: "", played: false, best: 0 },
  milestones: [],
  hints: {},
  playSeconds: 0,
});

/** Merge a stored JSON blob onto defaults (tolerates missing keys from older versions). */
export const parseProfile = (raw: string | null): Profile => {
  const p = defaultProfile();
  if (!raw) return p;
  try {
    const o = JSON.parse(raw) as Partial<Profile>;
    if (!o || typeof o !== "object") return p;
    const num = (v: unknown, d: number): number => (typeof v === "number" && isFinite(v) ? v : d);
    p.gold = Math.max(0, num(o.gold, 0));
    p.totalGold = Math.max(0, num(o.totalGold, 0));
    for (const u of UPGRADES) p.upgrades[u.id] = Math.min(u.maxLevel, Math.max(0, num(o.upgrades?.[u.id], 0)));
    if (Array.isArray(o.unlocked)) p.unlocked = Array.from(new Set(["cave", ...o.unlocked.filter((x) => typeof x === "string")]));
    if (typeof o.lair === "string" && p.unlocked.includes(o.lair)) p.lair = o.lair;
    if (Array.isArray(o.museum)) p.museum = o.museum.filter((x) => typeof x === "string");
    p.bestHaul = num(o.bestHaul, 0);
    if (o.bestHaulByLair && typeof o.bestHaulByLair === "object") p.bestHaulByLair = { ...o.bestHaulByLair };
    p.runs = num(o.runs, 0);
    p.escapes = num(o.escapes, 0);
    p.caught = num(o.caught, 0);
    p.closeCalls = num(o.closeCalls, 0);
    if (Array.isArray(o.skins)) p.skins = Array.from(new Set(["hood", ...o.skins.filter((x) => typeof x === "string")]));
    if (typeof o.skin === "string" && p.skins.includes(o.skin)) p.skin = o.skin;
    if (o.settings) p.settings = { sound: o.settings.sound !== false, music: o.settings.music !== false };
    if (o.daily) p.daily = { key: String(o.daily.key ?? ""), played: !!o.daily.played, best: num(o.daily.best, 0) };
    if (Array.isArray(o.milestones)) p.milestones = o.milestones.filter((x) => typeof x === "string");
    if (o.hints && typeof o.hints === "object") p.hints = { ...o.hints };
    p.playSeconds = num(o.playSeconds, 0);
  } catch {
    /* corrupt save → defaults */
  }
  return p;
};
