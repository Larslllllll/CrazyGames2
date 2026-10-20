# MARKET RESEARCH — CrazyGames, 20 October 2026

**Data sources.** The live CrazyGames site on 2026-10-20: the listing pages `/hot` (40 games), `/new` (70), `/updated`
(70), `/multiplayer`, `/leaderboards`, the home page, 13 genre pages (`/c/*`) and 25 tag pages (`/t/*`) — 1 243 unique
games with `totalPlays`, `totalLikes`, `categoryName`, `mobileFriendly`, `gameThumbLabels` from the embedded page
JSON. For 330 of them (every hot/new/home game, the top of every genre/tag page and all leaderboard games) the
individual game page was parsed as well: rating, up/down-votes, `addedOn`, technology, orientation, tags, controls,
description, leaderboard, IAP, iOS/Android flags. "Plays/day" = total plays ÷ days since `addedOn`. Raw data:
`games.csv`, `games_detail.csv/json` in the session scratchpad. External trend sources are linked in §6.

## 1. The platform right now — numbers that matter

| Signal | Finding |
|---|---|
| Hot list (40) by category | **Arcade 12**, Sports 10, Driving 5, Puzzle 3, Adventure 2, Board 2, 1× Card/Sim/Shooting/Trivia/Action/.io |
| New list (70) by category | **Arcade 19**, Simulation 10, Action 8, Clicker 7, Sports 5, Puzzle 5, Driving 3 |
| Technology of hot + new + ≤120-day games (133) | **HTML5/iframe 84**, Unity 47, Ruffle 2 → HTML5 is the majority of what gets listed |
| Orientation (same set) | Landscape 52, **Both 52**, Portrait 20 |
| Mobile friendly | 35/40 hot, 66/70 new |
| Leaderboards | 33 of 330 analysed games; the platform surfaces them in a sidebar page, carousels and widgets |
| Most frequent tags (hot+new+recent) | Mobile 118, Mouse 47, 3D 47, 2D 36, Casual 29, **Incremental 28**, Multiplayer 23, **Idle 22**, With friends 20, **Physics 19**, **Collect 18**, Ball 17, Relaxing 16, Battle 15, Skill 15, Car 14, **Destroy 12**, Avoid 10, Survival 10 |
| Highest-rated games on the platform (≥ 2 000 votes) | Endless Waves Survival 9.7, FrontWars.io 9.7, **Shred the Evidence 9.7** (3 days old), Bills Must Be Paid 9.5, Dear Travellers 9.5, Turball.io 9.5, Break The Noob Completely! 9.5, Crusher Clicker 9.4, Leek Factory Tycoon 9.4, Stellar Swarm 9.4, London Crane Operator 9.4, Fish Orbit 9.3, TNT Voxel 9.3, The MachinEGG 9.3 |
| Official genre KPIs (docs) | Clicker/idle: ~15 min avg play, 6.6 % D1, 5.5 ads/play. Action: 13 min, 8.1 % D1 (platform avg 6.7 %). Shooting: 12 min, 6.5 % D1 |

**Momentum table — every game released in the last 120 days, ranked by plays per day (top 30):**

