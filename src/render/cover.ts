import { lairById } from "../progression/lairs";
import { skinById } from "../progression/milestones";
import { circle, ellipse, poly, star, type Ctx } from "./draw";
import { drawArtefact } from "./artefacts";
import { drawSleepingDragonArt, drawThiefArt } from "./dragonArt";
import { seeded } from "./draw";

export type CoverVariant = "16x9" | "2x3" | "1x1";

const SIZES: Record<CoverVariant, [number, number]> = { "16x9": [1920, 1080], "2x3": [800, 1200], "1x1": [800, 800] };

/**
 * Store covers rendered from the game's own art: the thief tiptoeing past the dragon with one eye
 * half open. Only the title is written on the image (CrazyGames cover rules).
 */
export const renderCover = (variant: CoverVariant): HTMLCanvasElement => {
  const [w, h] = SIZES[variant];
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  const p = lairById("cave").palette;
  const rnd = seeded(7);
  // Cave background.
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0d1517");
  bg.addColorStop(0.55, "#22312f");
  bg.addColorStop(1, "#141d1c");
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  // Layout per variant (dragon scale / head position / thief position / title box).
  const L =
    variant === "16x9"
      ? { s: 2.05, hx: 1290, hy: 640, tx: 520, ty: 790, ts: 5.2, title: { x: 60, y: 90, size: 150, w: 980 } }
      : variant === "2x3"
        ? { s: 1.55, hx: 470, hy: 760, tx: 200, ty: 1010, ts: 4.2, title: { x: 40, y: 60, size: 120, w: 720 } }
        : { s: 1.3, hx: 520, hy: 520, tx: 190, ty: 660, ts: 3.6, title: { x: 36, y: 46, size: 98, w: 728 } };
  // Warm hoard glow behind the dragon.
  const glow = c.createRadialGradient(L.hx, L.hy + 60, 40, L.hx, L.hy + 60, Math.max(w, h) * 0.75);
  glow.addColorStop(0, "rgba(255,205,80,0.55)");
  glow.addColorStop(0.45, "rgba(230,150,30,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, w, h);
  // Gold mound: lots of coins.
  const coins: [number, number, number][] = [];
  for (let i = 0; i < 900; i++) {
    const a = rnd() * 6.283;
    const d = Math.sqrt(rnd());
    const x = L.hx + Math.cos(a) * d * w * 0.55;
    const y = L.hy + 120 * L.s * 0.5 + Math.sin(a) * d * h * 0.28 + 60;
    if (y < L.hy - 40) continue;
    coins.push([x, y, 8 + rnd() * 9]);
  }
  coins.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of coins) {
    circle(c, x, y, r * L.s * 0.6, rnd() < 0.5 ? "#ffd95a" : "#f3c640", "#9c6d12", 2);
    circle(c, x - r * 0.25, y - r * 0.25, r * 0.22 * L.s, "#fff2b0");
  }
  // The dragon (world coordinates → cover).
  c.save();
  c.translate(L.hx - 500 * L.s, L.hy - 335 * L.s);
  c.scale(L.s, L.s);
  drawSleepingDragonArt(c, p, { hx: 500, hy: 335, eye: 0.5, stage: 1, breath: 0.3, waking: 0, t: 1, snoring: false, snorePhase: 0 });
  c.restore();
  // Foreground loot near the thief + the legendary orb.
  c.save();
  c.translate(L.hx + 30 * L.s, L.hy + 150 * L.s);
  c.scale(L.s * 1.2, L.s * 1.2);
  const og = c.createRadialGradient(0, 0, 4, 0, 0, 60);
  og.addColorStop(0, "rgba(155,255,176,0.6)");
  og.addColorStop(1, "rgba(155,255,176,0)");
  c.fillStyle = og;
  c.fillRect(-70, -70, 140, 140);
  drawArtefact(c, "orb", "#9bffb0", 18);
  c.restore();
  // The thief tiptoeing away with a bulging sack.
  const sk = skinById("hood");
  drawThiefArt(c, sk, { x: L.tx, y: L.ty, facing: -0.35, bob: 1.2, moving: true, sneaking: true, fill: 1, scared: true, squash: 1, scale: L.ts });
  for (let i = 0; i < 7; i++) {
    const x = L.tx + (rnd() - 0.5) * 320;
    const y = L.ty + 40 + rnd() * 120;
    circle(c, x, y, 9 * L.ts * 0.5, "#ffd95a", "#9c6d12", 2);
  }
  star(c, L.tx + 70 * (L.ts / 4), L.ty - 60 * (L.ts / 4), 16, "#ffffff", 4);
  star(c, L.tx - 90 * (L.ts / 4), L.ty - 20 * (L.ts / 4), 10, "#ffffff", 4);
  // Sweat drop: he knows.
  c.save();
  c.translate(L.tx + 18 * L.ts * 0.9, L.ty - 14 * L.ts * 0.9);
  ellipse(c, 0, 0, 5 * L.ts * 0.5, 8 * L.ts * 0.5, "#9fd8ff", 0, "#2e6b94", 2);
  c.restore();
  // Vignette.
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
  // Title (the only text).
  drawTitle(c, L.title.x, L.title.y, L.title.size, L.title.w);
  void poly;
  return cv;
};

const drawTitle = (c: Ctx, x: number, y: number, size: number, maxW: number): void => {
  const lines: [string, number][] = [
    ["DON'T WAKE", size],
    ["THE DRAGON", size * 1.08],
  ];
  let cy = y;
  for (const [txt, sz] of lines) {
    c.font = `${sz}px "Titan One", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "top";
    let s = sz;
    while (c.measureText(txt).width > maxW && s > 20) {
      s -= 2;
      c.font = `${s}px "Titan One", sans-serif`;
    }
    c.lineJoin = "round";
    c.lineWidth = s * 0.16;
    c.strokeStyle = "rgba(0,0,0,0.75)";
    c.strokeText(txt, x + 6, cy + 10);
    c.lineWidth = s * 0.14;
    c.strokeStyle = "#3a2a05";
    c.strokeText(txt, x, cy);
    const g = c.createLinearGradient(0, cy, 0, cy + s);
    g.addColorStop(0, "#fff0a8");
    g.addColorStop(0.45, "#ffd95a");
    g.addColorStop(1, "#e69a1a");
    c.fillStyle = g;
    c.fillText(txt, x, cy);
    cy += s * 1.02;
  }
};
