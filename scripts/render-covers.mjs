/** Renders the three CrazyGames covers (16:9, 2:3, 1:1) from the game's own art into marketing/. */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "marketing");
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
await page.goto("http://localhost:4173/", { waitUntil: "load" });
await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null);
await page.evaluate(() => Promise.all([document.fonts.load('100px "Titan One"'), document.fonts.load('bold 20px "Fredoka"')]));
for (const v of ["16x9", "2x3", "1x1"]) {
  const url = await page.evaluate((variant) => window.__dwd.cover(variant), v);
  const buf = Buffer.from(url.split(",")[1], "base64");
  writeFileSync(resolve(OUT, `cover-${v}.png`), buf);
  console.log(`cover-${v}.png ${(buf.length / 1024).toFixed(0)} KB`);
}
await browser.close();
