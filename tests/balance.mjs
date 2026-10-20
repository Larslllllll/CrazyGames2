/**
 * Progression simulation: a human-ish bot plays N heists, buys the cheapest affordable upgrade after
 * each run and unlocks lairs when it can. Prints pacing (gold, best haul, lair, upgrades) per run.
 *   node tests/balance.mjs --runs 40
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const RUNS = Number(process.argv[process.argv.indexOf("--runs") + 1] || 30);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:4173/", { waitUntil: "load" });
await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null);
await page.evaluate(() => window.__dwd.qa.reset());
const state = () => page.evaluate(() => window.__dwd.state());
const setInput = (x, y) => page.evaluate(([a, b]) => window.__dwd.setInput(a, b), [x, y]);
const COSTS = { bag: [60, 2, 6], boots: [80, 2, 5], legs: [100, 2, 5], magnet: [90, 2, 5], charm: [150, 2, 5], lullaby: [200, 2, 5] };
const LAIR_COST = { ice: 1500, volcano: 6000, vault: 20000 };
const rows = [];
let totalTime = 0;
for (let run = 0; run < RUNS; run++) {
  let s = await state();
  const start = Date.now();
  // Human-ish: a greed level per run; sometimes reckless.
  const greed = 55 + Math.random() * 35; // leave when the meter passes this
  const hurry = Math.random() < 0.25;
  while (s && (s.phase === "ready" || s.phase === "play") && Date.now() - start < 120000) {
    const th = s.thief;
    const leave = s.dragon.meter > greed || th.bagWeight >= th.capacity - 1 || s.dragon.state !== "asleep" || s.time > 75;
    let tx = s.exit.x;
    let ty = s.exit.y;
    if (!leave) {
      let best = null;
      let bd = 1e9;
      for (const it of s.items) {
        if (it.weight + th.bagWeight > th.capacity) continue;
        const d = Math.hypot(it.x - th.x, it.y - th.y) - it.value * 0.5 + Math.random() * 40;
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
    let mag = hurry ? 1 : s.dragon.meter > 45 ? 0.4 : 0.75;
    if (s.dragon.state !== "asleep") mag = 1;
    if (s.dragon.snoring && !hurry) mag = Math.min(1, mag + 0.35); // move on the snore
    await setInput((dx / d) * mag, (dy / d) * mag);
    await page.waitForTimeout(80);
    s = await state();
  }
  await setInput(0, 0);
  await page.waitForTimeout(1500);
  s = await state();
  const r = s.result;
  totalTime += r?.time ?? 0;
  const p = s.profile;
  // Shopping: cheapest affordable upgrade; unlock the next lair when affordable.
  const buys = [];
  for (let k = 0; k < 3; k++) {
    let best = null;
    for (const [id, [base, growth, max]] of Object.entries(COSTS)) {
      const lvl = p.upgrades[id];
      if (lvl >= max) continue;
      const cost = Math.round(base * Math.pow(growth, lvl));
      if (cost <= p.gold && (!best || cost < best.cost)) best = { id, cost };
    }
    if (!best) break;
    await page.evaluate((id) => window.__dwd.qa.buy(id), best.id);
    await page.evaluate(() => document.querySelector("[data-close]")?.click());
    p.gold -= best.cost;
    p.upgrades[best.id]++;
    buys.push(best.id);
  }
  let unlocked = "";
  for (const [lair, cost] of Object.entries(LAIR_COST)) {
    if (!p.unlocked.includes(lair) && p.gold >= cost) {
      await page.evaluate((id) => window.__dwd.qa.grant(0) ?? window.__dwd.qa.setLair(id), lair);
      await page.evaluate((c) => window.__dwd.qa.grant(-c), cost);
      unlocked = lair;
      break;
    }
  }
  const after = await state();
  rows.push({ run: run + 1, lair: s.lair, res: r?.phase === "escaped" ? (r.closeCall ? "close" : "esc") : `X:${r?.cause}`, haul: r?.haul, t: r?.time?.toFixed(0), gold: after.profile.gold, best: after.profile.bestHaul, up: Object.values(after.profile.upgrades).join(""), bought: buys.join(","), unlock: unlocked, mins: (totalTime / 60).toFixed(1) });
  console.log(JSON.stringify(rows[rows.length - 1]));
  const next = await page.$("[data-next]");
  if (!next) break;
  await next.click();
  await page.waitForFunction(() => window.__dwd.state().phase === "ready", null, { timeout: 40000 });
  await page.waitForTimeout(150);
}
console.table(rows.map(({ run, lair, res, haul, t, gold, best, up, unlock, mins }) => ({ run, lair, res, haul, t, gold, best, up, unlock, mins })));
console.log("errors:", errors);
await browser.close();
