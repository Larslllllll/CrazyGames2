# ABSCHLUSSREPORT — Don't Wake the Dragon

Stand: 2026-10-20. Repository `CrazyGames2`, Branch `claude/blissful-ride-x5zwow`. Alle Zahlen stammen aus den
Logs in `docs/test-evidence/` und den Dokumenten in `docs/`.

## 1. CrazyGames Research — was verlangt CrazyGames aktuell?

Quelle: die offizielle Dokumentation (docs.crazygames.com, gelesen am 2026-10-20) plus das Live-SDK-Bundle
`crazygames-sdk-v3.js`. Vollständige Checkliste: `docs/CRAZYGAMES_REQUIREMENTS_CHECKLIST.md`. Kernpunkte:

- **Zweistufiger Launch.** Basic Launch (≥ 7 Tage, ≥ 500 Plays, Ads deaktiviert, SDK optional) → Full Launch nach
  starken KPIs und zweitem QA-Durchlauf (SDK Pflicht, Ads + Revenue-Share). Benchmarks: ≥ 10 min durchschnittliche
  Spielzeit, 10–15 % D1-Retention, 80 %+ Conversion (Spieler, die ≥ 1 min spielen; Ladezeit < 10 s, Build < 20 MB).
- **Technik.** ≤ 250 MB / 1 500 Dateien, Initial-Download ≤ 50 MB (≤ 20 MB für die Mobile-Startseite), nur relative
  Pfade, Chrome/Edge/Safari, 4-GB-Chromebook, Maus+Tastatur+Touch, beide Orientierungen erlaubt, lesbar bei DPR 1 in
  den iFrame-Größen 907×510 … 1920×1080, Physik unabhängig von 144/165 Hz, kein eigener Fullscreen-Button,
  `user-select: none`, Safe-Area in der App, iOS-Audio-Resume in einer Geste.
- **SDK v3 (HTML5).** `init()` zuerst, `environment` prüfen; `loadingStart/Stop`, `gameplayStart/Stop` (nicht bei
  Tab-Wechsel), `happytime` sparsam, `settings.muteAudio` Pflicht für Full Implementation, Ads nur über
  `ad.requestAd("midgame"|"rewarded")` mit `adStarted/adFinished/adError`, Data-Modul (1 MB, Progress-Save-Häkchen
  im Portal), User-Modul (Username/Avatar anzeigen, kein eigener Login), Leaderboards invite-only.
- **Werberegeln.** Midgame nur an natürlichen Pausen (Level-/Run-Ende), nie auf Navigationsbuttons, Blocker bis
  `adFinished/adError`, Mute erst bei `adStarted`, SDK erzwingt 3-Minuten-Abstand, erste Midgame-Ad erst nach 3–5
  min; Rewarded optional, gleich großer „Nein danke“-Button, kein Reward bei `adError`, Revive max. 1×/Session mit
  Countdown, nie Midgame + Rewarded an derselben Pause; Adblock-Nutzer nie blockieren.
- **Inhalt.** Direkt ins Gameplay (max. 1 Klick), Englisch, PEGI 12, Originalität, keine Cross-Promotion/Links,
  Covers 1920×1080 / 800×1200 / 800×800 nur mit Titel-Text, Preview-Videos 15–20 s stumm in 16:9 und 2:3 1080p mit
  dem Cover als erstem Frame.

## 2. Market Analysis — welche Games/Mechaniken funktionieren aktuell?

Datenbasis: 1 243 Spiele aus den Listen hot/new/updated/leaderboards, 13 Genre- und 25 Tag-Seiten; 330 Spielseiten
im Detail (Rating, Votes, Technologie, Orientierung, Tags, Beschreibung). Details: `docs/MARKET_RESEARCH.md`.

- Arcade dominiert die Hot- (12/40) und New-Liste (19/70); **HTML5 stellt 84 der 133** hot/neuen/jungen Spiele.
- **„Steal/grab & escape“ ist die momentan heißeste Mechanik**: Steal Eggs 113 K Plays/Tag (2,84 M in 25 Tagen),
  Steal Dino Egg 9,1, Obby Fish for Egg 9,2; auf Roblox ~1 M gleichzeitige Spieler in Steal An Egg. Auf CrazyGames
  existiert die Schleife nur als 3D-Unity-/Multiplayer-Builds.
