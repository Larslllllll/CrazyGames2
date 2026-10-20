import { clamp01, len } from "./math";

export interface MoveInput {
  /** Desired direction & magnitude, length 0..1 (analog speed). */
  x: number;
  y: number;
  /** Keyboard sneak modifier. */
  sneak: boolean;
}

/**
 * Unified input: keyboard (WASD / arrows / ZQSD / Shift sneak), pointer-drag virtual joystick (mouse + touch).
 * Dragging anywhere on the canvas creates a joystick at the touch point; drag distance = speed.
 */
export class Input {
  private keys = new Set<string>();
  private pointerId: number | null = null;
  private originX = 0;
  private originY = 0;
  private curX = 0;
  private curY = 0;
  private joyRadius = 70;
  private pressed = new Set<string>();
  /** Any input seen since the last poll (used to start a run). */
  anyInput = false;
  /** True while a pointer drag is active (for drawing the joystick). */
  get dragging(): boolean {
    return this.pointerId !== null;
  }
  get joystick(): { ox: number; oy: number; x: number; y: number; r: number } {
    return { ox: this.originX, oy: this.originY, x: this.curX, y: this.curY, r: this.joyRadius };
  }
  touchDevice = false;

  constructor(target: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
      this.anyInput = true;
      // CrazyGames common fixes: no page scroll on space / arrows.
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.delete(k);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.pointerId = null;
    });
    target.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") this.touchDevice = true;
      if (this.pointerId !== null) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      this.pointerId = e.pointerId;
      this.originX = this.curX = e.clientX;
      this.originY = this.curY = e.clientY;
      this.joyRadius = Math.max(50, Math.min(90, Math.min(window.innerWidth, window.innerHeight) * 0.12));
      this.anyInput = true;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      e.preventDefault();
    });
    target.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.pointerId) return;
      this.curX = e.clientX;
      this.curY = e.clientY;
      // Let the joystick origin follow when the finger goes beyond the radius (comfortable long drags).
      const dx = this.curX - this.originX;
      const dy = this.curY - this.originY;
      const d = len(dx, dy);
      if (d > this.joyRadius) {
        const k = (d - this.joyRadius) / d;
        this.originX += dx * k;
        this.originY += dy * k;
      }
      e.preventDefault();
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
    };
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
    target.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }

  /** Consume a one-shot key press (e.g. "p", "Escape", " ", "e"). */
  consume(key: string): boolean {
    if (this.pressed.has(key)) {
      this.pressed.delete(key);
      return true;
    }
    return false;
  }

  clearPressed(): void {
    this.pressed.clear();
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  read(): MoveInput {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has("a") || k.has("q") || k.has("ArrowLeft")) x -= 1;
    if (k.has("d") || k.has("ArrowRight")) x += 1;
    if (k.has("w") || k.has("z") || k.has("ArrowUp")) y -= 1;
    if (k.has("s") || k.has("ArrowDown")) y += 1;
    const sneak = k.has("Shift");
    if (x !== 0 || y !== 0) {
      const l = len(x, y);
      x /= l;
      y /= l;
      const m = sneak ? 0.42 : 1;
      return { x: x * m, y: y * m, sneak };
    }
    if (this.pointerId !== null) {
      const dx = this.curX - this.originX;
      const dy = this.curY - this.originY;
      const d = len(dx, dy);
      if (d < 4) return { x: 0, y: 0, sneak: false };
      const m = clamp01(d / this.joyRadius);
      // Soft analog curve: small drags = sneaking.
      const mag = Math.pow(m, 1.35);
      return { x: (dx / d) * mag, y: (dy / d) * mag, sneak: false };
    }
    return { x: 0, y: 0, sneak: false };
  }
}
