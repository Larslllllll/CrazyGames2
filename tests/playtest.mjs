/**
 * Headless playtest: boots the game in Chromium, records console errors, screenshots several
 * CrazyGames iframe sizes, then plays N heists with a greedy bot and prints the results.
 *
 *   npm run preview &   (serves dist/ on :4173)
 *   node tests/playtest.mjs --runs 5 --shots [--mobile] [--url http://localhost:4173/]
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium, devices } = require("/opt/node22/lib/node_modules/playwright");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] ?? true : def;
};
const RUNS = Number(opt("runs", 3));
const SHOTS = args.includes("--shots");
const MOBILE = args.includes("--mobile");
const URL = opt("url", "http://localhost:4173/");
const BOT = opt("bot", "greedy"); // greedy | reckless | sneaky
const OUT = resolve(ROOT, "docs/test-evidence");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext(MOBILE ? { ...devices["Pixel 7"] } : { viewport: { width: 1216, height: 684 } });
const page = await context.newPage();
const errors = [];
const warnings = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
  else if (m.type() === "warning") warnings.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => {
  if (!r.url().includes("crazygames.com")) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`);
});

const t0 = Date.now();
await page.goto(URL, { waitUntil: "load" });
await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null, null, { timeout: 15000 });
console.log(`boot → first state in ${Date.now() - t0} ms, sdk env = ${await page.evaluate(() => window.__dwd.env())}`);
await page.waitForTimeout(400);

const state = () => page.evaluate(() => window.__dwd.state());
const setInput = (x, y) => page.evaluate(([a, b]) => window.__dwd.setInput(a, b), [x, y]);

if (SHOTS) {
  const sizes = MOBILE ? [[412, 915], [915, 412]] : [[907, 510], [1216, 684], [1077, 606], [821, 462], [1920, 1080], [1366, 768], [800, 450], [1080, 607], [450, 800]];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/ready-${w}x${h}.png` });
  }
  await page.setViewportSize(MOBILE ? { width: 412, height: 915 } : { width: 1216, height: 684 });
  await page.waitForTimeout(200);
}

const results = [];
for (let run = 0; run < RUNS; run++) {
  // Greedy bot: nearest loot until the meter is high or the bag is full, then the exit.
  let s = await state();
  const start = Date.now();
  let shotTaken = false;
  let awakeShot = false;
  let lastLog = -1;
  while (s && (s.phase === "ready" || s.phase === "play") && Date.now() - start < 120000) {
    const th = s.thief;
    const leaveMeter = BOT === "reckless" ? 97 : BOT === "sneaky" ? 55 : 72;
    const leave =
      BOT === "kamikaze"
        ? s.dragon.state !== "asleep" || s.time > 90
        : s.dragon.meter > leaveMeter || s.thief.bagWeight >= s.thief.capacity - 1 || s.dragon.state !== "asleep" || s.time > 70;
    if (BOT === "kamikaze" && s.phase === "play" && Math.floor(s.time * 2) !== lastLog) {
      lastLog = Math.floor(s.time * 2);
      if (lastLog % 4 === 0) console.log(`  t=${s.time.toFixed(1)} meter=${s.dragon.meter.toFixed(0)} floor=${s.dragon.floor.toFixed(0)} bag=${s.thief.bagWeight}/${s.thief.capacity} state=${s.dragon.state}`);
    }
    let tx = s.exit.x;
    let ty = s.exit.y;
    if (!leave) {
      let best = null;
      let bd = 1e9;
      for (const it of s.items) {
        if (it.weight + th.bagWeight > th.capacity) continue;
        const d = Math.hypot(it.x - th.x, it.y - th.y) - it.value * (BOT === "reckless" ? 1.2 : 0.3);
        if (d < bd) {
          bd = d;
          best = it;
        }
      }
      if (best) {
        tx = best.x;
        ty = best.y;
      } else if (BOT === "kamikaze" && s.items.length) {
        const it = s.items[Math.floor(Math.random() * s.items.length)];
        tx = it.x;
        ty = it.y;
      }
    }
    const dx = tx - th.x;
    const dy = ty - th.y;
    const d = Math.hypot(dx, dy) || 1;
    // Sneak (slow drags) while the dragon stirs, run when awake or leaving.
    const mag =
      s.dragon.state !== "asleep" || BOT === "reckless" || BOT === "kamikaze" ? 1 : BOT === "sneaky" ? (s.dragon.meter > 25 ? 0.36 : 0.6) : s.dragon.meter > 45 && !leave ? 0.38 : 0.85;
    await setInput((dx / d) * mag, (dy / d) * mag);
    await page.waitForTimeout(60);
    s = await state();
    if (SHOTS && !shotTaken && s && s.phase === "play" && s.time > 6) {
      await page.screenshot({ path: `${OUT}/play-${BOT}-run${run + 1}${MOBILE ? "-mobile" : ""}.png` });
      shotTaken = true;
    }
    if (SHOTS && !awakeShot && s && s.dragon.state === "awake" && s.time > 0) {
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/awake-${BOT}-run${run + 1}${MOBILE ? "-mobile" : ""}.png` });
      awakeShot = true;
    }
  }
  await setInput(0, 0);
  await page.waitForTimeout(1500);
  s = await state();
  const r = s?.result;
  results.push({ run: run + 1, bot: BOT, phase: s?.phase, haul: r?.haul, time: r?.time?.toFixed(1), woke: r?.woke, cause: r?.cause, taken: r ? (r.takenFraction * 100).toFixed(0) + "%" : "", fps: s?.fps?.toFixed(0), gold: s?.profile.gold });
  console.log(JSON.stringify(results[results.length - 1]));
  if (SHOTS && run === 0) await page.screenshot({ path: `${OUT}/result-${BOT}-run1${MOBILE ? "-mobile" : ""}.png` });
  // Continue: result screen → Next heist (handles rewarded offers by skipping them).
  const btn = await page.waitForSelector("[data-next]", { timeout: 8000 }).catch(() => null);
  if (!btn) break;
  await btn.click();
  // A midgame ad may play in local mode (overlay for a few seconds).
  await page.waitForFunction(() => {
    const s = window.__dwd.state();
    return s && s.phase === "ready";
  }, null, { timeout: 30000 });
  await page.waitForTimeout(200);
}

console.log("\nSUMMARY");
console.table(results);
console.log(`console errors: ${errors.length}`);
for (const e of errors) console.log("  ERROR:", e);
console.log(`console warnings: ${warnings.length}`);
for (const w of warnings.slice(0, 10)) console.log("  WARN:", w);
const log = await page.evaluate(() => window.__dwd.sdkLog());
console.log("sdk log (last 25):");
for (const l of log.slice(-25)) console.log("  ", l);
await browser.close();
process.exit(errors.length ? 1 : 0);
