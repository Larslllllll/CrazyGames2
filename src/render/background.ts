import { WORLD } from "../core/canvas";
import type { LairLayout } from "../gameplay/types";
import { circle, seeded } from "./draw";

/**
 * Static scenery cached in an offscreen canvas (re-rendered on resize or lair change):
 * cave floor, walls, the gold mound under the dragon and the exit tunnel.
 */
export class Background {
  private canvas: HTMLCanvasElement | null = null;
  private key = "";

  get(layout: LairLayout, pixelSize: number): HTMLCanvasElement {
    const key = `${layout.def.id}:${layout.seed}:${Math.round(pixelSize)}`;
    if (this.canvas && this.key === key) return this.canvas;
    this.key = key;
    const size = Math.max(64, Math.round(pixelSize));
    const cv = this.canvas ?? document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const c = cv.getContext("2d")!;
    const s = size / WORLD;
    c.setTransform(s, 0, 0, s, 0, 0);
    this.paint(c, layout);
    this.canvas = cv;
    return cv;
  }

  private paint(c: CanvasRenderingContext2D, layout: LairLayout): void {
    const p = layout.def.palette;
    const rnd = seeded(layout.seed ^ 0x9e3779b9);
    // Floor.
    const g = c.createRadialGradient(500, 420, 80, 500, 500, 760);
    g.addColorStop(0, p.floor);
    g.addColorStop(1, p.floorDark);
    c.fillStyle = g;
    c.fillRect(0, 0, WORLD, WORLD);
    // Speckles / pebbles.
    for (let i = 0; i < 420; i++) {
      const x = rnd() * WORLD;
      const y = rnd() * WORLD;
      const r = 1.5 + rnd() * 4;
      c.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.12)";
      c.beginPath();
      c.arc(x, y, r, 0, 6.283);
      c.fill();
    }
    // Floor cracks.
    c.strokeStyle = "rgba(0,0,0,0.18)";
    c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      let x = rnd() * WORLD;
      let y = 120 + rnd() * (WORLD - 180);
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rnd() - 0.5) * 70;
        y += (rnd() - 0.5) * 70;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    // Lair gimmick ambience.
    if (layout.def.gimmick === "ice") {
      for (let i = 0; i < 60; i++) {
        c.fillStyle = "rgba(220,245,255,0.07)";
        c.beginPath();
        c.arc(rnd() * WORLD, rnd() * WORLD, 6 + rnd() * 20, 0, 6.283);
        c.fill();
      }
    }
    if (layout.def.gimmick === "lava") {
      const lg = c.createRadialGradient(500, 500, 100, 500, 500, 700);
      lg.addColorStop(0, "rgba(255,120,40,0.0)");
      lg.addColorStop(1, "rgba(255,90,30,0.14)");
      c.fillStyle = lg;
      c.fillRect(0, 0, WORLD, WORLD);
    }
    if (layout.def.gimmick === "plates") {
      c.strokeStyle = "rgba(255,230,150,0.08)";
      c.lineWidth = 3;
      for (let x = 100; x < WORLD; x += 100) {
        c.beginPath();
        c.moveTo(x, 90);
        c.lineTo(x, WORLD - 40);
        c.stroke();
      }
      for (let y = 190; y < WORLD; y += 100) {
        c.beginPath();
        c.moveTo(40, y);
        c.lineTo(WORLD - 40, y);
        c.stroke();
      }
    }
    // The gold mound under the dragon.
    const mound = c.createRadialGradient(500, 300, 40, 500, 300, 330);
    mound.addColorStop(0, "#e9b93a");
    mound.addColorStop(0.55, "#c9961f");
    mound.addColorStop(1, "rgba(160,110,20,0)");
    c.fillStyle = mound;
    c.beginPath();
    c.ellipse(500, 300, 360, 250, 0, 0, 6.283);
    c.fill();
    for (let i = 0; i < 420; i++) {
      const a = rnd() * 6.283;
      const d = Math.sqrt(rnd()) * 1.0;
      const x = 500 + Math.cos(a) * d * 330;
      const y = 300 + Math.sin(a) * d * 225;
      const r = 4 + rnd() * 5;
      circle(c, x, y, r, rnd() < 0.5 ? "#ffd95a" : "#f3c640", "#b8871f", 1.2);
    }
    // Walls: rough dark border with stalactites at the top.
    c.fillStyle = p.wallDark;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(WORLD, 0);
    c.lineTo(WORLD, WORLD);
    c.lineTo(0, WORLD);
    c.closePath();
    // Punch the floor out of the wall shape (even-odd).
    const inset = 26;
    c.moveTo(inset, inset + 40);
    let x = inset;
    let y = inset + 40;
    const edge: number[] = [];
    for (let i = 0; i <= 40; i++) {
      x = inset + (i / 40) * (WORLD - inset * 2);
      y = inset + 30 + rnd() * 50;
      edge.push(x, y);
    }
    for (let i = 0; i < edge.length; i += 2) c.lineTo(edge[i], edge[i + 1]);
    for (let i = 0; i <= 20; i++) c.lineTo(WORLD - inset + rnd() * 10 - 5, inset + 60 + (i / 20) * (WORLD - inset * 2 - 60));
    for (let i = 0; i <= 40; i++) c.lineTo(WORLD - inset - (i / 40) * (WORLD - inset * 2), WORLD - inset + rnd() * 10 - 5);
    for (let i = 0; i <= 20; i++) c.lineTo(inset + rnd() * 10 - 5, WORLD - inset - (i / 20) * (WORLD - inset * 2 - 60));
    c.closePath();
    c.fill("evenodd");
    // Lighter wall face.
    c.strokeStyle = p.wall;
    c.lineWidth = 14;
    c.beginPath();
    for (let i = 0; i < edge.length; i += 2) {
      if (i === 0) c.moveTo(edge[i], edge[i + 1]);
      else c.lineTo(edge[i], edge[i + 1]);
    }
    c.stroke();
    c.strokeRect(inset, inset, WORLD - inset * 2, WORLD - inset * 2);
    // Stalactites.
    for (let i = 0; i < 18; i++) {
      const sx = 60 + rnd() * (WORLD - 120);
      const h = 30 + rnd() * 60;
      c.fillStyle = p.wall;
      c.beginPath();
      c.moveTo(sx - 14, 40);
      c.lineTo(sx + 14, 40);
      c.lineTo(sx, 40 + h);
      c.closePath();
      c.fill();
    }
    // Exit tunnel at the bottom.
    const ex = layout.exit;
    const tg = c.createRadialGradient(ex.x, ex.y + 30, 10, ex.x, ex.y + 30, 160);
    tg.addColorStop(0, "rgba(255,240,180,0.35)");
    tg.addColorStop(1, "rgba(255,240,180,0)");
    c.fillStyle = tg;
    c.fillRect(ex.x - 170, ex.y - 150, 340, 190);
    c.fillStyle = "#07090b";
    c.beginPath();
    c.ellipse(ex.x, ex.y + 26, 64, 54, 0, Math.PI, 0);
    c.lineTo(ex.x + 64, WORLD);
    c.lineTo(ex.x - 64, WORLD);
    c.closePath();
    c.fill();
    c.strokeStyle = p.wall;
    c.lineWidth = 10;
    c.beginPath();
    c.ellipse(ex.x, ex.y + 26, 70, 60, 0, Math.PI, 0);
    c.stroke();
  }
}
