# STORE PAGE — Don't Wake the Dragon

Everything below is ready to paste into the CrazyGames Developer Portal submission form.

## GAME TITLE

**Don't Wake the Dragon**

## SHORT DESCRIPTION

Sneak over a sleeping dragon's hoard, grab as much gold as you dare, and tiptoe out before it wakes. Every step
clinks. One more pile?

## LONG DESCRIPTION

Don't Wake the Dragon is a push-your-luck treasure heist. You are a tiny thief standing in a cave full of gold —
and a very large dragon is sleeping right on top of it.

Every coin you grab makes noise. Every step you take makes noise. Heavy bags clink louder. The **Wake meter** shows
how close the dragon is to opening its eyes: stand still and it sinks back into deep sleep, run and it rises fast.
Snoring is your friend — while the dragon snores loudly, your footsteps are covered. Learn the rhythm, move on the
snore, freeze in the silence.

The exit tunnel is always open. Leave early with a few coins, or push deeper towards the dragon's head where the gems
and the rare artefacts lie. Take too much and the dragon's sleep gets lighter and lighter… until it **roars**, chases
you across the cave and breathes fire. Make it to the tunnel and you keep everything — with a Close Call bonus.
Get caught and the bag is gone.

Bank your haul and spend it on Quiet Boots, a Big Bag, Fast Legs, a Gold Magnet, a Lucky Charm and the Lullaby — a
once-per-heist hum that calms the dragon. Unlock four lairs with four dragons: the mossy cave of Grumble the Green,
the Frozen Hollow with its slippery ice, the Ember Pit where lava pools burn, and the Royal Vault with pressure plates
that ring a bell. Each hoard hides eight artefacts in five rarity tiers — fill the Hoard Museum to unlock new thief
skins. Play the Daily Heist for a seeded lair that is the same for everyone and chase your best haul.

Thirty-second heists. One-tap retry. One more pile.

## HOW TO PLAY

- Move to start. Walk over coins to collect them, stand on an artefact for a moment to grab it.
- Watch the Wake meter under the dragon face. Moving fast and grabbing loot pushes it up; standing still lets it fall.
- Move while the dragon snores (the "zzz" halo) — the snoring hides your steps.
- When the bag is full or the meter is high, head for the tunnel at the bottom.
- If the dragon wakes: RUN to the tunnel. Rocks block its fire. Escape with everything and earn a Close Call bonus.
- Spend gold in the Shop, unlock new lairs, complete the Hoard Museum, beat your best haul.

## CONTROLS

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD / arrow keys / ZQSD, or click-drag anywhere | Drag anywhere (virtual joystick) |
| Sneak | Hold Shift (or move the mouse only a little) | Small drags |
| Lullaby (after upgrading) | E or Space | Blue Lullaby button |
| Pause | P or the pause button | Pause button |

Controls text for the portal field:
"Desktop: WASD / arrow keys or drag the mouse to move, hold Shift to sneak, E = Lullaby, P = pause.
Mobile: drag anywhere to move — small drags are quiet, big drags are fast. Tap the Lullaby button to calm the dragon."

## TAGS / CATEGORY

- **Category:** Arcade
- **Tags:** Stealth, Dragon, Treasure, Collect, Incremental, Skill, Avoid, 2D, Top-Down, Casual, 5-minute fun,
  One Player, Mobile, Relaxing (sneak) / Adrenaline (chase), Upgrade, Leaderboards-ready (best haul)
- **Orientation:** both (landscape and portrait)
- **Mobile:** yes (iOS + Android, works in the CrazyGames app with safe-area padding)
- **Multiplayer:** no
- **Progress save:** yes — CrazyGames SDK Data module (tick "Progress Save" in the form)
- **PEGI 12:** cartoon dragon, no blood, no text beyond the game's own copy

## THUMBNAIL BRIEF

Rendered from the game's own art by `scripts/render-covers.mjs` → `marketing/cover-16x9.png` (1920×1080),
`marketing/cover-2x3.png` (800×1200), `marketing/cover-1x1.png` (800×800).

- One focus: the thief tiptoeing away with a bulging sack while the dragon, lying on its gold, has **one eye half
  open** and looks straight at him. A sweat drop on the thief, a glowing legendary orb by the paw.
- Only the title as text, two stacked lines in the game's display font with a gold gradient and dark outline.
- Warm gold against dark cave teal: the silhouette reads at 200 px. No borders, no logos, no "Play".
- Honest: this exact moment (meter at 50 %, eye half open) happens in every heist.

## SCREENSHOT PLAN

1. Ready state, landscape: the full lair with the title overlay (`docs/test-evidence/ready-1216x684.png`).
2. Mid-heist, meter at "STIRRING", thief near the gems (`docs/test-evidence/play-greedy-run1-mobile.png`).
3. Wake moment: "ROAR!", red vignette, fire breath, "RUN!" arrow (`docs/test-evidence/ui/awake-vault.png`).
4. Result screen "CLOSE CALL!" with a NEW artefact reveal (`docs/test-evidence/result-kamikaze-run1.png`).
5. Shop with upgrades and the four lairs (`docs/test-evidence/ui/shop-lairs.png`).
6. Hoard Museum grid (`docs/test-evidence/ui/museum.png`).

## PREVIEW VIDEOS

`scripts/record-previews.mjs` records both required videos from a scripted heist (sneak → stir → roar → chase →
close-call escape → result): `marketing/preview-landscape.mp4` (1920×1080) and `marketing/preview-portrait.mp4`
(1080×1620, 2:3). Silent, 19 s, first frame = the static cover, no black frames, no cursor, no promo text.

## FEATURE LIST

- Push-your-luck heists of 30–90 seconds with one-tap retry
- A Wake meter driven by footsteps, loot clinks, bag weight, greed and time; snoring masks your steps
- Dragon wake-up with telegraphed fire breath, burning ground and a chase that rocks block
- Six upgrades, four lairs with four dragons and gimmicks (bones, ice, lava, pressure plates)
- 32 artefacts in five rarity tiers, Hoard Museum, six thief skins, 17 milestones
- Daily Heist with a seeded lair shared by all players
- Close Call bonus, best haul per lair (leaderboard-ready single metric)
- CrazyGames SDK v3: cloud save, gameplay events, midgame + rewarded ads (Keep loot, Double haul), platform mute
- Desktop + mobile, both orientations, 60 fps canvas, < 200 KB download, no external assets
