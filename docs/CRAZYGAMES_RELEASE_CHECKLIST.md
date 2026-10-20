# CRAZYGAMES RELEASE CHECKLIST — Don't Wake the Dragon

Audit date: 2026-10-20. Re-checked against the official docs read the same day (see
`CRAZYGAMES_REQUIREMENTS_CHECKLIST.md`). Evidence lives in `docs/test-evidence/` (logs + screenshots) and in the
tests under `tests/`. `[x]` = verified in this repository, `[ ]` = must be done by the account owner in the
Developer Portal.

## SDK (HTML5 v3)

- [x] **CrazyGames SDK correctly integrated** — `index.html` loads `https://sdk.crazygames.com/crazygames-sdk-v3.js`
      before the game module; wrapper in `src/sdk/crazygames.ts`; every method name verified against the live bundle.
- [x] **SDK initialised** — `await SDK.init()` is the first thing `Game.boot()` does (with a 5 s timeout); the
      environment (`local` / `crazygames` / `disabled`) is read and all calls are no-ops when disabled.
      Evidence: `platform.log` ("runs without the SDK script env=none"), every `sdk log` tail in the playtest logs.
- [x] **Loading events correct** — `loadingStart()` right after init, `loadingStop()` once the profile and the first
      lair are ready (before the boot overlay disappears). Evidence: sdk log in `playtest-desktop.log`.
- [x] **Gameplay start/stop correct** — `gameplayStart()` on the first movement of a heist, on resume from pause and
      after closing a screen that paused the run; `gameplayStop()` at the end of a heist, on pause and when a screen
      opens during play. Not called on tab switch. Deferred when the SDK's 1 s throttle would reject the call.
- [x] **Ads correctly implemented** — only via the SDK; midgame requested on "Next heist" (a result screen, never a
      navigation button), only after 180 s of play in the session and never on a break that showed a rewarded offer;
      a blocking overlay is shown from request until `adFinished`/`adError`; audio muted on `adStarted`, unmuted
      after; the game continues on every error code. Evidence: `ui-desktop.log` ("midgame" step, "back in lair").
- [x] **Rewarded ads correctly implemented** — two optional placements: "Keep loot" after being caught (once per
      session, 5 s countdown that freezes while the ad plays, equally styled "Continue" button) and "Double haul"
      (every third escape, equally styled "Next heist" button). Reward granted only on `adFinished`; on `adError` a
      "No ad available" toast and no reward. Buttons are hidden under adblock, in Basic Launch (SDK reports
      `adsDisabledBasicLaunch` → no reward, game continues) and when the SDK is not active.
      Evidence: `ui-desktop.log` / `ui-mobile.log` ("gold before/after keep", "gold before/after double").
- [x] **Adblock handling** — `hasAdblock()` at boot; rewarded offers are simply not shown; nothing else changes.
- [x] **Platform mute** — `game.settings.muteAudio` applied at boot and via `addSettingsChangeListener`; overrides the
      in-game toggles. Evidence: `platform.log` ("?muteAudio=true respected master=0").
- [x] **Data module** — the whole profile is one JSON key `dwd.profile` (< 2 KB, limit 1 MB); localStorage mirror and
      migration for returning players; debounced writes. Evidence: `platform.log` ("profile persists across reload").
- [x] **User module** — `getUser()` at boot (guest = null), `addAuthListener`; the CrazyGames username/avatar is shown
      in Settings; no own login, no logout, guests play normally.
- [x] **happytime** — only for a new best haul ≥ 500, a legendary artefact, a lair unlock; coalesced to one call per
      second (SDK throttle).
- [x] **reportGameCompletedPercentage** — milestones completed (monotonic); **setGameContext** per heist.
- [x] **Leaderboard-ready** — one clean metric (best haul per lair); `user.submitScore` not called (invite-only).

## Quality

- [x] **No console errors** — 0 errors / 0 warnings in every log (`playtest-*.log`, `ui-*.log`, `platform.log`).
- [x] **No broken assets** — the build has 6 files (index.html, JS, CSS, two fonts, favicon); every request logged;
      no `requestfailed` in any log. No external requests except the SDK.
- [x] **Mobile tested** — Pixel 7 emulation with touch: portrait and landscape playtests, UI walkthrough, rewarded +
      midgame ads (`playtest-mobile.log`, `ui-mobile.log`, screenshots `*-mobile.png`). Virtual joystick, safe-area
      padding, `user-select: none`, `touch-action: none`, no scroll/zoom gestures.
- [x] **Desktop tested** — keyboard (WASD / arrows / ZQSD / Shift / E / P) and mouse drag (`platform.log`,
      `playtest-desktop.log`).
