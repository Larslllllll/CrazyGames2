export type Ctx = CanvasRenderingContext2D;
export type Paint = string | CanvasGradient | CanvasPattern;

export const circle = (c: Ctx, x: number, y: number, r: number, fill: Paint, stroke?: string, lw = 2): void => {
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
};

export const ellipse = (c: Ctx, x: number, y: number, rx: number, ry: number, fill: Paint, rot = 0, stroke?: string, lw = 2): void => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, 6.2832);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
};

export const roundRect = (c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: Paint, stroke?: string, lw = 2): void => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
};

export const poly = (c: Ctx, pts: number[], fill: Paint, stroke?: string, lw = 2): void => {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.lineJoin = "round";
    c.stroke();
  }
};

export const shadow = (c: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.28): void => {
  c.fillStyle = `rgba(0,0,0,${alpha})`;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  c.fill();
};

export const star = (c: Ctx, x: number, y: number, r: number, fill: string, points = 4): void => {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * 6.2832 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.35;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
};

export const text = (
  c: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  opts: { stroke?: string; lw?: number; align?: CanvasTextAlign; font?: string; alpha?: number } = {},
): void => {
  c.font = `${size}px ${opts.font ?? '"Titan One", sans-serif'}`;
  c.textAlign = opts.align ?? "center";
  c.textBaseline = "middle";
  if (opts.alpha !== undefined) c.globalAlpha = opts.alpha;
  if (opts.stroke) {
    c.lineWidth = opts.lw ?? Math.max(3, size * 0.16);
    c.strokeStyle = opts.stroke;
    c.lineJoin = "round";
    c.strokeText(s, x, y);
  }
  c.fillStyle = fill;
  c.fillText(s, x, y);
  if (opts.alpha !== undefined) c.globalAlpha = 1;
};

/** Pseudo random from an integer seed (for stable obstacle shapes). */
export const seeded = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