- **„Satisfying verb + Upgrades“** liefert die höchsten Ratings der Plattform (Shred the Evidence 9,7, Bills Must
  Be Paid 9,5, Crusher Clicker 9,4, TNT Voxel 9,3). Incremental/Idle/Collect sind die häufigsten Gameplay-Tags.
- Push-your-luck-Entscheidungen (Slice Master, KABOOM, Bills Must Be Paid), Seltenheits-Reveals (Eier, Lucky Blocks,
  legendäre Fische) und absurde, sofort verständliche Prämissen (Needle in a Haystack: 48 M Views, 14 Roblox-Kopien
  in 48 h) erzeugen die Aufmerksamkeit.
- Evergreen-Einmechanik-Spiele (Drift Boss, Tap-Tap Shots, Moto X3M) sind nach 7 Jahren noch hot: kurze Runs,
  Retry < 1 s, ein Bestwert.

## 3. Chosen Concept — was wurde gebaut?

**Don't Wake the Dragon**: ein Push-your-luck-Heist. Der Dieb steht in einer Höhle voller Gold, der Drache schläft
darauf. Jeder Schritt, jede Münze und ein schwerer Beutel erzeugen Lärm; der Wake-Meter steigt, beim Stillstehen
sinkt er, lautes Schnarchen maskiert Schritte. Gier (Anteil des geplünderten Horts) und Zeit machen den Schlaf
leichter. Bei 50 % öffnet sich ein Auge, bei 80 % knurrt er, bei 100 % brüllt er, jagt den Dieb und speit Feuer.
Der Tunnel ist immer offen: früh gehen oder „noch ein Haufen“. Entkommen = alles behalten (+20 % Close-Call-Bonus
bei wachem Drachen); erwischt = Beutel weg.

Umfang: 4 Höhlen mit eigenem Drachen und Gimmick (Knochen, Eis, Lava, Druckplatten), 6 Upgrades (Big Bag, Quiet
Boots, Fast Legs, Gold Magnet, Lucky Charm, Lullaby), 32 Artefakte in 5 Seltenheitsstufen mit Hoard Museum, 6
Dieb-Skins, 17 Meilensteine, Daily Heist (seeded, für alle gleich), Bestwert pro Höhle. Technik: TypeScript + Vite +
Canvas 2D, alles im Code gezeichnet und synthetisiert; 72 KB Zip, ~0,7 s bis zum Spiel.

## 4. Why This Game — warum genau dieses Konzept?

24 Ideen wurden in 14 Kriterien bewertet (`docs/GAME_CONCEPT.md`); das Konzept gewann mit 126/140 vor einem
2D-„Egg Thief“ (110), einem Survivors-Roguelite (106) und einem Zombie-Schwarm (106). Es verbindet die
momentan stärkste Plattform-Schleife (sneak → grab → chase → escape) mit einer Prämisse, die jeder aus Märchen
kennt (der Titel *ist* die Spielregel), einer sichtbaren Push-your-luck-Entscheidung, Seltenheits-Reveals,
inkrementellen Upgrades und einem sauberen Bestwert. Es ist ein anderes Genre als das Schwesterprojekt
„Dummy Launch“ (Ragdoll-Kanonen-Distanz), beide kannibalisieren sich nicht. Entwicklungsrisiko: gering (2D,
Einzelbildschirm, kein Server, keine Assets).

## 5. Viral Loop — warum könnte es geteilt werden?

- Jeder Run endet in einem Moment, der sich erzählen lässt: „ich stand auf seiner Schnauze, als das Auge aufging“,
  „einen Schritt vor dem Tunnel gebraten“, „Legendary Orb mit 97 % Meter“.
- Das Wecken ist ein visuelles Ereignis (Slow-Motion, Brüllen, Shake, rote Vignette, Feuer) und dauert nur 5–8 s:
  perfekt für Shorts/TikTok-Clips.
- Rare/Epic/Legendary-Karten auf dem Ergebnisbildschirm (NEW-Badge), Close-Call-Bonus, Daily Heist mit gleichem
  Layout für alle („was hast du heute rausgeholt?“), Bestwert-Jagd pro Höhle.
- Titel und Thumbnail erklären das Spiel ohne Worte; die Cover zeigen genau die Situation, die im Spiel passiert.

## 6. Retention Loop — warum kommen Spieler zurück?

