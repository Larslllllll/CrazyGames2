import type { LairPalette } from "../progression/lairs";
import type { SkinDef } from "../progression/milestones";
import { circle, ellipse, poly, roundRect, shadow, type Ctx } from "./draw";

export interface SleepingDragonPose {
  /** Head centre. */
  hx: number;
  hy: number;
  /** 0..1 eye openness. */
  eye: number;
  stage: number;
  /** -1..1 breathing phase. */
  breath: number;
  /** 0..1 wake-up progress (head lifts, mouth opens). */
  waking: number;
  t: number;
  snoring: boolean;
  snorePhase: number;
}

/** The sleeping dragon, curled on its hoard (world coordinates; the body extends to the top wall). */
export const drawSleepingDragonArt = (c: Ctx, p: LairPalette, d: SleepingDragonPose): void => {
  const { hx, hy, breath, waking } = d;
  const lift = waking * 18;
  const jitter = waking > 0 ? (Math.random() - 0.5) * 6 : 0;
  shadow(c, 500, 270, 310, 215, 0.28);
  // Tail.
  c.lineCap = "round";
  const tail = [
    [612, 240],
    [700, 280],
    [780, 380],
    [860, 500],
    [895, 605],
  ];
  for (let pass = 0; pass < 2; pass++) {
    c.strokeStyle = pass === 0 ? p.dragonDark : p.dragon;
    c.beginPath();
    c.moveTo(tail[0][0], tail[0][1]);
    for (let i = 1; i < tail.length; i++) {
      const w = (46 - i * 7) * (pass === 0 ? 1.18 : 1);
      c.lineWidth = w;
      c.lineTo(tail[i][0], tail[i][1]);
      c.stroke();
      c.beginPath();
      c.moveTo(tail[i][0], tail[i][1]);
    }
  }
  poly(c, [885, 600, 925, 585, 915, 640, 880, 630], p.dragonDark);
  poly(c, [890, 603, 918, 592, 910, 630, 886, 622], p.dragon);
  // Wings (folded).
  c.save();
  c.translate(500, 150 + jitter);
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    c.translate(-120, 0);
    c.rotate(-0.55);
    ellipse(c, 0, 0, 105, 50 + breath * 2, p.dragonDark, 0, p.wallDark, 3);
    c.strokeStyle = "rgba(0,0,0,0.25)";
    c.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(60, 0);
      c.lineTo(-80, i * 18);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
  // Body + spine spikes.
  ellipse(c, 500, 175 + jitter, 152, 122 + breath * 4, p.dragon, 0, p.dragonDark, 5);
  for (let y = 60; y <= 230; y += 30) poly(c, [490, y + 6, 510, y + 6, 500, y - 16], p.dragonHorn, p.dragonDark, 2);
  // Belly scales on the chest.
  ellipse(c, 500, 262 + jitter, 60, 44, p.dragonBelly, 0, p.dragonDark, 3);
  for (let i = 0; i < 3; i++) {
    c.strokeStyle = "rgba(0,0,0,0.18)";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(500, 236 + i * 16 + jitter, 34, 0.25, Math.PI - 0.25);
    c.stroke();
  }
  // Paws.
  for (const side of [-1, 1]) {
    const px = 500 + side * 92;
    const py = 398 - lift * 0.5;
    shadow(c, px, py + 10, 38, 20, 0.22);
    ellipse(c, px, py, 38, 27, p.dragon, 0, p.dragonDark, 4);
    for (let i = -1; i <= 1; i++) poly(c, [px + i * 20 - 7, py + 22, px + i * 20 + 7, py + 22, px + i * 20, py + 38], p.dragonHorn, p.dragonDark, 2);
  }
  // Neck.
  ellipse(c, 500, 258 + jitter, 74, 58, p.dragon, 0, p.dragonDark, 5);
  // Horns.
  for (const side of [-1, 1]) {
    c.strokeStyle = p.dragonDark;
    c.lineWidth = 20;
    c.beginPath();
    c.moveTo(hx + side * 48, hy - 50 - lift);
    c.quadraticCurveTo(hx + side * 75, hy - 95 - lift, hx + side * 62, hy - 135 - lift);
    c.stroke();
    c.strokeStyle = p.dragonHorn;
    c.lineWidth = 12;
    c.stroke();
  }
  drawDragonHead(c, p, hx, hy - lift + jitter, 1 + waking * 0.12, d);
  // Snore halo: footsteps are masked while it shows.
  if (d.snoring && waking === 0) {
    const k = Math.min(1, Math.max(0, d.snorePhase / 0.36));
    c.globalAlpha = 0.35 * Math.sin(k * Math.PI);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(hx, hy + 20, 110 + k * 50, 0, 6.283);
    c.stroke();
    c.globalAlpha = 1;
  }
};

