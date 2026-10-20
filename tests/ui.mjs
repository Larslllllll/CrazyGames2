/**
 * UI + feature walkthrough: screens, shop purchases, lair unlocks, daily heist, pause, resize,
 * rewarded + midgame ads in the SDK's local mode. Screenshots go to docs/test-evidence/ui/.
 *   node tests/ui.mjs [--mobile]
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium, devices } = require("/opt/node22/lib/node_modules/playwright");
const MOBILE = process.argv.includes("--mobile");
const OUT = resolve(ROOT, "docs/test-evidence/ui");
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext(MOBILE ? { ...devices["Pixel 7"] } : { viewport: { width: 1216, height: 684 } });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
const suffix = MOBILE ? "-mobile" : "";
const shot = (name) => page.screenshot({ path: `${OUT}/${name}${suffix}.png` });
const state = () => page.evaluate(() => window.__dwd.state());
const qa = (fn, ...args) => page.evaluate(([f, a]) => window.__dwd.qa[f](...a), [fn, args]);
const setInput = (x, y) => page.evaluate(([a, b]) => window.__dwd.setInput(a, b), [x, y]);
const step = (msg) => console.log(`• ${msg}`);
/** Steer the thief to a world position (or the exit) using the state hook. */
const goTo = async (tx, ty, speed = 1, timeout = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await state();
    if (!s || s.phase !== "play" && s.phase !== "ready") break;
    const dx = tx - s.thief.x;
    const dy = ty - s.thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 14) break;
    await setInput((dx / d) * speed, (dy / d) * speed);
    await page.waitForTimeout(50);
  }
  await setInput(0, 0);
};
const exitRun = async () => {
  const s = await state();
  await goTo(s.exit.x, s.exit.y - 120);
  await goTo(s.exit.x, s.exit.y + 10);
  await page.waitForFunction(() => { const s = window.__dwd.state(); return s.phase === "escaped" || s.phase === "caught"; }, null, { timeout: 30000 });
};
const waitAdDone = () => page.waitForFunction(() => !document.querySelector('.screen[data-screen="ad"].show'), null, { timeout: 40000 });

await page.goto("http://localhost:4173/", { waitUntil: "load" });
await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null, null, { timeout: 15000 });
await page.evaluate(() => window.__dwd.qa.reset());
await page.waitForTimeout(300);

step("shop tabs");
await page.click(".menubar [data-shop]");
await page.waitForTimeout(300);
await shot("shop-upgrades");
await page.click('[data-tab="lairs"]');
await page.waitForTimeout(200);
await shot("shop-lairs");
await page.click('[data-tab="skins"]');
await page.waitForTimeout(200);
await shot("shop-skins");
await page.click(".screen.show [data-close]");

step("buy upgrades with QA gold");
await qa("grant", 5000);
await page.click(".menubar [data-shop]");
await page.waitForTimeout(200);
await page.click('[data-tab="upgrades"]');
await page.waitForTimeout(150);
for (let i = 0; i < 3; i++) {
  const btn = await page.$('[data-buy="bag"]');
  if (!btn) break;
  await btn.click();
  await page.waitForTimeout(150);
}
let s = await state();
console.log("  bag level after 3 buys:", s.profile.upgrades.bag, "gold:", s.profile.gold);
await page.click('[data-buy="lullaby"]');
await page.waitForTimeout(150);
await shot("shop-after-buy");
await page.click(".screen.show [data-close]");

step("museum / settings / pause");
await page.click(".menubar [data-museum]");
await page.waitForTimeout(250);
await shot("museum");
await page.click(".screen.show [data-close]");
await page.click(".menubar [data-settings]");
await page.waitForTimeout(250);
await shot("settings");
await page.click("[data-sound]");
await page.click(".screen.show [data-close]");
await setInput(0, -1);
await page.waitForTimeout(600);
await setInput(0, 0);
await page.keyboard.press("p");
await page.waitForTimeout(250);
await shot("pause");
s = await state();
console.log("  paused:", s.paused, "screen:", s.screen);
await page.click("[data-resume]");
await page.waitForTimeout(100);
s = await state();
console.log("  resumed:", !s.paused, "phase:", s.phase);

step("lullaby key");
await qa("wake", 0); // meter to 100 → wake; lullaby cannot save now, but test the key path first
await page.keyboard.press("e");
await page.waitForTimeout(1500);
s = await state();
console.log("  dragon state after forced wake:", s.dragon.state);
await shot("awake-forced");
await page.keyboard.press("p");
await page.click("[data-restart]");
await page.waitForTimeout(300);

