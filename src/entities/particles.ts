export type ParticleKind = "dust" | "spark" | "coin" | "fire" | "smoke" | "z" | "ring" | "confetti" | "ember" | "snow";

interface P {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
  grav: number;
  drag: number;
}

export interface EmitOpts {
  vx?: number;
  vy?: number;
  spread?: number;
  speed?: number;
  life?: number;
  size?: number;
  color?: string;
  count?: number;
  grav?: number;
  drag?: number;
}

const MAX = 700;

/** Pooled canvas particles. Everything is drawn in world space. */
export class Particles {
  private pool: P[] = [];
  private live: P[] = [];

  get count(): number {
    return this.live.length;
  }

  clear(): void {
    this.pool.push(...this.live);
    this.live.length = 0;
  }

  emit(kind: ParticleKind, x: number, y: number, o: EmitOpts = {}): void {
    const n = o.count ?? 1;
    for (let i = 0; i < n; i++) {
      if (this.live.length >= MAX) return;
      const p = this.pool.pop() ?? ({} as P);
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed ?? 60) * (0.4 + Math.random() * 0.8);
      const spread = o.spread ?? 1;
      p.kind = kind;
      p.x = x + (Math.random() - 0.5) * spread * 2;
      p.y = y + (Math.random() - 0.5) * spread * 2;
      p.vx = (o.vx ?? 0) + Math.cos(a) * sp;
      p.vy = (o.vy ?? 0) + Math.sin(a) * sp;
      p.max = (o.life ?? 0.6) * (0.7 + Math.random() * 0.6);
      p.life = p.max;
      p.size = (o.size ?? 4) * (0.7 + Math.random() * 0.6);
      p.color = o.color ?? "#ffffff";
      p.rot = Math.random() * 6.28;
      p.vrot = (Math.random() - 0.5) * 8;
      p.grav = o.grav ?? 0;
      p.drag = o.drag ?? 2;
      this.live.push(p);
    }
  }

  update(dt: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.live.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vy += p.grav * dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
    }
  }

  draw(c: CanvasRenderingContext2D): void {
    for (const p of this.live) {
      const t = p.life / p.max;
      switch (p.kind) {
        case "dust":
        case "smoke": {
          c.globalAlpha = t * (p.kind === "dust" ? 0.5 : 0.35);
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, p.size * (1.4 - t * 0.6), 0, 6.283);
          c.fill();
          break;
        }
        case "fire":
        case "ember": {
          c.globalAlpha = Math.min(1, t * 1.4);
          c.fillStyle = t > 0.6 ? "#fff1a8" : t > 0.3 ? p.color : "#c0392b";
          c.beginPath();
          c.arc(p.x, p.y, p.size * (p.kind === "fire" ? 0.6 + t : t), 0, 6.283);
          c.fill();
          break;
        }
        case "spark": {
          c.globalAlpha = t;
          c.strokeStyle = p.color;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
          c.stroke();
          break;
        }
        case "coin": {
          c.globalAlpha = Math.min(1, t * 2);
          c.fillStyle = p.color;
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          const s = p.size;
          c.beginPath();
          c.moveTo(0, -s);
          c.lineTo(s * 0.3, -s * 0.3);
          c.lineTo(s, 0);
          c.lineTo(s * 0.3, s * 0.3);
          c.lineTo(0, s);
          c.lineTo(-s * 0.3, s * 0.3);
          c.lineTo(-s, 0);
          c.lineTo(-s * 0.3, -s * 0.3);
          c.closePath();
          c.fill();
          c.restore();
          break;
        }
        case "snow": {
          c.globalAlpha = Math.min(1, t * 2) * 0.8;
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, p.size * 0.5, 0, 6.283);
          c.fill();
          break;
        }
        case "z": {
          c.globalAlpha = Math.min(1, t * 1.6);
          c.fillStyle = p.color;
          c.font = `${Math.round(p.size * (1.6 - t * 0.5))}px "Titan One", sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.save();
          c.translate(p.x, p.y);
          c.rotate(Math.sin(p.rot) * 0.25);
          c.fillText("Z", 0, 0);
          c.restore();
          break;
        }
        case "ring": {
          c.globalAlpha = t * 0.8;
          c.strokeStyle = p.color;
          c.lineWidth = 3 + 3 * t;
          c.beginPath();
          c.arc(p.x, p.y, p.size * (1.3 - t), 0, 6.283);
          c.stroke();
          break;
        }
        case "confetti": {
          c.globalAlpha = Math.min(1, t * 3);
          c.fillStyle = p.color;
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          c.restore();
          break;
        }
      }
    }
    c.globalAlpha = 1;
  }
}
