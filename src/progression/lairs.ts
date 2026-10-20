export type Gimmick = "none" | "ice" | "lava" | "plates";

export interface LairPalette {
  floor: string;
  floorDark: string;
  wall: string;
  wallDark: string;
  glow: string;
  dragon: string;
  dragonDark: string;
  dragonBelly: string;
  dragonHorn: string;
  accent: string;
}

export interface LairDef {
  id: string;
  name: string;
  dragonName: string;
  tier: number;
  unlockCost: number;
  palette: LairPalette;
  /** Multiplies every noise source. */
  noiseMult: number;
  /** Seconds of deep sleep before the dragon's sleep starts getting lighter by itself. */
  graceTime: number;
  /** Meter points per second added after graceTime. */
  sleepLighten: number;
  /** Meter floor (0..100) reached when 100 % of the hoard value has been taken. */
  greedFloor: number;
  dragonSpeed: number;
  dragonTurn: number;
  fireCooldown: number;
  fireRange: number;
  coins: number;
  bigCoins: number;
  gems: number;
  artefacts: number;
  valueMult: number;
  obstacles: number;
  gimmick: Gimmick;
  blurb: string;
}

export const LAIRS: readonly LairDef[] = [
  {
    id: "cave",
    name: "Mossy Cave",
    dragonName: "Grumble the Green",
    tier: 1,
    unlockCost: 0,
    palette: {
      floor: "#3b4a44",
      floorDark: "#2b3833",
      wall: "#1f2b2a",
      wallDark: "#121a1a",
      glow: "#ffd867",
      dragon: "#5cb46e",
      dragonDark: "#37804a",
      dragonBelly: "#cfe6a8",
      dragonHorn: "#f1e4b5",
      accent: "#8fe39a",
    },
    noiseMult: 1,
    graceTime: 55,
    sleepLighten: 1.4,
    greedFloor: 55,
    dragonSpeed: 300,
    dragonTurn: 2.2,
    fireCooldown: 2.6,
    fireRange: 360,
    coins: 150,
    bigCoins: 22,
    gems: 14,
    artefacts: 4,
    valueMult: 1,
    obstacles: 9,
    gimmick: "none",
    blurb: "A deep sleeper. Bones on the floor clatter when you bump them.",
  },
  {
    id: "ice",
    name: "Frozen Hollow",
    dragonName: "Shiver the Frost",
    tier: 2,
    unlockCost: 1500,
    palette: {
      floor: "#56708a",
      floorDark: "#3e5468",
      wall: "#243445",
      wallDark: "#141f2b",
      glow: "#ffe08a",
      dragon: "#7fc4ea",
      dragonDark: "#4d8fbb",
      dragonBelly: "#e4f4ff",
      dragonHorn: "#f5fbff",
      accent: "#b7f0ff",
    },
    noiseMult: 1.1,
    graceTime: 50,
    sleepLighten: 1.6,
    greedFloor: 58,
    dragonSpeed: 330,
    dragonTurn: 2.4,
    fireCooldown: 2.4,
    fireRange: 380,
    coins: 190,
    bigCoins: 30,
    gems: 20,
    artefacts: 5,
    valueMult: 2.5,
    obstacles: 8,
    gimmick: "ice",
    blurb: "Ice patches make you slide. Sliding into things is loud.",
  },
  {
    id: "volcano",
    name: "Ember Pit",
    dragonName: "Cinder the Red",
    tier: 3,
    unlockCost: 6000,
    palette: {
      floor: "#5a3d35",
      floorDark: "#402a25",
      wall: "#2a1b19",
      wallDark: "#170e0d",
      glow: "#ffcf5a",
      dragon: "#e25a3d",
      dragonDark: "#a63a28",
      dragonBelly: "#ffd3a0",
      dragonHorn: "#3b2a28",
      accent: "#ff9d5c",
    },
    noiseMult: 1.25,
    graceTime: 45,
    sleepLighten: 1.9,
    greedFloor: 62,
    dragonSpeed: 360,
    dragonTurn: 2.6,
    fireCooldown: 2.1,
    fireRange: 420,
    coins: 220,
    bigCoins: 36,
    gems: 26,
    artefacts: 5,
    valueMult: 6,
    obstacles: 9,
    gimmick: "lava",
    blurb: "A light sleeper. Lava pools burn. Don't touch them.",
  },
  {
    id: "vault",
    name: "Royal Vault",
    dragonName: "Aurelia the Gold",
    tier: 4,
    unlockCost: 20000,
    palette: {
      floor: "#6a5a3a",
      floorDark: "#4c4029",
      wall: "#2f2719",
      wallDark: "#1a150d",
      glow: "#fff0a8",
      dragon: "#e9b93a",
      dragonDark: "#b8871f",
      dragonBelly: "#fff4cf",
      dragonHorn: "#fffdf3",
      accent: "#ffe66b",
    },
    noiseMult: 1.4,
    graceTime: 42,
    sleepLighten: 2.2,
    greedFloor: 66,
    dragonSpeed: 385,
    dragonTurn: 2.9,
    fireCooldown: 1.9,
    fireRange: 440,
    coins: 260,
    bigCoins: 44,
    gems: 32,
    artefacts: 6,
    valueMult: 15,
    obstacles: 10,
    gimmick: "plates",
    blurb: "Pressure plates ring a bell. The richest hoard in the realm.",
  },
];

export const lairById = (id: string): LairDef => LAIRS.find((l) => l.id === id) ?? LAIRS[0];