step("resize mid-run");
await setInput(0.3, -1);
await page.waitForTimeout(800);
await page.setViewportSize({ width: 800, height: 450 });
await page.waitForTimeout(300);
await shot("resize-800x450");
await page.setViewportSize(MOBILE ? { width: 412, height: 915 } : { width: 1216, height: 684 });
await setInput(0, 0);
await page.waitForTimeout(200);

step("every lair");
for (const lair of ["ice", "volcano", "vault"]) {
  await qa("setLair", lair);
  await page.waitForTimeout(400);
  await shot(`ready-${lair}`);
  await setInput(-0.6, -1);
  await page.waitForTimeout(2500);
  await setInput(0.8, -0.3);
  await page.waitForTimeout(1500);
  await shot(`play-${lair}`);
  await qa("wake", 0);
  await page.waitForTimeout(1800);
  await shot(`awake-${lair}`);
  await setInput(0, 0);
  await page.waitForFunction(() => { const s = window.__dwd.state(); return s.phase === "caught" || s.phase === "escaped"; }, null, { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1500);
  const r = (await state()).result;
  console.log(`  ${lair}: ${r?.phase} cause=${r?.cause}`);
  const next = await page.$("[data-next]");
  if (next) await next.click();
  await page.waitForFunction(() => window.__dwd.state().phase === "ready", null, { timeout: 30000 });
}

step("rewarded keep-loot flow (local SDK)");
await qa("setLair", "cave");
await page.waitForTimeout(300);
await setInput(0, -1);
await page.waitForTimeout(2500);
await setInput(-1, 0);
await page.waitForTimeout(2500);
await setInput(0, 0);
console.log("  bag value before wake:", (await state()).thief.bagValue);
await qa("wake", 0);
await page.waitForFunction(() => window.__dwd.state().phase === "caught", null, { timeout: 30000 });
await page.waitForTimeout(1600);
await shot("result-caught-keep");
const goldBefore = (await state()).profile.gold;
const keep = await page.$('[data-reward="keep"]');
console.log("  keep offer visible:", !!keep);
if (keep) {
  await keep.click();
  await page.waitForTimeout(1000);
  await shot("ad-overlay");
  await waitAdDone();
  await page.waitForTimeout(400);
  const goldAfter = (await state()).profile.gold;
  console.log("  gold before/after keep:", goldBefore, goldAfter);
  await shot("result-after-keep");
}
await page.click("[data-next]");
await page.waitForFunction(() => window.__dwd.state().phase === "ready", null, { timeout: 30000 });

step("double haul flow + midgame ad");
await qa("setDoubleCounter", 5);
await qa("setSessionPlay", 400);
await setInput(0, -1);
await page.waitForTimeout(2500);
await setInput(1, 0);
await page.waitForTimeout(2000);
await exitRun();
console.log("  run ended:", (await state()).phase, "haul:", (await state()).result?.haul);
await page.waitForTimeout(1300);
await shot("result-double");
const dbl = await page.$('[data-reward="double"]');
console.log("  double offer visible:", !!dbl);
if (dbl) {
  const g0 = (await state()).profile.gold;
  await dbl.click();
  await waitAdDone();
  await page.waitForTimeout(400);
  console.log("  gold before/after double:", g0, (await state()).profile.gold);
}
await page.click("[data-next]");
await page.waitForTimeout(800);
await shot("midgame-ad");
await page.waitForFunction(() => window.__dwd.state().phase === "ready", null, { timeout: 40000 });
s = await state();
console.log("  back in lair:", s.phase);

step("daily heist");
await page.click(".menubar [data-daily]");
await page.waitForTimeout(400);
s = await state();
console.log("  daily:", s.daily, "lair:", s.lair);
await shot("daily-ready");

process.on("unhandledRejection", async (err) => {
  console.log("TEST FAILURE:", err?.message ?? err);
  try {
    const st = await state();
    console.log("state:", JSON.stringify({ phase: st?.phase, screen: st?.screen, paused: st?.paused, dragon: st?.dragon?.state }));
    const lg = await page.evaluate(() => window.__dwd.sdkLog());
    console.log("sdk log tail:", lg.slice(-10).join(" | "));
    await shot("failure");
  } catch {}
  process.exit(2);
});
const log = await page.evaluate(() => window.__dwd.sdkLog());
console.log("sdk log tail:", log.slice(-12).join(" | "));
console.log(`console errors: ${errors.length}`);
for (const e of errors) console.log("  ERROR:", e);
await browser.close();
process.exit(errors.length ? 1 : 0);
