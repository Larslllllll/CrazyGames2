# CRAZYGAMES REQUIREMENTS CHECKLIST

Source of truth: the official CrazyGames developer documentation at `docs.crazygames.com`, read on **2026-10-20**
(pages: `/requirements/intro`, `/requirements/technical`, `/requirements/gameplay`, `/requirements/quality`,
`/requirements/ads`, `/requirements/account-integration`, `/requirements/game-covers`, `/sdk/intro`, `/sdk/game`,
`/sdk/video-ads`, `/sdk/banners`, `/sdk/user`, `/sdk/data`, `/sdk/leaderboards`, `/sdk/leaderboards-client`,
`/resources/basic-launch-metrics`, `/resources/midgame-ads-pacing`, `/resources/rewarded-ads-deep-dive`,
`/resources/ad-monetization-guide`, `/resources/getting-to-the-first-frame`, `/resources/crazygames-app`,
`/resources/html5/common-fixes`, `/resources/monetizing-hypercasual-io`, `/resources/monetizing-action`,
`/resources/monetizing-clicker`, `/partials/crazygames-domains`, `/faq`).
Every SDK member name below was additionally verified against the live bundle
`https://sdk.crazygames.com/crazygames-sdk-v3.js` (downloaded 2026-10-20). Where third-party sources disagree
with the official docs, the official docs win.

Legend: `[B]` required for **Basic Launch**, `[F]` required for **Full Launch**, `[R]` recommended / quality guideline.
Every box is re-checked in `CRAZYGAMES_RELEASE_CHECKLIST.md` before submission.

## 1. Launch process & KPIs (`/requirements/intro`, `/faq`, `/resources/basic-launch-metrics`)

- [ ] Two-stage launch. **Basic Launch**: shown to a small segment of players, SDK optional, ads/banners/IAP disabled,
      no revenue. **Full Launch**: after strong KPIs + second QA pass; SDK mandatory, ads + revenue share enabled. `[B]`
- [ ] Basic Launch lasts ≥ 7 days and needs ≥ 500 plays; ends automatically after 21 days if 500 plays are not reached. `[B]`
- [ ] KPIs benchmarked against the platform: **average play time** (successful titles 10+ min), **Day-1 retention**
      (strong games 10–15 %), **conversion** = share of players who play ≥ 1 minute (top titles 80 %+, load < 10 s,
      build < 20 MB). Dashboard also shows players and (later) revenue. `[B]`
- [ ] QA plays every submission: it must work smoothly, meet quality standards and be enjoyable. Common rejection reasons:
      bugs, missing English, unoriginal content / asset flips, inappropriate themes, not PEGI-12, content aimed at kids,
      violating requirements/terms. Ads rules violations are rejected *without feedback*. `[B]`
- [ ] Submission needs a game description, controls text, 3 cover images and 2 preview videos (see §7). `[B]`
- [ ] Revenue share eligibility: no other portal's branding, SDK integrated, no external ads, original game. Payout from €100. `[F]`
- [ ] Updates are uploaded through the Developer Portal and approved (usually same working day). The genre / major features
      must not change after submission. `[R]`
- [ ] Technical SDK support from CrazyGames only after 50 k combined plays — the integration must be self-verified in the
      Developer-Portal QA tool / `crazygames.com/preview`. `[R]`

## 2. Technical (`/requirements/technical`, `/requirements/gameplay`, `/resources/getting-to-the-first-frame`)

- [ ] Total upload ≤ 250 MB and ≤ 1 500 files (≤ 50 MB total if the SDK is not used). `[B]`
- [ ] Initial download ≤ 50 MB; **≤ 20 MB for mobile-homepage eligibility**. With the SDK it is measured from load start to
      the first `gameplayStart()`; time to gameplay should be ≤ 20 s (QA judgement for externally hosted files). `[B]`
      *Project target: < 300 KB zipped, gameplay in < 2 s.*
- [ ] **Relative paths only** — absolute paths fail on the CrazyGames CDN. `[B]`
- [ ] Must work on Chrome and Edge; games that work poorly on Safari get disabled there; must run smoothly on a 4 GB RAM
      Chromebook (otherwise disabled on ChromeOS). `[B]`
- [ ] Mouse + keyboard support; touch support when mobile is enabled. Intuitive controls on every device type. `[B]`
- [ ] Desktop playable in landscape; portrait allowed (with proper side handling). Supported orientations are declared in the
      submission; the site prompts the user to rotate, so no own orientation-lock logic. `[B]`
