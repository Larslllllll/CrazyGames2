/**
 * Records the two CrazyGames preview videos (silent, 1080p landscape 16:9 and portrait 2:3, 15–20 s,
 * first frame = the static cover) from a scripted heist: sneak, stir, wake, chase, close-call escape.
 *   npm run preview &  node scripts/render-covers.mjs  &&  node scripts/record-previews.mjs
 * Needs ffmpeg (h264).
 */
import { createRequire } from "node:module";
import { mkdirSync, existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "marketing");
const TMP = resolve(ROOT, "marketing", ".video-tmp");
mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const variants = [
  { name: "landscape", w: 1920, h: 1080, cover: "cover-16x9.png" },
  { name: "portrait", w: 1080, h: 1620, cover: "cover-2x3.png" },
];
for (const v of variants) {
  const context = await browser.newContext({
    viewport: { width: v.w, height: v.h },
    deviceScaleFactor: 1,
    hasTouch: v.name === "portrait",
    recordVideo: { dir: TMP, size: { width: v.w, height: v.h } },
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173/", { waitUntil: "load" });
  await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null);
  await page.evaluate(() => window.__dwd.qa.reset());
  await page.evaluate(() => window.__dwd.qa.setLevels(2));
  await page.evaluate(() => window.__dwd.qa.grant(0));
  await page.waitForTimeout(300);
  // Hide nothing: the real UI is part of the preview. Let the title breathe for 2 s.
  await page.waitForTimeout(2200);
  const state = () => page.evaluate(() => window.__dwd.state());
  const setInput = (x, y) => page.evaluate(([a, b]) => window.__dwd.setInput(a, b), [x, y]);
  const t0 = Date.now();
  const elapsed = () => (Date.now() - t0) / 1000;
  let woke = false;
  // Scripted heist: greedy-but-sneaky loot run for ~9 s, then the dragon wakes and we escape.
  while (elapsed() < 17) {
    const s = await state();
    if (!s || (s.phase !== "play" && s.phase !== "ready")) break;
    const th = s.thief;
    let tx = s.exit.x;
    let ty = s.exit.y + 10;
    const leave = elapsed() > 9.5 || s.dragon.state !== "asleep";
    if (elapsed() > 9.5 && !woke && s.dragon.state === "asleep") {
      await page.evaluate(() => window.__dwd.qa.wake());
      woke = true;
    }
    if (!leave) {
      let best = null;
      let bd = 1e9;
      for (const it of s.items) {
        if (it.weight + th.bagWeight > th.capacity) continue;
        // Prefer loot towards the dragon so the chase has distance to cover.
        const d = Math.hypot(it.x - th.x, it.y - th.y) + (it.y > 600 ? 120 : 0) - it.value * 0.4;
        if (d < bd) {
          bd = d;
          best = it;
        }
      }
      if (best) {
        tx = best.x;
        ty = best.y;
      }
    }
    const dx = tx - th.x;
    const dy = ty - th.y;
    const d = Math.hypot(dx, dy) || 1;
    const mag = s.dragon.state !== "asleep" ? 1 : s.dragon.meter > 40 ? 0.45 : 0.72;
    await setInput((dx / d) * mag, (dy / d) * mag);
    await page.waitForTimeout(40);
  }
  await setInput(0, 0);
  await page.waitForTimeout(2500);
  const videoPath = await page.video().path();
  await context.close();
  // Compose: cover frame (0.6 s) + recording, cut to 19 s, silent h264 mp4.
  const cover = join(OUT, v.cover);
  const out = join(OUT, `preview-${v.name}.mp4`);
  const filter = `[0:v]scale=${v.w}:${v.h},setsar=1,fps=30[c];[1:v]scale=${v.w}:${v.h},setsar=1,fps=30[r];[c][r]concat=n=2:v=1:a=0[out]`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-t", "0.6", "-i", cover, "-i", videoPath, "-filter_complex", filter, "-map", "[out]", "-t", "19", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-movflags", "+faststart", out]);
  console.log(`${out} ${(statSync(out).size / 1024 / 1024).toFixed(1)} MB`);
}
await browser.close();
for (const f of readdirSync(TMP)) rmSync(join(TMP, f));
rmSync(TMP, { recursive: true, force: true });