Erste Session: 0–10 s Regel verstanden (Hinweiszeile, Meter steigt beim ersten Münz-Klirren), ~30 s erste
Beute oder erstes Scheitern, 1–3 min erstes Upgrade (60–100 Gold), ~5 min Lullaby/Big Bag Level 2 oder erste
Rare-Karte, 10–15 min Ziel „Frozen Hollow“ (1 500 Gold). Spätere Sessions: neue Höhlen (6 000 / 20 000 Gold mit
2,5×/6×/15× Werten), fehlende Museumsstücke (Skins als Belohnung), Daily Heist, Bestwerte, Lullaby-Meisterung.
Die Progression-Simulation (`balance.log`) zeigt, dass ein zügiger Bot in ~3,5 min Spielzeit die Cave-Upgrades
weitgehend ausbaut und die erste Höhle freischaltet; Menschen brauchen 3–5× länger — passend zum 10-min-Benchmark.

## 7. Monetization — wo und warum wurden Ads integriert?

- **Midgame**: beim Tippen auf „Next heist“ auf dem Ergebnisbildschirm (natürliche Pause), erst nach 180 s
  Spielzeit und mindestens zwei Heists in der Session, nie an einer Pause mit Rewarded-Angebot; SDK-Pacing (3 min).
- **Rewarded „Keep loot“**: nach dem Erwischtwerden, 1×/Session, 5-s-Countdown (pausiert während der Ad),
  gleich großer „Continue“-Button; der Drache niest den Dieb mit Beutel aus der Höhle. Hoher Wert, klarer Nutzen.
- **Rewarded „Double haul“**: jeder dritte Escape ab 30 Gold, gleich großer „Next heist“-Button.
- Kein Reward bei `adError`, Buttons bei Adblock/Basic Launch unsichtbar, Audio nur während der Ad stumm.
- Keine Banner (Ergebnisbildschirm ist < 5 s offen), keine IAP.

## 8. CrazyGames SDK — welche Funktionen wurden integriert?

`init`, `environment`, `game.loadingStart/loadingStop`, `game.gameplayStart/gameplayStop` (throttle-sicher),
`game.happytime` (koalesziert), `game.reportGameCompletedPercentage`, `game.setGameContext`,
`game.settings.muteAudio` + `addSettingsChangeListener`, `ad.requestAd("midgame")`, `ad.requestAd("rewarded")` ×2,
`ad.hasAdblock`, `data.getItem/setItem/removeItem` (mit localStorage-Spiegel und Migration), `user.getUser`,
`user.addAuthListener`, `user.systemInfo`. Alle Aufrufe sind No-ops ohne SDK oder bei `disabled`.

## 9. Performance — welche Optimierungen wurden vorgenommen?

Fixed-Timestep 120 Hz, Partikel-Pool, Loot-Sprite-Cache (statt 3 Pfadfüllungen pro Münze), Sichtbereichs-Culling,
gecachter Höhlen-Hintergrund, Vignette/Flash als CSS-Compositor-Layer statt Vollbild-Blits, Hintergrund nur in den
nicht abgedeckten Streifen, DPR-Cap 2 (1,5 auf schwachen Phones), keine Allokationen in heißen Pfaden, DOM-HUD mit
Diff-Updates. Ergebnis: 60 fps in allen Playtests; unter 4× CPU-Drosselung mit reiner Software-Rasterung
(headless, keine GPU) 24–40 fps in der Verfolgung; 72 KB Zip, 37 KB gzip JS, erstes Bild ~0,7 s.

## 10. Submission Readiness — was ist bereit, was musst du selbst erledigen?

Bereit: Build (`npm run build && npm run zip` → `dont-wake-the-dragon-crazygames.zip`), drei Cover, zwei
Preview-Videos (`marketing/`), Store-Texte (`docs/STORE_PAGE.md`), Lizenzliste, README, Release-Checkliste mit
Evidenz, Testskripte. Im Developer Portal musst du selbst: das Spiel als HTML5 anlegen und das Zip hochladen,
Texte/Covers/Videos eintragen, **Progress Save = Data Module** anhaken, Orientierung „both“ und Mobile (iOS +
Android) aktivieren, im Preview-Tool das SDK-Log prüfen und zur QA einreichen; nach dem Basic Launch den Full Launch
beantragen (die Integration ist bereits Full-Implementation-fähig). Leaderboards: bei Einladung `user.submitScore`
mit „best haul“ nachrüsten (Metrik ist vorbereitet).