| # | Game | Category / tech | Rating | Plays | Plays/day | Added | What it is |
|---|---|---|---|---|---|---|---|
| 1 | **Steal Eggs** | Arcade, Unity 3D | 8.8 | 2.84 M | **113 643** | 2026-09-25 | Sneak into guarded nests, grab the egg, RUN from the guard, hatch pets, base income |
| 2 | Coin Run | Arcade, Unity, portrait | 9.0 | 63 K | 62 984 (day 1) | 2026-10-19 | Money gate-runner with businesses |
| 3 | Real War: Not Fake | Action, Unity | 8.5 | 1.97 M | 56 314 | 2026-09-15 | Army gate-runner shooter (#1 hot) |
| 4 | Boxity.io | Arcade, HTML5 | 9.1 | 234 K | 38 920 | 2026-10-14 | 3D multiplayer obby, incremental |
| 5 | +1 Speed Keyboard Obby | Action, Unity | 8.6 | 712 K | 33 913 | 2026-09-29 | Every step = +1 speed, 12 stages |
| 6 | Dear Travellers | Action, Unity | 9.5 | 404 K | 33 683 | 2026-10-08 | 4-player co-op plane chaos (CG Original) |
| 7 | Blombo.io | .io, HTML5 | 8.8 | 1.62 M | 28 410 | 2026-08-24 | 100 community mini-games hub |
| 8 | Unmatched Ego 2 | Sports, Unity | 9.1 | 2.43 M | 26 697 | 2026-07-21 | 3v3 online football (CG Original, leaderboard) |
| 9 | Keyboard Obby: +1 Speed | Action, HTML5 | 9.0 | 99 K | 24 838 | 2026-10-16 | HTML5 clone of #5 |
| 10 | Turball.io | .io, HTML5 | 9.5 | 104 K | 20 848 | 2026-10-15 | Car soccer |
| 11 | Blogger Dress Up | Beauty, HTML5, portrait | 9.5 | 35 K | 17 586 | 2026-10-18 | Dress-up + fashion blog |
| 12 | Draw Fly | Puzzle, Unity, portrait | 9.2 | 16 K | 15 828 (day 1, hot) | 2026-10-19 | Draw a path, stickman flies it |
| 13 | World Craft Dream Island | Adventure, HTML5 | 8.7 | 29 K | 14 295 | 2026-10-18 | Voxel sandbox |
| 14 | RACE: Rocket Arena Car Extreme | Driving, Unity | 9.0 | 13 K | 12 827 | 2026-10-20 | Combat racing |
| 15 | London Crane Operator | Simulation, HTML5 | 9.4 | 13 K | 12 703 | 2026-10-19 | Physics crane jobs (CG Original) |
| 16 | Makeover Cleaning ASMR | Simulation, HTML5, portrait | 9.0 | 25 K | 12 533 | 2026-10-18 | Restore dirty objects, ASMR |
| 17 | Steal Dino Egg | Arcade, Unity | 9.1 | 80 K | 11 409 | 2026-10-13 | Steal eggs from dinos, escape, park tycoon |
| 18 | Hexa Stack | Puzzle, HTML5, portrait | 8.4 | 902 K | 11 132 | 2026-07-31 | Colour-sorting hex stacks (leaderboard) |
| 19 | Rental Life: Tenant Stories | Clicker, HTML5 | 9.2 | 32 K | 10 651 | 2026-10-17 | Rental tycoon |
| 20 | Hero Merge | Action, Unity | 8.8 | 9 K | 9 229 | 2026-10-19 | Merge weapons, horde survival (CG Original) |
| 21 | Escape from Chunga Changa | Adventure, Unity | 8.8 | 18 K | 9 158 | 2026-10-18 | Absurd survival-horror escape |
| 22 | Cornerlet | Simulation, HTML5 | 9.0 | 293 K | 9 144 | 2026-09-18 | Cozy sticker rooms |
| 23 | Evil Tower | Strategy, Unity, portrait | 9.3 | 1.06 M | 8 993 | 2026-06-24 | Idle tower-defence roguelite (CG Original) |
| 24 | Zombie Lane | Arcade, HTML5, portrait | 8.6 | 45 K | 8 954 | 2026-10-15 | Zombie gate-runner |
| 25 | TNT Voxel | Arcade, HTML5 | 9.3 | 246 K | 8 773 | 2026-09-22 | Blow up voxel castles, no timer, no game over |
| 26 | Chicken Hell | Arcade, Unity | 8.9 | 824 K | 8 498 | 2026-07-15 | One-button height launcher (CG Original, leaderboard) |
| 27 | Break The Noob Completely! | Arcade, HTML5 | 9.5 | 16 K | 8 204 | 2026-10-18 | Launch the Noob, control the flight, destruction, upgrades |
| 28 | Baseball For Brainrot | Arcade, Unity | 9.0 | 930 K | 7 749 | 2026-06-22 | Smash lucky blocks → meme creatures |
| 29 | KABOOM KINGDOMS | Action, HTML5 | 9.1 | 14 K | 7 202 | 2026-10-18 | Aim rockets through multiplier gates at castles |
| 30 | Shred the Evidence | Clicker, HTML5 | **9.7** | 19 K | 6 281 | 2026-10-17 | Shred documents before the auditors arrive |

Also in the ≤120-day momentum set: Racers.io (7 159/day), Scribble Road (6 468), Football Cup (5 788), Obby Fish for
Egg (5 600, "sea monsters chase anyone carrying an egg — run back"), +1 Fish Every Second (5 203), BLEIHAGEL (4 802).

**Evergreen hot list (plays, rating):** Moto X3M 54.7 M / 9.1 (2018), Sky Riders 46.6 M / 9.0, PolyTrack 45.3 M / 8.9,
Tap-Tap Shots 40.3 M / 8.3 (2019), Table Tennis World Tour 31.6 M, 8 Ball Pool 24.5 M / 9.0, Drift Boss 22.5 M / 9.1
(2019), RocketGoal.io 21.3 M / 9.1, Golf Orbit 20.7 M / 9.2, Mini Golf Club 19.7 M, Stone Grass 16.7 M / 9.1, Jet Rush
10.2 M / 9.1 (2019), Horde Killer 8.3 M / 9.3, World's Hardest Game 8.5 M (Flash). Single-mechanic skill games from
2018–2019 are still on the hot list seven years later: the long tail on this platform is enormous.

## 2. What the data says (10 takeaways)

1. **Arcade is the home of hits**: #1 category on both hot and new lists. Single-verb, instantly readable games.
2. **HTML5 wins the new list**: 84 of 133 hot/new/recent games are HTML5. Build size and load time (conversion KPI:
   < 10 s, < 20 MB) favour lean canvas games.
3. **"Steal / grab and escape" is the single hottest mechanic on the platform right now** (Steal Eggs 113 K plays/day,
   Steal Dino Egg, Obby Fish for Egg, Steal a Brainrot / Steal an Egg at ~1 M concurrent on Roblox). The loop is
   *sneak → grab → get chased → escape → collection grows → income → upgrade*. On CrazyGames all of them are 3D Unity
   or multiplayer builds; **no 2D single-player HTML5 game owns this loop yet.**
4. **"Satisfying verb + incremental upgrades" produces the best ratings on the platform** (Shred the Evidence 9.7,
   Bills Must Be Paid 9.5, Crusher Clicker 9.4, TNT Voxel 9.3, Stone Grass 9.1, London Crane Operator 9.4). Ratings
   drive the `top-rated` labels and homepage placement.
5. **Incremental / Idle / Collect / Grow are the most common gameplay tags** (28 / 22 / 18 / 5): visible numbers going up
   is the retention engine the platform rewards; the official clicker guide reports ~15 min average play time.
6. **Push-your-luck and "+1" escalation are the 2026 hooks** (+1 Speed obbies, +1 Fish Every Second, +1 Weapon
   Evolution, Slice Master's "×4 or +60?", KABOOM's multiplier gates). Players love deciding how greedy to be.
7. **Rarity reveals are shareable** (eggs → pets, lucky blocks → creatures, Fish Orbit's legendary fish, Steal Eggs'
   rare pets). A collection with tiers gives both a viral moment and a long-term goal.
8. **Absurd, honest premises win attention** (Shred the Evidence, Bills Must Be Paid, Break The Noob Completely!,
   Escape from Chunga Changa; outside: "Needle in a Haystack" — 48 M views, 14 Roblox copies in 48 h, 9 Steam copies).
   The premise must be readable from the thumbnail and the title alone.
9. **Mobile is mandatory, "Both" orientations is the sweet spot** (52 of 133); portrait-only titles are mostly
   runners/puzzles. Joystick-drag or mouse-move controls dominate the momentum list.
10. **Leaderboards are a promotion channel** (sidebar, carousels, weekly seasons) but invite-only → design one clean
    "best run" metric from day one.

## 3. Thirty-six successful games, analysed

Format: **Genre / tech / plays / rating** · Hook · First 10 s · Core loop · Session · Progression · Social · Fail/rage ·
Mobile & controls · Why click / why 30 s / why 10 min / why return.

1. **Steal Eggs** — Arcade / Unity / 2.84 M in 25 days / 8.8. Hook: steal an egg from under a guard's nose. First 10 s:
   you walk into a nest zone, the guard spots you, chase. Loop: sneak → grab → run to base → hatch → pet income → buy
   access to richer nests. Session 10–20 min. Progression: pets with rarity tiers, base upgrades, speed. Social: none
   (single player with AI guards) yet still the fastest-growing game on the site. Fail: being caught drops the egg.
   Mobile: joystick + jump. Click: "Steal" + cute eggs + angry guard. 30 s: the first chase. 10 min: the first rare
   hatch. Return: idle income, missing rarities.
2. **Steal Dino Egg** — Arcade / Unity / 80 K in 7 days / 9.1. Same loop with dinosaurs and a park tycoon. Confirms the
   loop generalises beyond the Roblox brand.
3. **Obby Fish for Egg** — Arcade / HTML5 / 9.2. Fish eggs, "sea monsters chase anyone carrying an egg, run back".
   The chase-while-carrying tension is the shared core of all three.
4. **Coin Run** — Arcade / Unity / hot on day 1 / 9.0. Gate-runner with money multipliers; portrait; mouse left/right.
   Instantly readable numbers. Return: businesses meta.
5. **Real War: Not Fake** — Action / Unity / #1 hot / 8.5. Army gate-runner with gun gates. Big-numbers thumbnails.
6. **Count Masters** — Arcade / Unity / 65.5 M / 8.9 (CG Original). Crowd grows through gates, final castle fight.
   Growth fantasy; 5-minute fun tag.
7. **Boxity.io** — Arcade / HTML5 / 234 K in 6 days / 9.1. 3D obby with friends + incremental. Social obby meta.
8. **+1 Speed Keyboard Obby / Keyboard Obby: +1 Speed** — 712 K / 99 K. Every step = +1 speed; multipliers; races.
   The "+1" escalation and visible speed number are the hook.
9. **Turball.io** — .io / HTML5 / 104 K in 5 days / 9.5. Car soccer with flips/air roll. High skill ceiling; multiplayer.
10. **Draw Fly** — Puzzle / Unity / hot on day 1 / 9.2. Draw a path, a stickman flies it. Drawing = touch-native.
11. **Scribble Road** — Puzzle / HTML5 / 9.0 → 8.8. Draw a road on graph paper, press GO, 90 levels. Content-bound.
12. **London Crane Operator** — Simulation / HTML5 / 12.7 K day 1 / 9.4 (CG Original). Swinging-load physics jobs.
    Physics mastery + missions; the platform itself invests in physics simulators.
13. **Makeover Cleaning ASMR** — Simulation / HTML5 / 12.5 K/day / 9.0. Scrape dirt, restore objects, 25 levels. The
    "oddly satisfying" TikTok format as a game.
14. **Shred the Evidence** — Clicker / HTML5 / 9.7 after 3 days. Drag documents into a 1980s shredder before the
    auditors arrive at 6 AM. Tactile verb + deadline premise + incremental upgrades = highest rating on the platform.
15. **Bills Must Be Paid** — Arcade / Unity / 9.5. Smash piggy banks until your hand tires (stamina = run length), pay
    debts, upgrade. Short active-incremental runs with a story goal.
16. **Crusher Clicker** — Clicker / HTML5 / 8.5 M / 9.4 (CG Original). Hydraulic press on rocks and crystals; power /
    speed / gravity upgrades. Pure satisfaction loop.
17. **TNT Voxel** — Arcade / HTML5 / 246 K / 9.3. Place dynamite, press the plunger, bring castles below the red line.
    30 sites, 15 tools, "no timer, no game over" — destruction as a relaxing toy.
18. **Break The Noob Completely!** — Arcade / HTML5 / 9.5. Launch the Noob, control the flight, destruction, upgrades,
    skins. Confirms that launch/ragdoll games still work — the sibling project (Dummy Launch) covers this genre.
19. **KABOOM KINGDOMS** — Action / HTML5 / 9.1. Pull back, aim, fire rockets through multiplier gates at enemy
    castles. Aim + multiplier gates + castle destruction in 2D.
20. **Chicken Hell** — Arcade / Unity / 824 K / 8.9 (CG Original, leaderboard). One-button launch + boost, height
    record. Shows the platform's appetite for simple height/distance leaderboards.
21. **Fish Orbit** — Arcade / Unity / 4.46 M / 9.3 (CG Original, leaderboard). Cast the hook deeper, legendary fish
    unlock characters. Layered depth = long-term goal; rarity = reveal moments.
22. **+1 Fish Every Second** — Arcade / HTML5 / 9.0 → 8.5. School of fish grows +1/s, eat smaller numbers, flee bigger.
    Growth + numbers in 2D HTML5 with mouse-move controls.
23. **Stone Grass: Mowing Simulator** — Arcade / Unity / 16.7 M / 9.1 (CG Original). Mow, sell, upgrade speed/storage,
    unlock fields. Relaxing verb, visible numbers, "Both" orientation.
24. **Golf Orbit** — Sports / Unity / 20.7 M / 9.2. One click to shoot, reach Mars, upgrades. Launch + upgrades evergreen.
25. **Slice Master** — Arcade / HTML5 / 76 M / 8.6. One-button knife flips, "×4 or +60?" gate at the end of each level.
    The end-of-level multiplier choice is a push-your-luck micro-decision.
26. **Space Waves** — Arcade / Unity / 241 M / 8.8 (leaderboard, IAP). Hold to rise, release to fall; instant death and
    restart; difficulty faces per level; weekly leaderboard. One-button mastery at scale.
27. **Drift Boss** — Arcade / HTML5 / 22.5 M / 9.1 (2019, still hot). One click to drift; fall off = run over; coins →
    cars. Retry < 1 s. Seven-year-old evergreen.
28. **Tap-Tap Shots** — Arcade / HTML5 / 40 M / 8.3 (2019, hot desktop + mobile). Tap to bounce into hoops. Pure timing.
29. **Moto X3M** — Driving / HTML5 / 54.7 M / 9.1. 22 levels, 3-star timing, explosive fails. Level ladder + stars.
30. **PolyTrack** — Driving / HTML5 / 45.3 M / 8.9. Time trial + track editor + community tracks; 399 % YoY search
    growth in 2026. Shaving milliseconds + user content = infinite replay.
31. **Endless Waves Survival** — Action / HTML5 / 1.62 M / **9.7**. Horde-survival roguelite (CG Original): upgrades and
    abilities per level-up; "how long will you survive". Highest-rated single-player game on the platform.
32. **Stellar Swarm** — Action / HTML5 / 1.02 M / 9.4 (CG Original, leaderboard, portrait). Horde survival with branching
    skill trees, evolutions and permanent crystal upgrades between runs. Meta-progression keeps D1.
33. **Grimdark Survivors** — Arcade / HTML5 / 470 K / 9.3. Hero choice + weapons; roguelite build variety.
34. **Evil Tower** — Strategy / Unity / 1.06 M / 9.3 (CG Original). Idle tower defence with roguelike choices;
    "incremental economy and progression".
35. **The MachinEGG** — Clicker / HTML5 / 1.29 M / 9.3 (leaderboard, portrait). Chicken/egg automation, speedrun mode,
    weekly leaderboard, handicap challenges. Return: weekly ranking.
36. **Hexa Stack** — Puzzle / HTML5 / 902 K / 8.4 (leaderboard, IAP). Colour-sorting with "satisfying, ASMR-style
    feedback", thousands of levels. Sorting puzzles are saturated (2 000+ block puzzles launched in H1 2026).

Also reviewed: Who Dies Last? (ragdoll comedy 9.2), Ragdoll Archers (170 M, HTML5), Cubes 2048.io (54 M, snake × 2048
growth), Hole.io / Holey.io (eat and grow), Baseball For Brainrot (lucky-block rarity reveals 9.0), Dear Travellers
(co-op chaos 9.5), Unmatched Ego 2, Blombo.io, Cornerlet (cozy stickers 9.0), Rental Life (9.2), Zombie Lane,
Racers.io, Horde Killer: You vs 100 (9.3), Jet Rush, World's Hardest Game, 8 Ball Pool, Bloxorz, Sky Riders, Sprunki.

## 4. Mechanics that currently earn attention (ranked by evidence)

| Mechanic | Evidence on CrazyGames | Evidence outside | Feasible as lean 2D HTML5? |
|---|---|---|---|
| **Sneak, grab, get chased, escape** (steal meta) | Steal Eggs 113 K/day, Steal Dino Egg 9.1, Obby Fish for Egg 9.2 | Steal a Brainrot 68 B+ visits, Steal An Egg ~1 M concurrent (Roblox, Oct 2026) | **Yes — nobody has done it in 2D** |
| Push-your-luck / greed decision | Slice Master gates, KABOOM multipliers, Bills Must Be Paid stamina | "+1" meta, Needle-in-a-Haystack stakes | Yes |
| Satisfying verb + upgrades | Shred 9.7, Crusher 9.4, TNT Voxel 9.3, Stone Grass 9.1, Crane 9.4 | TikTok "oddly satisfying" / ASMR clips (Beauty Salon case: 2.5 M users in a day) | Yes |
| Rarity / collection reveal | Fish Orbit, Steal Eggs pets, Baseball for Brainrot, Lucky Brainrot Blocks | Roblox hatch/egg economy | Yes |
| Horde survival roguelite | Endless Waves 9.7, Stellar Swarm 9.4, Grimdark 9.3, Hero Merge Original | Vampire-Survivors-likes everywhere | Yes, content heavy |
| Gate-math runner | Coin Run, Real War #1 hot, Count Masters 65 M, Zombie Lane | hypercasual staple | 3D expected; crowded with Unity titles |
| One-button height / distance launch | Chicken Hell, Golf Orbit, Break the Noob 9.5, Rocket Fling | — | Yes — **but this is the sibling project's genre (Dummy Launch); excluded** |
| Draw-to-solve | Draw Fly hot day 1, Scribble Road | YouTube Playables #1 mechanic (draw-and-escape 394 K plays/day) | Yes, but level-content bound |
| Multiplayer obby / car soccer | Boxity.io, Turball.io, Blombo.io | Roblox | Needs servers; out of scope |
| Idle tycoon | Rental Life, Global Transport Tycoon, Leek Factory 9.4 | hybrid-casual growth +23 % H1 2026 | Yes, low virality |

## 5. First-10-seconds patterns of the winners

- The first screen *is* the gameplay (Steal Eggs, Drift Boss, Crusher Clicker, Space Waves): no menu, one line of text.
- A threat or a reward is visible immediately (the guard, the gate, the hoop).
- The first fail arrives within 20–40 s and costs nothing but a tap to retry.
- The first number goes up within 10 s (coins, speed, score).
- The first purchase is affordable after 1–2 runs; the first "new place / new thing" after 3–5 minutes.

## 6. Trends outside the platform (October 2026)

- **Roblox** (RoWatcher, 14 Oct 2026): Steal An Egg ~986 K concurrent, Steal a Brainrot ~101 K, Break and Steal an Egg
  ~100 K; brainrot-style collection and "steal" loops dominate; fishing wave (Fish It!, Hooked! +9 019 % in March);
  +1 Speed keyboard obbies; survival (99 Nights in the Forest).
- **Needle in a Haystack** (Aug–Sep 2026): a one-sentence absurd premise with real stakes got 48 M views, 14 Roblox copies
  in 48 h and 9 Steam copies — proof that premise clarity is the viral asset, not technology.
- **Hybrid-casual** (Sensor Tower via industry blogs): a hypercasual-simple hook plus progression, collections and a
  difficulty curve; hybrid-casual top titles beat casual on D7 retention; sort/merge puzzles are saturated.
- **YouTube Playables** (Sep–Oct 2026): catalogue doubled to 1 477 titles; top mechanics draw-and-escape puzzles,
  Tall Man Run (109 M plays), Snake Clash, Stealth Master — one-input, growth, stealth.
- **Poki**: Drive Mad, Subway Surfers, Level Devil, Hole.io keep topping lists — physics, one-input, eat-and-grow.
- **TikTok / Shorts**: discovery through 15-second clips of a game's *core loop* (physics accidents, satisfying
  tasks); ASMR sound and visuals carry; a single clip can trigger immediate play.
