/**
 * Platform checks: audio context, platform mute (?muteAudio=true), SDK-disabled fallback (script blocked),
 * reload persistence, CPU-throttled frame rate during a chase, key handling.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const results = [];
const check = (name, ok, info = "") => {
  results.push({ name, ok, info });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${info}`);
};
const boot = async (page, url = "http://localhost:4173/") => {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null, null, { timeout: 15000 });
};
const state = (page) => page.evaluate(() => window.__dwd.state());

// 1. Audio + mute param
{
  const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await boot(page, "http://localhost:4173/?muteAudio=true");
  await page.mouse.click(600, 400);
  await page.keyboard.press("w");
  await page.waitForTimeout(800);
  const a = await page.evaluate(() => window.__dwd.audio());
  check("AudioContext created on gesture", !!a.ctx, JSON.stringify(a));
  check("platform mute (?muteAudio=true) respected", a.platformMuted === true && a.masterGain < 0.01, `master=${a.masterGain}`);
  check("no console errors (audio page)", errors.length === 0, errors.join(" | "));
  await page.close();
}
// 2. SDK script blocked → game still runs, env none
{
  const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/crazygames-sdk-v3.js", (r) => r.abort());
  await boot(page);
  const env = await page.evaluate(() => window.__dwd.env());
  await page.evaluate(() => window.__dwd.setInput(0, -1));
  await page.waitForTimeout(1500);
  const s = await state(page);
  check("runs without the SDK script", env === "none" && s.phase === "play", `env=${env} phase=${s.phase}`);
  check("no page errors without SDK", errors.length === 0, errors.join(" | "));
  await page.close();
}
// 3. Reload persistence (local SDK data module + localStorage mirror)
{
  const context = await browser.newContext({ viewport: { width: 1216, height: 684 } });
  const page = await context.newPage();
  await boot(page);
  await page.evaluate(() => window.__dwd.qa.reset());
  await page.evaluate(() => window.__dwd.qa.grant(777));
  await page.evaluate(() => window.__dwd.qa.buy("bag"));
  await page.waitForTimeout(600);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.__dwd && window.__dwd.state() !== null);
  const s = await state(page);
  check("profile persists across reload", s.profile.gold === 717 && s.profile.upgrades.bag === 1, `gold=${s.profile.gold} bag=${s.profile.upgrades.bag}`);
  await context.close();
}
// 4. CPU throttle during a chase (worst case: particles + fire)
{
  const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
  await boot(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.evaluate(() => window.__dwd.setInput(0.3, -1));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__dwd.qa.wake());
  await page.evaluate(() => window.__dwd.setInput(0.7, 0.7));
  const samples = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(500);
    const s = await state(page);
    samples.push(Math.round(s.fps));
    if (s.phase !== "play") break;
  }
  const minFps = Math.min(...samples);
  check("fps under 4x CPU throttle during chase ≥ 45", minFps >= 45, `samples=${samples.join(",")}`);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await page.close();
}
// 5. Keys: space/arrows don't scroll, P pauses, Escape not used
{
  const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
  await boot(page);
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowUp");
  const s1 = await state(page);
  await page.keyboard.press("p");
  await page.waitForTimeout(200);
  const s2 = await state(page);
  await page.keyboard.press("p");
  await page.waitForTimeout(200);
  const s3 = await state(page);
  check("arrow keys move the thief", s1.phase === "play" && s1.thief.y < 870, `y=${s1.thief.y.toFixed(0)}`);
  check("P pauses and resumes", s2.paused === true && s3.paused === false);
  const scrolled = await page.evaluate(() => window.scrollY);
  check("page did not scroll", scrolled === 0);
  await page.close();
}
// 6. Lullaby lowers the meter; pressure plates ring (vault)
{
  const page = await browser.newPage({ viewport: { width: 1216, height: 684 } });
  await boot(page);
  await page.evaluate(() => window.__dwd.qa.reset());
  await page.evaluate(() => window.__dwd.qa.setLevels(1));
  await page.evaluate(() => window.__dwd.setInput(0.15, -0.7));
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.__dwd.setInput(0, 0));
  await page.waitForTimeout(100);
  const before = (await state(page)).dragon.meter;
  await page.keyboard.press("e");
  await page.waitForTimeout(250);
  const after = (await state(page)).dragon;
  check("lullaby lowers the wake meter", before > 5 && after.meter < before - 20, `before=${before.toFixed(0)} after=${after.meter.toFixed(0)}`);
  const uses = (await state(page)).thief.lullaby;
  check("lullaby consumed", uses === 0, `uses=${uses}`);
  await page.evaluate(() => window.__dwd.qa.setLair("vault"));
  await page.waitForTimeout(300);
  const s = await state(page);
  check("vault has pressure plates + 6 artefacts", s.hazards.filter((h) => h.kind === "plate").length >= 5 && s.items.filter((i) => i.kind === "artefact").length === 6, `plates=${s.hazards.length} artefacts=${s.items.filter((i) => i.kind === "artefact").length}`);
  await page.evaluate(() => window.__dwd.qa.setLair("ice"));
  await page.waitForTimeout(300);
  const ice = (await state(page)).hazards.filter((h) => h.kind === "ice").length;
  await page.evaluate(() => window.__dwd.qa.setLair("volcano"));
  await page.waitForTimeout(300);
  const lava = (await state(page)).hazards.filter((h) => h.kind === "lava").length;
  check("ice and lava lairs generate hazards", ice >= 4 && lava >= 4, `ice=${ice} lava=${lava}`);
  await page.close();
}
await browser.close();
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} platform checks passed`);
process.exit(fails ? 1 : 0);