- [x] **Resize tested** — live resize mid-heist (`ui/resize-800x450.png`), screenshots at every CrazyGames iframe size:
      907×510, 1216×684, 1077×606, 821×462, 1366×768, 1920×1080, 800×450, 1080×607, 450×800, 412×915, 915×412.
      Camera re-fits, HUD re-flows, background cache re-renders.
- [x] **Fullscreen tested** — no custom fullscreen button; the canvas is `position: fixed; inset: 0` and the 1920×1080
      / 1366×768 screenshots are the fullscreen cases.
- [x] **Audio tested** — AudioContext created and resumed inside a gesture (`platform.log`), mute reasons (user /
      platform / ad) verified via the debug hook; all sounds synthesised (no files to break).
- [x] **Save system tested** — reload persistence, profile migration from older versions (`parseProfile` tolerates
      missing keys), reset flow with two-tap confirmation.
- [x] **Privacy checked** — no personal data, cookies, analytics or third-party requests; no consent notice needed.
- [x] **External URLs checked** — none in-game (no links, no store buttons, no cross-promotion).
- [x] **Copyright checked** — original name, dragons, artefacts, art, sound; no brands or characters.
- [x] **Asset licences documented** — `docs/ASSETS_AND_LICENSES.md` (two OFL fonts, everything else generated).
- [x] **Performance checked** — 60 fps in all playtests; under 4× CPU throttling with software rendering (no GPU) the
      chase stays at 24–40 fps (`platform.log`), which is the worst case; fixed 120 Hz timestep; particle pool;
      loot sprite cache; cached background; CSS compositor layers for full-screen effects; no per-run allocations
      kept (old runs are dropped, screens rebuilt). Memory stable over 30-heist bot sessions (`balance.log`).
- [x] **Load time checked** — first state ~0.7 s on localhost (`boot →` line in the playtest logs); 72 KB zip,
      163 KB unpacked, 37 KB gzipped JS; far below the 20 MB mobile-homepage limit.
- [x] **Thumbnail prepared** — `marketing/cover-16x9.png` 1920×1080, `cover-2x3.png` 800×1200, `cover-1x1.png`
      800×800; only the title as text; rendered from the game's art.
- [x] **Preview videos prepared** — `marketing/preview-landscape.mp4` 1920×1080 and `preview-portrait.mp4` 1080×1620,
      19 s, silent, h264, first frame = the static cover, no black frames / cursor / promo text (~5 MB each).
- [x] **Description prepared** — `docs/STORE_PAGE.md` (short + long description, how to play).
- [x] **Controls described** — `docs/STORE_PAGE.md` (portal field text) and in-game Settings.
- [x] **Submission requirements fulfilled** — relative paths, index.html at the zip root, ≤ 1 500 files, PEGI-12
      content, English, lands in gameplay with zero clicks, original IP, no sitelock, no CSP header, works without
      the SDK, both orientations, mobile support.

## Gameplay requirements (docs: /requirements/gameplay, /requirements/quality)

- [x] Lands directly in gameplay (the lair is the first screen; movement starts the heist).
- [x] English only, no translations shipped (locale available via `systemInfo.locale` for a later update).
- [x] Onboarding built into play: one-line ready prompt + five one-time hints triggered by what the player does.
- [x] Physics consistent across refresh rates (fixed timestep, tested at 60 Hz; the simulation never reads frame dt).
- [x] Readable at DPR 1 in all iframe sizes (screenshots), HUD text ≥ 13 px, world zoom keeps the thief ≥ 10.5 px.
- [x] Avoided keys: Escape is not used (P pauses); no Ctrl/Cmd combinations.
- [x] Consistent art style (all code-drawn), consistent audio levels (per-bus gains), no placeholder graphics.

## Developer Portal steps that only the account owner can do

- [ ] Create the game as **HTML5**, upload `dont-wake-the-dragon-crazygames.zip` (run `npm run build && npm run zip`).
- [ ] Paste title, descriptions, controls from `docs/STORE_PAGE.md`; category Arcade; tags from the store page.
- [ ] Upload the three covers and the two preview videos from `marketing/`.
- [ ] **Progress Save → "using the Data Module from the CrazyGames SDK"** (otherwise the data module is disabled).
- [ ] Orientation: both. Mobile: iOS + Android enabled. Single player.
- [ ] Open the game in the Developer-Portal QA / preview tool and confirm the SDK event log shows loading,
      gameplay start/stop, ad requests and data writes, then submit for QA (Basic Launch).
- [ ] After Basic Launch KPIs are in (≥ 500 plays / 7–21 days): request Full Launch (ads go live automatically; the
      integration is already Full-Implementation ready: gameplayStop, muteAudio, data module, user module).
