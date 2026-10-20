import { clamp, damp } from "../core/math";

/** Screen shake (trauma based), slow motion, flashes and the stage-2 danger vignette. */
export class Juice {
  trauma = 0;
  shakeX = 0;
  shakeY = 0;
  timeScale = 1;
  private slowT = 0;
  private slowScale = 1;
  flashAlpha = 0;
  flashColor = "#ffffff";
  vignette = 0;
  vignetteTarget = 0;
  zoom = 1;
  private zoomPunch = 0;
  private t = 0;
  hitStop = 0;

  addTrauma(n: number): void {
    this.trauma = clamp(this.trauma + n, 0, 1);
  }

  slow(scale: number, seconds: number): void {
    this.slowScale = scale;
    this.slowT = seconds;
  }

  stop(seconds: number): void {
    this.hitStop = Math.max(this.hitStop, seconds);
  }

  flash(color: string, strength: number): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, strength);
  }

  punch(n: number): void {
    this.zoomPunch = Math.max(this.zoomPunch, n);
  }

  /** Call once per rendered frame with real (unscaled) seconds. */
  update(dt: number, maxShakePx: number): void {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma;
    this.shakeX = Math.sin(this.t * 61) * s * maxShakePx;
    this.shakeY = Math.cos(this.t * 47) * s * maxShakePx;
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      this.timeScale = 0.02;
    } else if (this.slowT > 0) {
      this.slowT -= dt;
      this.timeScale = this.slowScale;
    } else {
      this.timeScale = damp(this.timeScale, 1, 8, dt);
    }
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.6);
    this.vignette = damp(this.vignette, this.vignetteTarget, 4, dt);
    this.zoomPunch = Math.max(0, this.zoomPunch - dt * 1.8);
    this.zoom = 1 + this.zoomPunch * 0.06;
  }
}
