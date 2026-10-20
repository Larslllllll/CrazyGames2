import { clamp } from "./math";

/** World units: the lair is a WORLD×WORLD square that is always fully visible. */
export const WORLD = 1000;

export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Owns the canvas, the device-pixel-ratio and the world→screen transform.
 * The world square is fitted into the viewport (letterboxed) so both orientations work.
 */
export class Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  width = 1;
  height = 1;
  dpr = 1;
  /** Screen-space rect of the world square (CSS px). */
  world: ViewRect = { x: 0, y: 0, w: 1, h: 1 };
  scale = 1;
  portrait = false;
  private listeners: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 50));
    this.resize();
  }

  onResize(fn: () => void): void {
    this.listeners.push(fn);
  }

  resize(): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    // Cap the DPR: 2 is enough for crisp vectors; low-end phones stay fast.
    const lowEnd = (navigator.hardwareConcurrency ?? 4) <= 4 && Math.min(w, h) < 500;
    this.dpr = clamp(window.devicePixelRatio || 1, 1, lowEnd ? 1.5 : 2);
    this.width = w;
    this.height = h;
    this.portrait = h > w;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    // Leave room for the HUD: a strip above (meter) and below (joystick / buttons).
    const topPad = this.portrait ? 92 : 64;
    const bottomPad = this.portrait ? 96 : 18;
    const sidePad = this.portrait ? 6 : 24;
    const availW = w - sidePad * 2;
    const availH = h - topPad - bottomPad;
    const size = Math.max(50, Math.min(availW, availH));
    this.scale = size / WORLD;
    const x = (w - size) / 2;
    const y = topPad + (availH - size) / 2;
    this.world = { x, y, w: size, h: size };
    for (const fn of this.listeners) fn();
  }

  /** Apply the world transform (call after ctx.save()). */
  applyWorld(shakeX = 0, shakeY = 0, zoom = 1): void {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const cx = this.world.x + this.world.w / 2 + shakeX;
    const cy = this.world.y + this.world.h / 2 + shakeY;
    c.translate(cx, cy);
    c.scale(this.scale * zoom, this.scale * zoom);
    c.translate(-WORLD / 2, -WORLD / 2);
  }

  /** Screen-space (CSS px) transform. */
  applyScreen(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - this.world.x) / this.scale, y: (sy - this.world.y) / this.scale };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: this.world.x + wx * this.scale, y: this.world.y + wy * this.scale };
  }
}