- [ ] Use `SDK.user.systemInfo` (`device.type`, `os`, `browser`, `applicationType`, `locale`) to tailor the experience. `[R]`
- [ ] Legible at `devicePixelRatio: 1` in these iframe sizes: desktop 907×510, 1216×684, 1077×606, 821×462; fullscreen
      1366×768, 1920×1080, 1536×864, 1280×720; mobile 800×450; tablet 1080×607. `[B]`
- [ ] Physics must perform consistently across monitor refresh rates (144 Hz, 165 Hz) → fixed-timestep simulation. `[B]`
- [ ] Loads quickly, plays without errors or crashes; no console errors. `[B]`
- [ ] Mobile: `user-select: none` (with vendor prefixes) on `body` to stop magnifier / long-press menus. `[B]`
- [ ] Mobile must work inside the CrazyGames App (fullscreen, immersive): pad important UI with
      `env(safe-area-inset-*)`; detect the app via `systemInfo.applicationType === "google_play_store" | "apple_store"`. `[B]`
- [ ] iOS audio: call `AudioContext.resume()` inside a user gesture (`touchend` / `click`) whenever it is suspended; a
      visibility-change listener alone is not enough. `[B]`
- [ ] **No custom fullscreen button** (CrazyGames provides it; custom ones can break monetisation). `[B]`
- [ ] Avoid keys with browser behaviour (Esc leaves fullscreen, Ctrl/Cmd+W). Adapt WASD to AZERTY (ZQSD) where relevant. `[R]`
- [ ] Common fixes (`/resources/html5/common-fixes`): prevent wheel scroll (`passive:false`), prevent ArrowUp/ArrowDown/Space
      default, prevent context menu. `[R]`
- [ ] Sitelock is optional. If used, whitelist `*.crazygames.com`, `games.crazygames.com`, `https://app.crazygames.com`,
      `capacitor://app.crazygames.com`. If a CSP `frame-ancestors` header is used it must list the app origins. *(We do
      not sitelock and ship no CSP header.)* `[R]`
- [ ] Privacy: a T&C / privacy notice is required only when personal data beyond SDK events is collected (a simple notice,
      not a blocking pop-up). *(We collect nothing.)* `[B]`
- [ ] Only compressed builds (Brotli/Gzip) are served; name output files with hashes to avoid stale caches. `[R]`

## 3. SDK v3 for HTML5 (`/sdk/intro` + module pages; names verified in the live bundle)

- [ ] Load `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>` in `index.html` before game code. `[F]`
- [ ] `await window.CrazyGames.SDK.init()` before any other SDK call (on the loading screen; the SDK preloads data). `[F]`
- [ ] Read `window.CrazyGames.SDK.environment` (`"local"` on localhost / `?useLocalSdk=true`, `"crazygames"` on the
      platform, `"disabled"` elsewhere → SDK calls throw; the game must still run). `[F]`
- [ ] Game module (`SDK.game`): `loadingStart()` / `loadingStop()` (optional but implemented), `gameplayStart()` whenever
      play begins or resumes (start, resume, revive, next level), `gameplayStop()` on every break (menu, pause, level/run
      end). Do **not** call `gameplayStop()` on tab switch / focus loss — the platform handles that. First `gameplayStart()`
      defines the measured initial-download size. `[B start / F stop]`
- [ ] `SDK.game.happytime()` only for major achievements (new record, boss) — never for routine events. `[R]`
- [ ] `SDK.game.settings.muteAudio` must be respected and overrides the in-game toggle; register
      `addSettingsChangeListener(listener)`; test with `?muteAudio=true`. **Required for a Full implementation.** `[F]`
- [ ] `SDK.game.reportGameCompletedPercentage(0–100)`: monotonic progress; 100 only at a meaningful completion. `[R]`
- [ ] `SDK.game.setGameContext({...})` / `clearGameContext()` to attach debug context to player feedback. `[R]`
- [ ] Ads (`SDK.ad`): `requestAd("midgame" | "rewarded", { adStarted, adFinished, adError })`. Pause + mute on
      `adStarted`, resume + unmute on `adFinished` / `adError`, reward only on `adFinished`. Error codes:
      `adsDisabledBasicLaunch`, `unfilled`, `adblock`, `adCooldown`, `other`. `await SDK.ad.hasAdblock()`. `[F]`
