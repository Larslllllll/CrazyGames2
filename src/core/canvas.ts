import { clamp, damp } from "./math";

/** World units: the lair is a WORLD×WORLD square. */
export const WORLD = 1000;
/** Thief radius in world units; the camera zooms so it is never smaller than TARGET_THIEF_PX on screen. */
const THIEF_R = 15;
const TARGET_THIEF_PX = 10.5;

export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Owns the canvas, the device-pixel-ratio and the camera (world→screen transform).
 * The view area is the screen minus HUD strips; the camera follows a target with a zoom that keeps the
 * thief readable on small phones and shows the whole lair on desktop.
 */
export class Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  width = 1;
  height = 1;
  dpr = 1;
  /** Screen-space area (CSS px) reserved for the world. */
  view: ViewRect = { x: 0, y: 0, w: 1, h: 1 };
  /** Scale at which the whole world fits the view's smaller side. */
  baseScale = 1;
  /** Zoom used during play on this screen (≥ 1). */
  playZoom = 1;
  zoom = 1;
  camX = WORLD / 2;
  camY = WORLD / 2;
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

  get scale(): number {
    return this.baseScale * this.zoom;
  }

  onResize(fn: () => void): void {
    this.listeners.push(fn);
  }

  resize(): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const lowEnd = (navigator.hardwareConcurrency ?? 4) <= 4 && Math.min(w, h) < 500;
    this.dpr = clamp(window.devicePixelRatio || 1, 1, lowEnd ? 1.5 : 2);
    this.width = w;
    this.height = h;
    this.portrait = h > w;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const topPad = this.portrait ? 104 : 72;
    const bottomPad = this.portrait ? 60 : 14;
    const sidePad = this.portrait ? 0 : 8;
    this.view = { x: sidePad, y: topPad, w: Math.max(50, w - sidePad * 2), h: Math.max(50, h - topPad - bottomPad) };
    this.baseScale = Math.min(this.view.w, this.view.h) / WORLD;
    this.playZoom = clamp(TARGET_THIEF_PX / (THIEF_R * this.baseScale), 1, 2.4);
    this.clampCamera();
    for (const fn of this.listeners) fn();
  }

  /** Move the camera towards a target (world units) with the given zoom; call once per frame. */
  follow(tx: number, ty: number, zoom: number, dt: number, snap = false): void {
    this.zoom = snap ? zoom : damp(this.zoom, zoom, 5, dt);
    if (snap) {
      this.camX = tx;
      this.camY = ty;
    } else {
      this.camX = damp(this.camX, tx, 7, dt);
      this.camY = damp(this.camY, ty, 7, dt);
    }
    this.clampCamera();
  }

  private clampCamera(): void {
    const s = this.scale;
    const hw = this.view.w / s / 2;
    const hh = this.view.h / s / 2;
    this.camX = hw >= WORLD / 2 ? WORLD / 2 : clamp(this.camX, hw, WORLD - hw);
    this.camY = hh >= WORLD / 2 ? WORLD / 2 : clamp(this.camY, hh, WORLD - hh);
  }

  /** Apply the world transform (after ctx.save()). */
  applyWorld(shakeX = 0, shakeY = 0, punch = 1): void {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.translate(this.view.x + this.view.w / 2 + shakeX, this.view.y + this.view.h / 2 + shakeY);
    c.scale(this.scale * punch, this.scale * punch);
    c.translate(-this.camX, -this.camY);
  }

  applyScreen(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const s = this.scale;
    return { x: (sx - this.view.x - this.view.w / 2) / s + this.camX, y: (sy - this.view.y - this.view.h / 2) / s + this.camY };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const s = this.scale;
    return { x: this.view.x + this.view.w / 2 + (wx - this.camX) * s, y: this.view.y + this.view.h / 2 + (wy - this.camY) * s };
  }

  /** Visible world rectangle. */
  visible(): ViewRect {
    const s = this.scale;
    const w = this.view.w / s;
    const h = this.view.h / s;
    return { x: this.camX - w / 2, y: this.camY - h / 2, w, h };
  }

  /** Pixel size for the cached world background (rendered at the play zoom so it never looks blurry). */
  get worldPixelSize(): number {
    return WORLD * this.baseScale * this.playZoom * this.dpr;
  }
}
