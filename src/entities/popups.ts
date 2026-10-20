interface Popup {
  text: string;
  x: number;
  y: number;
  t: number;
  max: number;
  color: string;
  size: number;
  vy: number;
}

/** Floating text in world space ("+12", "BAG FULL", "Close call!"). */
export class Popups {
  private list: Popup[] = [];

  clear(): void {
    this.list.length = 0;
  }

  add(text: string, x: number, y: number, color = "#ffe066", size = 26, life = 0.9): void {
    if (this.list.length > 40) this.list.shift();
    this.list.push({ text, x, y, t: 0, max: life, color, size, vy: -60 });
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.t += dt;
      p.y += p.vy * dt;
      p.vy *= Math.exp(-3 * dt);
      if (p.t >= p.max) this.list.splice(i, 1);
    }
  }

  draw(c: CanvasRenderingContext2D): void {
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const p of this.list) {
      const k = p.t / p.max;
      const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - (k - 0.15) * 0.1;
      c.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      c.font = `${Math.round(p.size * pop)}px "Titan One", sans-serif`;
      c.lineWidth = 5;
      c.strokeStyle = "rgba(0,0,0,0.55)";
      c.lineJoin = "round";
      c.strokeText(p.text, p.x, p.y);
      c.fillStyle = p.color;
      c.fillText(p.text, p.x, p.y);
    }
    c.globalAlpha = 1;
  }
}