- **Search**: PolyTrack +399 % YoY (823 K monthly searches), Spacebar Clicker 301 K, Block Blast #1 download.

## 7. Gaps and the opportunity

1. The hottest loop on the platform (steal → chase → escape → collect) exists only as 3D Unity / Roblox-style builds
   with joystick + jump controls, 20–60 MB downloads and no leaderboard metric. A **2D, sub-300 KB HTML5** version with
   a single clear premise, 30–90 s runs, push-your-luck tension, rarity reveals and a one-number "best haul" leaderboard
   metric fills a real gap.
2. None of the steal games has a **readable, timeless premise** behind the mechanic — they borrow the Roblox brand
   ("Steal a …", "Brainrot"). A folklore-level premise everyone already knows ("don't wake the sleeping dragon on its
   hoard") makes the thumbnail and the title do the explaining and avoids the IP risk of meme characters.
3. The top-rated HTML5 games share "tactile satisfaction + a deadline/stakes premise" (Shred the Evidence); combining
   that satisfaction (coins vacuumed into a bag, bag bulging, gold piles shrinking) with a chase gives both the rating
   driver and the virality driver in one loop.
4. The sibling project already covers one-button launch/ragdoll distance; the new game must be a different genre
   (stealth-arcade / push-your-luck heist) so the two do not cannibalise each other.
