# Don't Wake the Dragon

**Sneak over a sleeping dragon's hoard. Grab as much gold as you dare. Tiptoe out before it wakes.**

A push-your-luck treasure heist built for [CrazyGames](https://www.crazygames.com): every step and every coin
makes noise, the Wake meter creeps up, the dragon's eye half-opens… leave now, or one more pile? Get greedy and it
roars, chases you across the cave and breathes fire; reach the tunnel and you keep everything with a Close Call bonus.

- Lands directly in gameplay: the first screen *is* the lair, the first movement starts the heist.
- 30–90 second heists, one-tap retry, 60 fps Canvas 2D, ~160 KB download, no external assets.
- Six upgrades, four lairs with four dragons (bones, ice, lava, pressure plates), 32 artefacts in five rarity tiers,
  a Hoard Museum, six thief skins, 17 milestones, a Daily Heist shared by all players.
- Desktop + mobile (both orientations, virtual joystick, safe-area aware), keyboard layouts WASD/ZQSD/arrows.
- Official CrazyGames SDK v3: loading + gameplay events, midgame ads at the result screen, two optional rewarded
  placements (Keep loot after being caught, Double haul), cloud save through the Data module, platform mute,
  happytime, progress %, game context, username display.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | safety without weight |
| Bundler | Vite 6 (`base: "./"`) | relative paths for the CrazyGames CDN, ~37 KB gzipped JS |
| Rendering | Canvas 2D, all art drawn in code, sprite cache for loot | no image assets, crisp at any DPR, fast on 4 GB Chromebooks |
| UI | DOM + CSS (two OFL fonts) | crisp text, accessible buttons, cheap layout in both orientations |
| Simulation | fixed 120 Hz timestep, seeded RNG | identical physics at 60/144/165 Hz, shared daily lair |
| Audio | Web Audio synthesis (SFX + generative music) | no audio files, no licences |
| Runtime deps | none (the SDK is loaded from the CrazyGames CDN) | |

## Project structure

```
index.html                 entry: loads the CrazyGames SDK v3, then the game module
public/favicon.svg
src/
  main.ts                  boot + debug/QA hooks on window.__dwd
  game.ts                  orchestrator: runs, economy, screens, ads, saves, camera, HUD
  core/                    loop (fixed timestep), viewport/camera, input (keys + joystick), rng, save, math, events
  gameplay/                lair generator, thief, dragon (wake meter + chase + fire), run state machine, types
  entities/                particles (pooled), floating popups
  render/                  renderer, dragon/thief art, loot sprites, artefact icons, cached background, covers
  systems/                 juice: shake, slow-motion, hit-stop, flash, vignette
  progression/             lairs, upgrades, artefact collection, profile (save model), milestones & skins, daily
  audio/                   audio engine (mute reasons, iOS unlock), synthesised sfx, generative music
  sdk/                     CrazyGames SDK v3 wrapper with safe no-op fallbacks
  ui/                      DOM UI (HUD, result, shop, museum, settings, pause, toasts), icons, styles, fonts
tests/                     Playwright: playtest bots, UI walkthrough, platform checks, progression simulation
scripts/                   zip-dist (upload zip), render-covers, record-previews
docs/                      research, requirements checklist, concept, store page, release checklist, report
marketing/                 covers (16:9, 2:3, 1:1) and preview videos
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173 — the SDK runs in "local" mode (ads are overlays, demo user)
npm run typecheck
npm run build      # tsc + vite → dist/
npm run preview    # serves dist/ on http://localhost:4173
npm run zip        # dist/ → dont-wake-the-dragon-crazygames.zip (upload this in the Developer Portal)
```

Headless tests (Chromium via Playwright, the preview server must be running):

```bash
node tests/playtest.mjs --runs 5 --shots [--mobile] [--bot greedy|sneaky|reckless|kamikaze]
node tests/ui.mjs [--mobile]      # screens, purchases, lairs, daily, pause, resize, rewarded + midgame ads
node tests/platform.mjs           # audio unlock, ?muteAudio=true, SDK-less fallback, reload persistence, CPU throttle, keys, lullaby
node tests/balance.mjs --runs 30  # progression pacing with a human-like bot that shops
node scripts/render-covers.mjs    # marketing/cover-*.png from the game's art
node scripts/record-previews.mjs  # marketing/preview-*.mp4 (needs ffmpeg)
```

Debug hooks on `window.__dwd`: `state()`, `perf()`, `audio()`, `sdkLog()`, `env()`, `cover(variant)`, `setInput(x, y)`.
QA mutators under `__dwd.qa` (`grant`, `buy`, `setLair`, `setLevels`, `wake`, `setSessionPlay`, …) exist only when the
SDK environment is not `crazygames`.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD / arrows / ZQSD, or drag the mouse | drag anywhere (virtual joystick) |
| Sneak | hold Shift, or move the mouse a little | small drags |
| Lullaby (upgrade) | E / Space | blue button |
| Pause | P / pause button | pause button |

## Deployment on CrazyGames

1. `npm run build && npm run zip`.
2. Developer Portal → Submit a game → HTML5 → upload `dont-wake-the-dragon-crazygames.zip` (index.html at the zip
   root, all paths relative).
3. Tick **Progress Save → CrazyGames SDK Data module**, set orientation to *both*, enable mobile (iOS + Android).
4. Upload the three covers from `marketing/` and the two preview videos; paste the texts from `docs/STORE_PAGE.md`.
5. Test in the Developer-Portal preview tool, then submit for QA. Full audit: `docs/CRAZYGAMES_RELEASE_CHECKLIST.md`.

The build also runs standalone on any static host: without the SDK (or on a domain where it reports `disabled`)
every SDK call is a no-op and saves fall back to `localStorage`.

## CrazyGames SDK integration (`src/sdk/crazygames.ts`)

| Feature | SDK call | Where |
|---|---|---|
| Initialisation | `SDK.init()`, `SDK.environment` | `game.boot()` before anything else |
| Loading | `game.loadingStart()` / `loadingStop()` | around profile load + first lair |
| Gameplay events | `game.gameplayStart()` on heist start / resume, `gameplayStop()` on heist end, pause, screens | `game.ts` (throttle-safe) |
| Celebrations | `game.happytime()` on a new best haul ≥ 500, a legendary artefact, a lair unlock | `game.ts` (coalesced) |
| Progress | `game.reportGameCompletedPercentage()` = milestones completed | on run end, unlocks |
| Context | `game.setGameContext({ lair, daily, runs })` | every new heist |
| Platform mute | `game.settings.muteAudio` + `addSettingsChangeListener` | `audio.ts` master gain |
| Midgame ads | `ad.requestAd("midgame")` when the player taps "Next heist", after 3 min of play, never on the same break as a rewarded offer | `nextHeist()` |
| Rewarded ads | `ad.requestAd("rewarded")`: "Keep loot" after being caught (once per session, 5 s countdown), "Double haul" every third escape | `rewarded()` |
| Adblock | `ad.hasAdblock()` → rewarded offers hidden, game unaffected | `boot()` |
| Cloud save | `data.getItem/setItem/removeItem` with localStorage mirror + migration | `core/save.ts` |
| User | `user.getUser()`, `addAuthListener`, `systemInfo` (device type for the ready prompt) | settings screen, prompts |

## Assets and licences

Fonts: Titan One and Fredoka (SIL Open Font License 1.1, licence files in `src/ui/fonts/`). Everything else — art,
sound, music, covers — is generated by the game's own code. See `docs/ASSETS_AND_LICENSES.md`.

## Known limitations

- CrazyGames leaderboards are invite-only; the game tracks a single clean metric (best haul per lair) and can
  submit it via `user.submitScore` once invited.
- The Daily Heist has a local best only (no server); it is the same seeded lair for everyone.
- In-game purchases are not implemented (not needed for the loop; would require Xsolla + Full Launch).
