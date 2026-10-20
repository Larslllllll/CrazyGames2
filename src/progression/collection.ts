/** Artefacts: the collectible layer. Five rarity tiers, eight per lair. */
export type Rarity = 0 | 1 | 2 | 3 | 4;
export const RARITY_NAMES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
export const RARITY_COLORS = ["#b9c3c6", "#7fe08a", "#5fb0ff", "#c77dff", "#ffb13b"] as const;
export const RARITY_BASE_VALUE = [60, 150, 400, 1000, 3000] as const;
export const RARITY_WEIGHTS = [50, 28, 14, 6, 2] as const;

export type ArtefactShape =
  | "goblet"
  | "crown"
  | "sword"
  | "egg"
  | "orb"
  | "ring"
  | "book"
  | "skull"
  | "mask"
  | "helmet"
  | "gem"
  | "harp";

export interface ArtefactDef {
  id: string;
  lair: string;
  name: string;
  rarity: Rarity;
  shape: ArtefactShape;
  color: string;
}

const A = (lair: string, list: [string, string, Rarity, ArtefactShape, string][]): ArtefactDef[] =>
  list.map(([id, name, rarity, shape, color]) => ({ id: `${lair}.${id}`, lair, name, rarity, shape, color }));

export const ARTEFACTS: readonly ArtefactDef[] = [
  ...A("cave", [
    ["goblet", "Mossy Goblet", 0, "goblet", "#9fb8a0"],
    ["skull", "Adventurer's Skull", 0, "skull", "#e8e2cf"],
    ["ring", "Signet Ring", 1, "ring", "#f0c94c"],
    ["book", "Damp Grimoire", 1, "book", "#6d5aa8"],
    ["sword", "Knight's Blade", 2, "sword", "#c9d6e2"],
    ["helmet", "Dented Helm", 2, "helmet", "#8d9aa8"],
    ["egg", "Green Dragon Egg", 3, "egg", "#7bd389"],
    ["orb", "Orb of Moss", 4, "orb", "#9bffb0"],
  ]),
  ...A("ice", [
    ["gem", "Frost Shard", 0, "gem", "#b9ecff"],
    ["goblet", "Icicle Chalice", 0, "goblet", "#d7f3ff"],
    ["mask", "Yeti Mask", 1, "mask", "#eaf7ff"],
    ["ring", "Glacier Ring", 1, "ring", "#8fd7ff"],
    ["harp", "Snow Harp", 2, "harp", "#cfeeff"],
    ["crown", "Frozen Crown", 2, "crown", "#aee2ff"],
    ["egg", "Blue Dragon Egg", 3, "egg", "#7fc4ea"],
    ["orb", "Heart of Winter", 4, "orb", "#9fe8ff"],
  ]),
  ...A("volcano", [
    ["skull", "Charred Skull", 0, "skull", "#5a4a44"],
    ["gem", "Ember Stone", 0, "gem", "#ff9d5c"],
    ["sword", "Magma Blade", 1, "sword", "#ff7b3d"],
    ["helmet", "Smith's Helm", 1, "helmet", "#8a4b3a"],
    ["mask", "Ash Mask", 2, "mask", "#3b2a28"],
    ["book", "Book of Flames", 2, "book", "#c93d2b"],
    ["egg", "Red Dragon Egg", 3, "egg", "#e25a3d"],
    ["orb", "Sun Core", 4, "orb", "#ffd25a"],
  ]),
  ...A("vault", [
    ["ring", "Royal Seal", 0, "ring", "#ffe066"],
    ["goblet", "King's Cup", 0, "goblet", "#f5d76e"],
    ["crown", "Lost Crown", 1, "crown", "#ffd700"],
    ["harp", "Golden Harp", 1, "harp", "#ffe8a0"],
    ["sword", "Sword of Kings", 2, "sword", "#fff4cf"],
    ["mask", "Gilded Mask", 2, "mask", "#f0c94c"],
    ["egg", "Golden Dragon Egg", 3, "egg", "#e9b93a"],
    ["orb", "The Dragon's Heart", 4, "orb", "#ffffff"],
  ]),
];

export const artefactsOf = (lair: string): ArtefactDef[] => ARTEFACTS.filter((a) => a.lair === lair);
export const artefactById = (id: string): ArtefactDef | undefined => ARTEFACTS.find((a) => a.id === id);
