import { hashString, todayKey } from "../core/rng";
import { LAIRS, type LairDef } from "./lairs";

/** The daily heist: one seeded lair per UTC day, the same for every player; cycles through all lairs. */
export const dailyKey = (): string => todayKey();
export const dailySeed = (key = dailyKey()): number => hashString(`dwd-daily-${key}`);
export const dailyLair = (key = dailyKey()): LairDef => {
  const dayIndex = Math.floor(Date.parse(key) / 86400000);
  return LAIRS[((dayIndex % LAIRS.length) + LAIRS.length) % LAIRS.length];
};