- [ ] Data (`SDK.data`): `getItem(key)`, `setItem(key, value)`, `removeItem(key)`, `clear()` — localStorage-like, 1 MB
      limit of JSON-stringified data, saves debounced 1 s (up to 30 s), guests → localStorage, logged-in → synced across
      devices, SDK reloads the game on login. Errors: `dataLimitExcedeed` (sic), `dataModuleDisabled`, `other`.
      **Tick "Progress Save → Data module" in the submission form** or the module is disabled. Rely on it instead of own
      localStorage; migrate old localStorage keys for returning players. `[F]`
- [ ] User (`SDK.user`): `isUserAccountAvailable` (variable), `await getUser()` (null = guest; `username`,
      `profilePictureUrl`, `__dangerousUserId`), `addAuthListener` / `removeAuthListener`, `showAuthPrompt()` (never
      automatically; only via a non-primary "Login with CrazyGames" button), `systemInfo`. Show the CrazyGames username /
      avatar instead of an own profile; no own login / logout; guests must be able to play. Request the user at every
      launch. `[F where applicable]`
- [ ] Banners (`SDK.banner`): `requestBanner({id,width,height})`, `requestResponsiveBanner(id)`, `clearBanner(id)`,
      `clearAllBanners()`; only on screens open ≥ 5 s, never over gameplay, ≤ 2 per screen, 30 s minimum refresh, container
      fully visible. Error codes incl. `bannersDisabledBasicLaunch`, `unfilled`, `notVisible`, `noAvailableSizes`,
      `videoAdPlaying`, `bannerCooldown`, `maxRefreshReached`, `bannersDisabledMobileApp`. *(Optional.)* `[F optional]`
- [ ] Leaderboards are **invite-only**, one per game, weekly seasons (Monday 09:00 UTC), metric types XP / KDA / POINTS /
      MINUTES, ASC or DESC, client submission via `SDK.user.submitScore({ encryptedScore, score })` with AES-GCM
      encryption of the score. Design one clean "best score" metric so the game is leaderboard-ready; do not call the API
      without an invitation. `[R]`
- [ ] Multiplayer / room APIs (`isInstantMultiplayer`, `updateRoom`, `leftRoom`, `inviteLink`, `getInviteParam`,
      `addJoinRoomListener`) are only relevant for multiplayer games. *(Not used.)*
- [ ] Local testing: `localhost` / `127.0.0.1` / `?useLocalSdk=true` → ads become overlays, demo user, console logging;
      `?muteAudio=true`, `?user_response=`, `?user_account_available=false` simulate platform states. Final check in the
      Developer-Portal preview tool. `[R]`

## 4. Advertisement rules (`/requirements/ads`, `/resources/midgame-ads-pacing`, `/resources/rewarded-ads-deep-dive`, `/resources/ad-monetization-guide`, genre guides)

- [ ] Only CrazyGames SDK ads; no third-party networks. `[F]`
- [ ] The game must run perfectly with ads disabled (Basic Launch) and with an adblocker; adblock users may never be
      blocked or penalised; disabled features need a non-popup notice; rewarded buttons must never be clickable with no
      effect. `[B]`
- [ ] Midgame ads only at logical points (level / run end, death screen, "Stage clear" summary, after a boss), never on
      navigation buttons (menu, settings, shop) and never during active play; never a surprise. `[F]`
- [ ] Block all progress with a visible blocker while an ad is requested/playing until `adFinished` / `adError`;
      mute only when the ad actually starts; the game continues normally on `adError`. `[F]`
- [ ] The SDK enforces midgame pacing (max one per 3 min incl. rewarded/preroll; too-early requests are ignored) — request
      at every natural break, no own cooldown needed; first midgame ad only after the tutorial / 3–5 min of play. `[R]`
- [ ] Rewarded ads: occasional special opportunities, never an expectation; show a timer or hide the button when limited;
      no chained ads; never during active gameplay; button easy to find, consistent, not misleading, with a video/play
      icon and the exact reward in the text; the skip/"no thanks" option has the same size, font and colour and is never
      hidden/delayed; offer a non-ad alternative (e.g. currency); confirm the reward on `adFinished`; never reward on
      `adError`. `[F]`
- [ ] Specific: no out-of-lives ad on every death; revive ≤ once per session with a 5 s countdown and 2–3 s invincibility;
      between two levels either "midgame + restart" or "rewarded keep-playing", never both. `[F]`
