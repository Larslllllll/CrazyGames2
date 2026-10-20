import { circle, roundRect, poly, shadow } from "./draw";

/**
 * Pre-rendered loot sprites (coin, gold bar, three gem colours) at the current pixel scale.
 * Hundreds of coins per lair → drawImage is far cheaper than three path fills each.
 */
export interface Sprite {
  canvas: HTMLCanvasElement;
  /** World-unit offset of the sprite's top-left from the item centre. */
  ox: number;
  oy: number;
  /** World-unit size. */
  w: number;
  h: number;
}

export const GEM_COLORS = ["#5fe0a0", "#5fb0ff", "#ff5f7a"];

export class SpriteCache {
  private key = "";
  coin!: Sprite;
  bigcoin!: Sprite;
  gems: Sprite[] = [];

  ensure(pxPerUnit: number): void {
    const k = Math.round(pxPerUnit * 100) / 100;
    const key = String(k);
    if (key === this.key) return;
    this.key = key;
    this.coin = this.make(32, 32, k, (c) => {
      shadow(c, 0, 4, 9, 4.5, 0.25);
      circle(c, 0, 0, 9, "#f3c640", "#b8871f", 2);
      circle(c, -2.25, -2.25, 3.15, "#ffe88a");
    });
    this.bigcoin = this.make(40, 32, k, (c) => {
      shadow(c, 0, 5, 13, 6, 0.25);
      roundRect(c, -13, -8, 26, 16, 4, "#f7cf4a", "#b8871f", 2.5);
      roundRect(c, -9, -5, 18, 4, 2, "#fff0b0");
    });
    this.gems = GEM_COLORS.map((col) =>
      this.make(32, 36, k, (c) => {
        shadow(c, 0, 5, 12, 6, 0.25);
        poly(c, [-11, -3, -6, -10, 6, -10, 11, -3, 0, 11], col, "rgba(0,0,0,0.45)", 2);
        poly(c, [-6, -10, 0, -3, 6, -10], "rgba(255,255,255,0.5)");
      }),
    );
  }

  private make(w: number, h: number, k: number, draw: (c: CanvasRenderingContext2D) => void): Sprite {
    const cv = document.createElement("canvas");
    cv.width = Math.max(2, Math.ceil(w * k));
    cv.height = Math.max(2, Math.ceil(h * k));
    const c = cv.getContext("2d")!;
    c.setTransform(k, 0, 0, k, (w / 2) * k, (h / 2) * k);
    draw(c);
    return { canvas: cv, ox: -w / 2, oy: -h / 2, w, h };
  }
}