/** Head with animated eyes; reused by the cover renderer at other scales. */
export const drawDragonHead = (c: Ctx, p: LairPalette, x: number, y: number, scale: number, d: Pick<SleepingDragonPose, "eye" | "stage" | "waking" | "t">): void => {
  const { eye, stage, waking, t } = d;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 0, 0, 86, 78, p.dragon, 0, p.dragonDark, 5);
  roundRect(c, -46, 14, 92, 66, 30, p.dragon, p.dragonDark, 5);
  ellipse(c, 0, 48, 36, 18, p.dragonBelly);
  ellipse(c, -18, 66, 7, 4.5, p.dragonDark, -0.3);
  ellipse(c, 18, 66, 7, 4.5, p.dragonDark, 0.3);
  if (waking > 0) {
    const open = waking * 22;
    roundRect(c, -34, 60, 68, 8 + open, 8, "#3b0f0a");
    const mg = c.createRadialGradient(0, 70, 2, 0, 70, 60);
    mg.addColorStop(0, "rgba(255,200,80,0.9)");
    mg.addColorStop(1, "rgba(255,120,30,0)");
    c.fillStyle = mg;
    c.fillRect(-70, 20, 140, 120);
  }
  for (const side of [-1, 1]) {
    c.strokeStyle = p.dragonDark;
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(side * 48, -32 - eye * 8);
    c.quadraticCurveTo(side * 30, -42 - eye * 12 + (stage >= 2 ? 6 : 0), side * 14, -30 - eye * 4 + (stage >= 2 ? 8 : 0));
    c.stroke();
  }
  if (stage >= 2 || waking > 0) {
    const g = c.createRadialGradient(0, -18, 10, 0, -18, 90);
    g.addColorStop(0, `rgba(255,40,30,${0.25 + 0.2 * Math.sin(t * 9)})`);
    g.addColorStop(1, "rgba(255,40,30,0)");
    c.fillStyle = g;
    c.fillRect(-100, -90, 200, 140);
  }
  for (const side of [-1, 1]) {
    const ex = side * 32;
    const ey = -18;
    if (eye < 0.06) {
      c.strokeStyle = p.dragonDark;
      c.lineWidth = 5;
      c.beginPath();
      c.arc(ex, ey - 4, 14, 0.3, Math.PI - 0.3);
      c.stroke();
    } else {
      ellipse(c, ex, ey, 16, 13 * eye, "#fff6c8", 0, p.dragonDark, 3);
      ellipse(c, ex, ey, 11, 11 * eye, eye > 0.5 ? "#ffb13b" : "#f3c640", 0);
      ellipse(c, ex, ey, 4, 10 * eye, "#1b0f0a", 0);
      if (eye > 0.3) circle(c, ex - 4, ey - 4 * eye, 2.5, "#ffffff");
    }
  }
  c.restore();
};

export interface ThiefPose {
  x: number;
  y: number;
  facing: number;
  bob: number;
  moving: boolean;
  sneaking: boolean;
  /** Bag fill 0..1. */
  fill: number;
  scared: boolean;
  squash: number;
  scale: number;
}

/** The little hooded thief with a sack (top-down). */
export const drawThiefArt = (c: Ctx, sk: SkinDef, th: ThiefPose): void => {
  const bobY = Math.sin(th.bob) * (th.moving ? 2.2 : 0.6);
  const sneak = th.sneaking && th.moving ? 0.9 : 1;
  shadow(c, th.x, th.y + 12 * th.scale, 18 * th.scale, 8 * th.scale, 0.3);
  c.save();
  c.translate(th.x, th.y + bobY);
  c.scale((th.scale / Math.sqrt(th.squash)) * 1, th.scale * th.squash * sneak);
  const bx = -Math.cos(th.facing) * 15;
  const by = -Math.sin(th.facing) * 15;
  const sr = 8 + 11 * th.fill;
  circle(c, bx, by + 2, sr, sk.sack, "rgba(0,0,0,0.45)", 2.5);
  circle(c, bx - sr * 0.3, by - sr * 0.3, sr * 0.35, "rgba(255,255,255,0.18)");
  circle(c, bx, by - sr + 2, 4, "#5a3a1a");
  if (th.fill > 0.55) {
    circle(c, bx - 4, by - sr + 1, 4, "#f3c640", "#b8871f", 1.5);
    circle(c, bx + 4, by - sr + 2, 3.5, "#f3c640", "#b8871f", 1.5);
  }
  const stepA = Math.sin(th.bob * 1.4) * (th.moving ? 6 : 0);
  c.save();
  c.rotate(th.facing);
  ellipse(c, stepA, -7, 6, 4, sk.hoodDark);
  ellipse(c, -stepA, 7, 6, 4, sk.hoodDark);
  ellipse(c, -2, 0, 16, 15, sk.hood, 0, sk.hoodDark, 2.5);
  // Hands gripping the sack strap.
  circle(c, -9, -13, 4, sk.face, sk.hoodDark, 1.5);
  circle(c, -9, 13, 4, sk.face, sk.hoodDark, 1.5);
  circle(c, 5, 0, 11, sk.hood, sk.hoodDark, 2.5);
  ellipse(c, 10, 0, 7, 8, sk.face);
  const eyeR = th.scared ? 3.4 : 2.4;
  circle(c, 12, -3.5, eyeR, "#ffffff");
  circle(c, 12, 3.5, eyeR, "#ffffff");
  const px = th.scared ? 11.5 : 13;
  circle(c, px, -3.5, 1.5, "#1b1b1b");
  circle(c, px, 3.5, 1.5, "#1b1b1b");
  poly(c, [-4, -8, -4, 8, -16, 0], sk.hoodDark);
  c.restore();
  c.restore();
};