- [ ] Hypercasual guide: request midgame on "Next" / retry after the summary is shown (not on load); rewarded = revive
      (once/session), cosmetics, loot multipliers (double coins) at run end; banners only on menu/shop/level-select. `[R]`
- [ ] Banners (optional): ≥ 5 s screens, never over gameplay, ≤ 2 per screen, no UI overlap on any size, clearly distinct
      from game content. `[F optional]`

## 5. Gameplay, content & accounts (`/requirements/gameplay`, `/requirements/quality`, `/requirements/account-integration`)

- [ ] Land directly in gameplay; at most one click. Onboarding built into play, skippable, visual, minimal text; clear
      labelled buttons, no button delays, no ad-sized buttons. `[F / R]`
- [ ] English mandatory; optional translations must be high quality; use `systemInfo.locale` with English fallback. `[B]`
- [ ] Original name, assets and content; PEGI-12 compliant (audience 13+); not aimed at kids; no generic identifier as
      name unless owned ("Chess" no, "Super Chess" yes); name/icon not confusable with other games; honest covers. `[B]`
- [ ] No cross-promotion of other games/platforms; app-store links never in-game (use the portal metadata fields);
      community links allowed only as a non-primary menu item. `[B]`
- [ ] No own username/avatar system, no own login/logout, guests can always play. `[F]`
- [ ] Progress saving is required (Data module preferred; APS alternative). `[F]`
- [ ] Clear reachable goals, consistent controls, fast response, balanced difficulty, comfortable layout and audio levels,
      consistent art style, high-resolution defect-free graphics. `[R]`
- [ ] Solo play as prominent as multiplayer (N/A — single player). `[R]`

## 6. Mobile (`/requirements/technical`, `/resources/crazygames-app`)

- [ ] Touch controls, no accidental scroll/zoom (`touch-action: none`, `user-select: none`, wheel/key prevention). `[B]`
- [ ] Works in portrait and landscape as declared; UI scales to 800×450 and up; safe-area padding in the app. `[B]`
- [ ] No own orientation lock; respond to `resize` / orientation changes live. `[B]`
- [ ] Performance on low-end Android / 4 GB Chromebook; mobile initial download ≤ 20 MB. `[B]`

## 7. Covers & videos (`/requirements/game-covers`)

- [ ] Three covers: landscape 16:9 **1920×1080**, portrait 2:3 **800×1200**, square 1:1 **800×800**, consistent visuals. `[B]`
- [ ] Text on covers: only the game title; no "New", "Updated", "Play"; no borders, icons, store logos, copyrighted art,
      blur or pixelation. `[B]`
- [ ] Preview videos: 15–20 s, ≤ 50 MB, silent, both **1080p 16:9 landscape** and **1080p 2:3 portrait**, no
      fast-forward, first frame = the static cover, no black screens / logo transitions / black bars / mouse cursor /
      promo text / store or social icons; animation allowed if it represents gameplay honestly. `[B]`

## 8. Assets, licensing, privacy

- [ ] Every external asset documented with licence (`ASSETS_AND_LICENSES.md`); only self-made, CC0, public-domain or
      properly licensed assets; no brands, no copyrighted characters, music or sounds. `[B]`
- [ ] No tracking, cookies or third-party requests besides the CrazyGames SDK; no personal data → no consent banner. `[B]`

## 9. Performance

- [ ] First playable frame well under 10 s (target < 2 s); build far under 20 MB (target < 300 KB zipped). `[R]`
- [ ] Stable frame rate on a 4 GB Chromebook and mid-range Android; fixed-timestep simulation; no per-frame allocations
      in hot loops; object pooling; no memory growth over 50+ runs; no listener leaks. `[B]`
- [ ] Resize / orientation / fullscreen toggle handled live without reload. `[B]`

## 10. Developer-Portal steps that only the account owner can do

- [ ] Create the game, upload the zip of `dist/` (index.html at the zip root, relative paths), choose "HTML5".
- [ ] Fill description, controls, category/tags; upload 3 covers + 2 preview videos.
- [ ] Toggle **Progress Save = yes, via the CrazyGames SDK Data module**; declare orientation + mobile support.
- [ ] Run the game in the Developer-Portal QA / preview tool (`crazygames.com/preview`) and check the SDK event log
      (loading, gameplay start/stop, ad requests, data), then submit for QA.
