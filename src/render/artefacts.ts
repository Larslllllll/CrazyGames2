import { RARITY_COLORS, type ArtefactDef, type ArtefactShape } from "../progression/collection";
import { circle, ellipse, poly, roundRect, star, type Ctx } from "./draw";

/** Draws an artefact icon centred at (0,0) in a box of ±s. */
export const drawArtefact = (c: Ctx, shape: ArtefactShape, color: string, s: number): void => {
  const dark = "rgba(0,0,0,0.45)";
  c.lineJoin = "round";
  switch (shape) {
    case "goblet":
      poly(c, [-s * 0.55, -s * 0.8, s * 0.55, -s * 0.8, s * 0.3, -s * 0.1, -s * 0.3, -s * 0.1], color, dark, s * 0.12);
      roundRect(c, -s * 0.09, -s * 0.15, s * 0.18, s * 0.6, s * 0.05, color, dark, s * 0.1);
      roundRect(c, -s * 0.42, s * 0.45, s * 0.84, s * 0.26, s * 0.1, color, dark, s * 0.1);
      break;
    case "crown":
      poly(
        c,
        [-s * 0.75, s * 0.5, -s * 0.75, -s * 0.35, -s * 0.35, 0, 0, -s * 0.75, s * 0.35, 0, s * 0.75, -s * 0.35, s * 0.75, s * 0.5],
        color,
        dark,
        s * 0.12,
      );
      circle(c, 0, s * 0.15, s * 0.12, "#ff5f7a");
      circle(c, -s * 0.45, s * 0.2, s * 0.09, "#5fb0ff");
      circle(c, s * 0.45, s * 0.2, s * 0.09, "#5fe0a0");
      break;
    case "sword":
      c.save();
      c.rotate(-0.7);
      roundRect(c, -s * 0.12, -s * 0.95, s * 0.24, s * 1.1, s * 0.06, color, dark, s * 0.1);
      roundRect(c, -s * 0.45, s * 0.12, s * 0.9, s * 0.16, s * 0.06, "#c99a3a", dark, s * 0.1);
      roundRect(c, -s * 0.1, s * 0.26, s * 0.2, s * 0.5, s * 0.06, "#6b4b2a", dark, s * 0.1);
      circle(c, 0, s * 0.82, s * 0.12, "#f3c640", dark, s * 0.08);
      c.restore();
      break;
    case "egg":
      c.beginPath();
      c.ellipse(0, 0.05 * s, s * 0.6, s * 0.78, 0, 0, 6.283);
      c.fillStyle = color;
      c.fill();
      c.lineWidth = s * 0.12;
      c.strokeStyle = dark;
      c.stroke();
      circle(c, -s * 0.2, -s * 0.2, s * 0.14, "rgba(255,255,255,0.55)");
      circle(c, s * 0.15, s * 0.25, s * 0.09, "rgba(255,255,255,0.35)");
      break;
    case "orb": {
      const g = c.createRadialGradient(-s * 0.25, -s * 0.25, s * 0.05, 0, 0, s * 0.8);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, color);
      g.addColorStop(1, "rgba(0,0,0,0.6)");
      circle(c, 0, 0, s * 0.72, g, dark, s * 0.1);
      roundRect(c, -s * 0.5, s * 0.55, s, s * 0.25, s * 0.08, "#8a6a2a", dark, s * 0.08);
      break;
    }
    case "ring":
      c.beginPath();
      c.arc(0, s * 0.1, s * 0.55, 0, 6.283);
      c.lineWidth = s * 0.26;
      c.strokeStyle = dark;
      c.stroke();
      c.lineWidth = s * 0.16;
      c.strokeStyle = color;
      c.stroke();
      star(c, 0, -s * 0.5, s * 0.32, "#ff5f7a", 4);
      break;
    case "book":
      roundRect(c, -s * 0.65, -s * 0.75, s * 1.3, s * 1.5, s * 0.12, color, dark, s * 0.12);
      roundRect(c, -s * 0.45, -s * 0.55, s * 0.9, s * 1.1, s * 0.06, "rgba(255,255,255,0.18)");
      star(c, 0, 0, s * 0.3, "#f3c640", 5);
      break;
    case "skull":
      circle(c, 0, -s * 0.15, s * 0.62, color, dark, s * 0.12);
      roundRect(c, -s * 0.38, s * 0.25, s * 0.76, s * 0.45, s * 0.12, color, dark, s * 0.1);
      circle(c, -s * 0.24, -s * 0.15, s * 0.16, "#1b1b1b");
      circle(c, s * 0.24, -s * 0.15, s * 0.16, "#1b1b1b");
      poly(c, [-s * 0.08, s * 0.2, s * 0.08, s * 0.2, 0, s * 0.05], "#1b1b1b");
      break;
    case "mask":
      ellipse(c, 0, 0, s * 0.65, s * 0.8, color, 0, dark, s * 0.12);
      ellipse(c, -s * 0.26, -s * 0.15, s * 0.17, s * 0.12, "#1b1b1b");
      ellipse(c, s * 0.26, -s * 0.15, s * 0.17, s * 0.12, "#1b1b1b");
      c.beginPath();
      c.arc(0, s * 0.25, s * 0.25, 0.2, Math.PI - 0.2);
      c.lineWidth = s * 0.1;
      c.strokeStyle = "#1b1b1b";
      c.stroke();
      break;
    case "helmet":
      c.beginPath();
      c.arc(0, 0, s * 0.68, Math.PI, 0);
      c.lineTo(s * 0.68, s * 0.5);
      c.lineTo(-s * 0.68, s * 0.5);
      c.closePath();
      c.fillStyle = color;
      c.fill();
      c.lineWidth = s * 0.12;
      c.strokeStyle = dark;
      c.stroke();
      roundRect(c, -s * 0.5, s * 0.05, s, s * 0.2, s * 0.05, "#1b1b1b");
      poly(c, [-s * 0.1, -s * 0.68, s * 0.1, -s * 0.68, 0, -s * 1.05], "#ff5f7a", dark, s * 0.08);
      break;
    case "gem":
      poly(c, [-s * 0.7, -s * 0.2, -s * 0.35, -s * 0.65, s * 0.35, -s * 0.65, s * 0.7, -s * 0.2, 0, s * 0.75], color, dark, s * 0.12);
      poly(c, [-s * 0.35, -s * 0.65, 0, -s * 0.2, s * 0.35, -s * 0.65], "rgba(255,255,255,0.45)");
      break;
    case "harp":
      c.beginPath();
      c.moveTo(-s * 0.55, s * 0.7);
      c.quadraticCurveTo(-s * 0.9, -s * 0.7, s * 0.2, -s * 0.75);
      c.lineTo(s * 0.55, -s * 0.45);
      c.lineTo(s * 0.55, s * 0.7);
      c.closePath();
      c.fillStyle = color;
      c.fill();
      c.lineWidth = s * 0.12;
      c.strokeStyle = dark;
      c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.7)";
      c.lineWidth = s * 0.05;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(-s * 0.3 + i * s * 0.2, s * 0.6);
        c.lineTo(-s * 0.1 + i * s * 0.18, -s * 0.45);
        c.stroke();
      }
      break;
  }
};

/** Renders an artefact to a small canvas (UI icons). */
export const artefactIcon = (def: ArtefactDef, px: number, silhouette = false): HTMLCanvasElement => {
  const cv = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = px * dpr;
  cv.height = px * dpr;
  cv.style.width = `${px}px`;
  cv.style.height = `${px}px`;
  const c = cv.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.translate(px / 2, px / 2);
  if (silhouette) {
    drawArtefact(c, def.shape, "#2a2f36", px * 0.3);
    c.globalCompositeOperation = "source-atop";
    c.fillStyle = "#2a2f36";
    c.fillRect(-px, -px, px * 2, px * 2);
    return cv;
  }
  const g = c.createRadialGradient(0, 0, 0, 0, 0, px * 0.5);
  g.addColorStop(0, RARITY_COLORS[def.rarity] + "66");
  g.addColorStop(1, RARITY_COLORS[def.rarity] + "00");
  c.fillStyle = g;
  c.fillRect(-px / 2, -px / 2, px, px);
  drawArtefact(c, def.shape, def.color, px * 0.3);
  return cv;
};
