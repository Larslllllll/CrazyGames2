import { AudioEngine } from "./audio/audio";
import { Music } from "./audio/music";
import { Sfx } from "./audio/sfx";
import { Viewport } from "./core/canvas";
import { Input, type MoveInput } from "./core/input";
import { Loop } from "./core/loop";
import { clamp01, dist, len } from "./core/math";
import { randomSeed } from "./core/rng";
import { SaveStore } from "./core/save";
import { Particles } from "./entities/particles";
import { Popups } from "./entities/popups";
import { generateLair } from "./gameplay/lair";
import { Run, type RunResult } from "./gameplay/run";
import type { ThiefStats } from "./gameplay/thief";
import type { LairLayout } from "./gameplay/types";
import { ARTEFACTS, artefactsOf } from "./progression/collection";
import { dailyKey, dailyLair, dailySeed } from "./progression/daily";
import { LAIRS, lairById, type LairDef } from "./progression/lairs";
import { checkMilestones, completionPercent, MILESTONES, SKINS, skinById } from "./progression/milestones";
import { defaultProfile, parseProfile, PROFILE_KEY, type Profile } from "./progression/profile";
import { bagCapacity, charmMult, lullabyAmount, magnetRadius, speedMult, stepNoiseMult, upgradeById, upgradeCost, UPGRADES, type UpgradeId } from "./progression/upgrades";
import { PERF, Renderer } from "./render/renderer";
import { CrazySdk, type SdkUser } from "./sdk/crazygames";
import { Juice } from "./systems/juice";
import { Ui, type ResultView } from "./ui/ui";

const BASE_SPEED = 230;
const MIDGAME_MIN_PLAY = 180; // seconds of play before the first midgame ad (D1 protection)
const KEEP_OFFER_SECONDS = 5;

export class Game {
  readonly vp: Viewport;
  readonly input: Input;
  readonly loop: Loop;
  readonly renderer: Renderer;
  readonly particles = new Particles();
  readonly popups = new Popups();
  readonly juice = new Juice();
  readonly audio = new AudioEngine();
  readonly sfx: Sfx;
  readonly music: Music;
  readonly sdk = new CrazySdk();
  readonly save = new SaveStore();
  readonly ui: Ui;
  profile: Profile = defaultProfile();
  run: Run | null = null;
  private layoutSeed = randomSeed();
  private daily = false;
  private paused = false;
  private screenReturn: "lair" | "result" | null = null;
  private pendingResult: RunResult | null = null;
  private pendingView: ResultView | null = null;
  private time = 0;
  private sessionPlay = 0;
  private runsThisSession = 0;
  private keepUsed = false;
  private escapesSinceDouble = 0;
  private offerThisBreak = false;
  private adInProgress = false;
  private user: SdkUser | null = null;
  private adblock = false;
  private showExitHint = true;
  private resultTimer = 0;
  private cameraSnap = true;
  lastFrameMs = 0;
  lastUpdateMs = 0;
  private sessionHints = new Set<string>();
  /** Test hook: when set, replaces the player's input (never on crazygames.com). */
  inputOverride: MoveInput | null = null;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.vp = new Viewport(canvas);
    this.input = new Input(canvas);
    this.renderer = new Renderer(this.vp);
    this.sfx = new Sfx(this.audio);
    this.music = new Music(this.audio);
    this.loop = new Loop(
      (dt) => this.update(dt),
      (_a, frame) => this.render(frame),
    );
    this.ui = new Ui(uiRoot, {
      nextHeist: () => void this.nextHeist(),
      home: () => this.closeScreen(),
      openShop: () => this.openShop(),
      openMuseum: () => this.openMuseum(),
      openSettings: () => this.openSettings(),
      closeScreen: () => this.closeScreen(),
      buy: (id) => this.buy(id),
      selectLair: (id) => this.selectLair(id),
      unlockLair: (id) => this.unlockLair(id),
      selectSkin: (id) => this.selectSkin(id),
      pause: () => this.pause(),
      resume: () => this.resume(),
      restart: () => this.restart(),
      toggleSound: () => this.toggleAudio("sound"),
      toggleMusic: () => this.toggleAudio("music"),
      resetProgress: () => this.resetProgress(),
      rewarded: (kind) => void this.rewarded(kind),
      skipOffer: () => void this.nextHeist(),
      daily: () => this.startDaily(),
      lullaby: () => this.run?.useLullaby(),
      uiClick: () => this.sfx.click(),
    });
  }

  // --- boot ----------------------------------------------------------------------------------
  async boot(): Promise<void> {
    this.audio.unlockOnGesture();
    await this.sdk.init();
    this.sdk.loadingStart();
    this.save.setBackend(this.sdk.dataStorage());
    this.profile = parseProfile(this.save.get(PROFILE_KEY));
    this.audio.setUser(this.profile.settings.sound, this.profile.settings.music);
    this.audio.setPlatformMuted(this.sdk.muteAudio);
    this.sdk.onSettingsChange((s) => {
      if (typeof s.muteAudio === "boolean") this.audio.setPlatformMuted(s.muteAudio);
    });
    const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
    [this.user, this.adblock] = await Promise.all([withTimeout(this.sdk.getUser(), 2500, null), withTimeout(this.sdk.hasAdblock(), 2500, false)]);
    this.sdk.onAuth(() => void this.sdk.getUser().then((u) => (this.user = u)));
    this.newRun(false);
    this.loop.start();
    this.sdk.loadingStop();
    this.sdk.reportProgress(completionPercent(this.profile));
    document.getElementById("boot")?.classList.add("hide");
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.run?.phase === "play" && !this.paused && !this.ui.current) this.pause(false);
    });
  }

  // --- runs ------------------------------------------------------------------------------------
  private stats(): ThiefStats {
    const u = this.profile.upgrades;
    return {
      maxSpeed: BASE_SPEED * speedMult(u.legs),
      stepNoise: stepNoiseMult(u.boots),
      capacity: bagCapacity(u.bag),
      magnet: magnetRadius(u.magnet),
    };
  }

  private currentLair(): LairDef {
    return this.daily ? dailyLair() : lairById(this.profile.lair);
  }

  newRun(daily: boolean, keepSeed = false): void {
    this.daily = daily;
    if (!keepSeed) this.layoutSeed = daily ? dailySeed() : randomSeed();
    const def = this.currentLair();
    const layout: LairLayout = generateLair(def, this.layoutSeed, daily, {
      charmMult: charmMult(this.profile.upgrades.charm),
      museum: this.profile.museum,
      maxRarity: this.profile.runs < 3 ? 2 : 4,
    });
    this.run = new Run(layout, this.stats(), this.profile.upgrades.lullaby, lullabyAmount(this.profile.upgrades.lullaby));
    this.wire(this.run);
    this.particles.clear();
    this.popups.clear();
    this.juice.vignetteTarget = 0;
    this.juice.trauma = 0;
    this.pendingResult = null;
    this.pendingView = null;
    this.paused = false;
    this.offerThisBreak = false;
    this.showExitHint = true;
    this.cameraSnap = true;
    this.ui.closeAll();
    this.ui.setHudVisible(true);
    this.music.start();
    this.music.setMode("sneak");
    this.music.tension = 0;
    const first = this.profile.runs === 0;
    const touch = this.input.touchDevice || (this.sdk.systemInfo()?.device ?? "desktop") !== "desktop";
    this.ui.showReady(
      first ? "Grab the gold. Sneak out. Don't wake it." : daily ? `Daily heist · ${def.name} · ${def.dragonName}` : `${def.name} · ${def.dragonName}`,
      touch ? "Drag anywhere to move · small drags = sneak" : "WASD / arrows or drag to move · hold Shift to sneak",
    );
    this.ui.setMenubar(true, this.profile.daily.key === dailyKey() && this.profile.daily.played, this.profile.daily.best);
    this.sdk.setContext({ lair: def.id, daily: daily ? 1 : 0, runs: this.profile.runs });
    this.input.clearPressed();
  }

  private wire(run: Run): void {
    const ev = run.events;
    const t = run.thief;
    const d = run.dragon;
    const p = run.layout.def.palette;
    ev.on("start", () => {
      this.ui.hideReady();
      this.ui.setMenubar(false, false, 0);
      this.sdk.gameplayStart();
      this.runsThisSession++;
      this.hintOnce("snore", "Loud snoring hides your steps. Move on the snore!", 3.2);
    });
    ev.on("pickup", ({ item }) => {
      this.showExitHint = false;
      const col = item.kind === "gem" ? ["#5fe0a0", "#5fb0ff", "#ff5f7a"][item.tier] : "#ffe066";
      this.particles.emit("coin", t.x, t.y, { count: item.kind === "coin" ? 3 : 6, speed: 90, life: 0.45, size: 4, color: col, grav: 120 });
      if (item.kind === "coin" || item.kind === "bigcoin") this.sfx.coin(item.kind);
      else if (item.kind === "gem") this.sfx.gem();
      if (item.kind === "artefact" && item.artefact) {
        this.sfx.artefact(item.artefact.rarity);
        this.juice.punch(0.6);
        this.juice.addTrauma(0.15);
        this.popups.add(item.artefact.name, t.x, t.y - 40, "#ffffff", 22, 1.3);
        this.particles.emit("spark", t.x, t.y, { count: 18, speed: 220, life: 0.5, color: "#ffffff" });
      }
      if (item.kind !== "coin") this.popups.add(`+${item.value}`, t.x + 18, t.y - 22, col, item.kind === "artefact" ? 30 : 22);
      else if (this.profile.runs === 0 && run.coins === 3) this.hintOnce("noise", "Every coin clinks. Watch the meter!", 2.5);
    });
    ev.on("grabStart", () => {
      this.sfx.grab();
      this.hintOnce("grab", "Stand on an artefact to grab it", 2.2);
    });
    ev.on("bagfull", () => {
      this.sfx.bagFull();
      this.popups.add("BAG FULL", t.x, t.y - 36, "#ff8a5a", 24, 1.1);
      this.hintOnce("bagfull", "Bag full. Head for the exit!", 2.6);
      this.showExitHint = true;
    });
    ev.on("stage", (s) => {
      if (s === 1) {
        this.sfx.stir();
        this.juice.addTrauma(0.12);
        this.hintOnce("stage1", "It's stirring… stand still to calm it", 2.8);
      } else if (s === 2) {
        this.sfx.growl();
        this.juice.addTrauma(0.3);
        this.juice.vignetteTarget = 1;
        this.hintOnce("stage2", "Freeze or run for the exit!", 2.6);
      } else {
        this.juice.vignetteTarget = 0;
      }
      if (s < 2) this.juice.vignetteTarget = 0;
    });
    ev.on("wake", () => {
      this.sfx.roar();
      this.juice.slow(0.2, 0.9);
      this.juice.addTrauma(1);
      this.juice.flash("#ff4a2a", 0.45);
      this.juice.vignetteTarget = 1;
      this.music.setMode("chase");
      const m = d.mouth();
      this.particles.emit("smoke", m.x, m.y, { count: 20, speed: 120, life: 1.2, size: 14, color: "#555" });
      this.particles.emit("fire", m.x, m.y + 10, { count: 24, speed: 200, life: 0.6, size: 9, color: "#ff8a2a" });
      this.popups.add("ROAR!", d.x, d.y - 120, "#ff6a4d", 44, 1.2);
      this.ui.hint("RUN!", 2);
      this.showExitHint = true;
    });
    ev.on("telegraph", () => {
      this.sfx.inhale();
      this.juice.addTrauma(0.12);
    });
    ev.on("fire", () => {
      this.sfx.fire();
      this.juice.addTrauma(0.45);
      this.juice.flash("#ffb13b", 0.18);
    });
    ev.on("snore", () => {
      if (d.state !== "asleep") return;
      const m = d.mouth();
      this.particles.emit("z", m.x + (Math.random() - 0.5) * 30, m.y - 10, { count: 2, speed: 25, vy: -45, life: 1.6, size: 24, color: "#dff3ff", spread: 10, drag: 0.5 });
      this.particles.emit("smoke", m.x - 18, m.y + 24, { count: 2, speed: 20, vy: 20, life: 1, size: 8, color: "#9aa" });
      this.particles.emit("smoke", m.x + 18, m.y + 24, { count: 2, speed: 20, vy: 20, life: 1, size: 8, color: "#9aa" });
      this.sfx.snore();
    });
    ev.on("step", ({ x, y, speed }) => {
      if (speed > 0.35) this.particles.emit("dust", x, y + 10, { count: 1, speed: 20, life: 0.5, size: 5, color: p.floor === "#56708a" ? "#dff3ff" : "#c9b88a" });
      this.sfx.step(speed, t.sneaking);
    });
    ev.on("bump", ({ x, y, kind, speed }) => {
      this.sfx.bump(kind, speed);
      this.juice.addTrauma(kind === "bone" || kind === "dragon" ? 0.22 : 0.1);
      this.particles.emit(kind === "bone" ? "spark" : "dust", x, y, { count: 6, speed: 120, life: 0.4, color: kind === "bone" ? "#efe8d6" : "#b9ad95" });
      if (kind === "bone") this.popups.add("CLATTER!", x, y - 24, "#efe8d6", 20, 0.8);
      if (kind === "dragon") this.popups.add("OOF", x, y - 24, "#ff8a5a", 20, 0.8);
    });
    ev.on("plate", ({ x, y }) => {
      this.sfx.plate();
      this.juice.addTrauma(0.2);
      this.particles.emit("ring", x, y, { count: 1, speed: 0, life: 0.8, size: 40, color: "#fff3b0" });
      this.popups.add("DING!", x, y - 30, "#fff3b0", 24, 0.9);
    });
    ev.on("lullaby", (n) => {
      this.sfx.lullaby();
      this.particles.emit("z", d.x, d.y - 60, { count: 6, speed: 40, vy: -40, life: 1.8, size: 22, color: "#9fd0ff", spread: 50, drag: 0.5 });
      this.particles.emit("ring", t.x, t.y, { count: 1, speed: 0, life: 0.9, size: 60, color: "#9fd0ff" });
      this.popups.add(`Shhh… -${n}`, t.x, t.y - 40, "#dff3ff", 24, 1.1);
    });
    ev.on("lullabyFail", () => this.sfx.lullabyFail());
    ev.on("ice", (s) => {
      if (s) this.sfx.ice();
    });
    ev.on("end", (r) => this.onRunEnd(r));
  }

  private hintOnce(key: string, text: string, seconds: number): void {
    if (this.profile.hints[key] || this.sessionHints.has(key)) return;
    this.sessionHints.add(key);
    this.profile.hints[key] = true;
    this.ui.hint(text, seconds);
  }

  private onRunEnd(r: RunResult): void {
    const t = this.run!.thief;
    const d = this.run!.dragon;
    this.sdk.gameplayStop();
    this.juice.vignetteTarget = 0;
    const pr = this.profile;
    pr.runs++;
    pr.playSeconds += r.time;
    this.sessionPlay += r.time;
    const milestones: { name: string; reward: number }[] = [];
    let newRecord = false;
    const newArtefacts: string[] = [];
    if (r.phase === "escaped") {
      pr.gold += r.haul;
      pr.totalGold += r.haul;
      pr.escapes++;
      if (r.closeCall) pr.closeCalls++;
      for (const it of r.artefacts) {
        const id = it.artefact!.id;
        if (!pr.museum.includes(id)) {
          pr.museum.push(id);
          newArtefacts.push(id);
        }
      }
      if (r.daily) {
        if (pr.daily.key !== dailyKey()) pr.daily = { key: dailyKey(), played: true, best: 0 };
        pr.daily.played = true;
        if (r.haul > pr.daily.best) pr.daily.best = r.haul;
      }
      const prevBest = pr.bestHaul;
      if (r.haul > pr.bestHaul) {
        pr.bestHaul = r.haul;
        newRecord = prevBest > 0;
      }
      if (r.haul > (pr.bestHaulByLair[r.lair.id] ?? 0)) pr.bestHaulByLair[r.lair.id] = r.haul;
      this.escapesSinceDouble++;
      if (r.closeCall) {
        this.sfx.closeCall();
        this.popups.add("CLOSE CALL! +20%", t.x, t.y - 50, "#7fe08a", 30, 1.4);
      } else this.sfx.escape();
      this.particles.emit("confetti", t.x, t.y - 20, { count: 40, speed: 260, life: 1.4, size: 6, color: "#ffe066", grav: 300 });
      this.particles.emit("confetti", t.x, t.y - 20, { count: 20, speed: 260, life: 1.4, size: 6, color: "#7fe08a", grav: 300 });
      this.juice.punch(0.8);
      if (newRecord && r.haul >= 500) this.sdk.happytime();
      if (r.artefacts.some((a) => a.artefact!.rarity === 4) && newArtefacts.length) this.sdk.happytime();
    } else {
      pr.caught++;
      this.sfx.caught();
      this.juice.addTrauma(0.8);
      this.juice.slow(0.3, 0.6);
      this.juice.flash(r.cause === "lava" ? "#ff8a2a" : "#ff4a2a", 0.4);
      this.particles.emit("smoke", t.x, t.y, { count: 16, speed: 90, life: 1, size: 12, color: "#444" });
      this.popups.add(r.cause === "lava" ? "OUCH!" : "CAUGHT!", t.x, t.y - 40, "#ff6a4d", 36, 1.3);
    }
    for (const m of checkMilestones(pr)) {
      milestones.push({ name: m.name, reward: m.reward });
      if (m.skin) this.ui.toast(`${m.name}`, `Skin unlocked: ${skinById(m.skin).name}`);
    }
    this.sdk.reportProgress(completionPercent(pr));
    this.persist();
    const offer: ResultView["offer"] =
      r.phase === "escaped"
        ? this.sdk.active && !this.adblock && r.haul >= 30 && this.escapesSinceDouble >= 3 && r.cause !== "sneeze"
          ? "double"
          : "none"
        : this.sdk.active && !this.adblock && !this.keepUsed && t.bagValue >= 25
          ? "keep"
          : "none";
    const dragonName = r.lair.dragonName.split(" ")[0];
    const subtitle =
      r.phase === "escaped"
        ? r.cause === "sneeze"
          ? `${dragonName} sneezed you out of the lair. With the bag!`
          : r.closeCall
            ? `You slipped past ${dragonName} by a whisker.`
            : r.takenFraction > 0.5
              ? `Half the hoard, and it never noticed. Legendary.`
              : `${dragonName} slept through the whole thing.`
        : r.cause === "lava"
          ? "The lava got you. The bag is gone."
          : r.cause === "fire"
            ? `${dragonName} roasted you. The bag is ash.`
            : `${dragonName} snatched your bag and went back to sleep.`;
    this.pendingResult = r;
    this.pendingView = {
      escaped: r.phase === "escaped",
      title: r.phase === "escaped" ? (r.closeCall ? "CLOSE CALL!" : "ESCAPED!") : "CAUGHT!",
      subtitle,
      haul: r.haul,
      baseHaul: r.baseHaul,
      bonus: r.bonus,
      lostHaul: t.bagValue,
      coins: r.coins,
      gems: r.gems,
      artefacts: r.artefacts.map((a) => ({ def: a.artefact!, isNew: newArtefacts.includes(a.artefact!.id) })),
      newRecord,
      daily: r.daily,
      offer,
      offerSeconds: KEEP_OFFER_SECONDS,
      milestones,
    };
    this.offerThisBreak = offer !== "none";
    this.resultTimer = r.phase === "escaped" ? 0.7 : 1.1;
    void d;
  }

  private showPendingResult(): void {
    if (!this.pendingView) return;
    this.ui.setMenubar(false, false, 0);
    this.ui.showResult(this.pendingView);
    this.music.setMode("menu");
    this.screenReturn = null;
    if (this.pendingView.newRecord) this.sfx.record();
    for (const a of this.pendingView.artefacts) if (a.isNew) this.sfx.reveal(a.def.rarity);
  }

  private async nextHeist(): Promise<void> {
    if (this.adInProgress) return;
    const wantAd =
      this.sdk.active && !this.offerThisBreak && this.sessionPlay >= MIDGAME_MIN_PLAY && this.runsThisSession >= 2;
    if (wantAd) {
      this.adInProgress = true;
      this.ui.showAd(true);
      await this.sdk.requestAd("midgame", { onStarted: () => this.audio.setAdMuted(true) });
      this.audio.setAdMuted(false);
      this.ui.showAd(false);
      this.adInProgress = false;
    }
    this.newRun(this.daily);
  }

  private async rewarded(kind: "double" | "keep"): Promise<void> {
    if (this.adInProgress || !this.pendingResult) return;
    this.adInProgress = true;
    this.ui.freezeOffer();
    this.ui.showAd(true);
    const outcome = await this.sdk.requestAd("rewarded", { onStarted: () => this.audio.setAdMuted(true) });
    this.audio.setAdMuted(false);
    this.ui.showAd(false);
    this.adInProgress = false;
    const r = this.pendingResult;
    if (!outcome.finished) {
      this.ui.toast("No ad available", "Try again later");
      this.ui.resultOfferDone("");
      return;
    }
    if (kind === "double") {
      this.escapesSinceDouble = 0;
      this.profile.gold += r.haul;
      this.profile.totalGold += r.haul;
      this.sfx.buy();
      this.ui.toast("Haul doubled!", `+${r.haul} gold`);
      this.ui.resultOfferDone(String(r.haul * 2));
    } else {
      this.keepUsed = true;
      const kept = this.run?.thief.bagValue ?? 0;
      this.profile.gold += kept;
      this.profile.totalGold += kept;
      for (const it of r.artefacts) {
        const id = it.artefact!.id;
        if (!this.profile.museum.includes(id)) this.profile.museum.push(id);
      }
      this.sfx.escape();
      this.ui.toast("Achoo!", `The dragon sneezed. You kept ${kept} gold`);
      this.ui.resultOfferDone(String(kept));
    }
    for (const m of checkMilestones(this.profile)) this.ui.toast(m.name, `+${m.reward} gold`);
    this.persist();
  }

  // --- screens & navigation ---------------------------------------------------------------
  private canOpenScreen(): boolean {
    return !this.adInProgress;
  }

  private beforeScreen(): void {
    if (this.run?.phase === "play" && !this.paused) {
      this.paused = true;
      this.sdk.gameplayStop();
      this.screenReturn = "lair";
    } else if (this.ui.current === "result" || this.pendingView) {
      this.screenReturn = "result";
    } else {
      this.screenReturn = "lair";
    }
  }

  private openShop(tab?: "upgrades" | "lairs" | "skins"): void {
    if (!this.canOpenScreen()) return;
    this.beforeScreen();
    const pr = this.profile;
    this.ui.showShop(
      {
        gold: pr.gold,
        upgrades: UPGRADES.map((u) => {
          const level = pr.upgrades[u.id];
          const cost = upgradeCost(u, level);
          return {
            id: u.id,
            name: u.name,
            blurb: u.blurb,
            level,
            max: u.maxLevel,
            cost,
            canAfford: pr.gold >= cost,
            effectNow: u.effect(level),
            effectNext: u.effect(Math.min(u.maxLevel, level + 1)),
          };
        }),
        lairs: LAIRS.map((l) => ({
          id: l.id,
          name: l.name,
          dragonName: l.dragonName,
          blurb: l.blurb,
          color: l.palette.dragon,
          colorDark: l.palette.dragonDark,
          unlocked: pr.unlocked.includes(l.id),
          cost: l.unlockCost,
          canAfford: pr.gold >= l.unlockCost,
          selected: pr.lair === l.id && !this.daily,
          best: pr.bestHaulByLair[l.id] ?? 0,
        })),
        skins: SKINS.map((s) => ({
          def: s,
          owned: pr.skins.includes(s.id),
          selected: pr.skin === s.id,
          hint: MILESTONES.find((m) => m.skin === s.id)?.blurb ?? "",
        })),
      },
      tab,
    );
  }

  private openMuseum(): void {
    if (!this.canOpenScreen()) return;
    this.beforeScreen();
    const pr = this.profile;
    this.ui.showMuseum({
      lairs: LAIRS.map((l) => ({ id: l.id, name: `${l.name} · ${l.dragonName}`, items: artefactsOf(l.id).map((def) => ({ def, have: pr.museum.includes(def.id) })) })),
      total: ARTEFACTS.length,
      found: pr.museum.length,
    });
  }

  private openSettings(): void {
    if (!this.canOpenScreen()) return;
    this.beforeScreen();
    const pr = this.profile;
    this.ui.showSettings({
      sound: pr.settings.sound,
      music: pr.settings.music,
      user: this.user,
      stats: { runs: pr.runs, escapes: pr.escapes, caught: pr.caught, bestHaul: pr.bestHaul, totalGold: pr.totalGold },
      env: this.sdk.env,
    });
  }

  private closeScreen(): void {
    const ret = this.screenReturn;
    this.ui.closeAll();
    this.screenReturn = null;
    if (ret === "result" && this.pendingView) {
      this.showPendingResult();
      return;
    }
    if (this.paused && this.run?.phase === "play") {
      this.paused = false;
      this.sdk.gameplayStart();
      this.input.clearPressed();
      return;
    }
    if (this.pendingView) {
      this.showPendingResult();
      return;
    }
    this.ui.setMenubar(true, this.profile.daily.key === dailyKey() && this.profile.daily.played, this.profile.daily.best);
  }

  private pause(notifySdk = true): void {
    if (!this.run || this.run.phase !== "play" || this.paused || this.ui.current) return;
    this.paused = true;
    if (notifySdk) this.sdk.gameplayStop();
    this.music.setMode("menu");
    this.ui.showPause(this.profile.settings.sound, this.profile.settings.music);
  }

  private resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.ui.closeAll();
    this.sdk.gameplayStart();
    this.music.setMode(this.run?.dragon.state === "awake" ? "chase" : "sneak");
    this.input.clearPressed();
  }

  private restart(): void {
    this.paused = false;
    this.ui.closeAll();
    this.newRun(this.daily);
  }

  private startDaily(): void {
    if (this.run?.phase === "play") return;
    this.newRun(true);
  }

  private buy(id: UpgradeId): void {
    const def = upgradeById(id);
    const pr = this.profile;
    const level = pr.upgrades[id];
    const cost = upgradeCost(def, level);
    if (level >= def.maxLevel || pr.gold < cost) {
      this.sfx.deny();
      return;
    }
    pr.gold -= cost;
    pr.upgrades[id] = level + 1;
    this.sfx.buy();
    this.persist();
    if (this.run && this.run.phase === "ready") this.newRun(this.daily, true);
    this.openShop("upgrades");
  }

  private selectLair(id: string): void {
    if (!this.profile.unlocked.includes(id)) return;
    this.profile.lair = id;
    this.persist();
    this.sfx.click();
    this.pendingView = null;
    this.pendingResult = null;
    this.screenReturn = null;
    this.newRun(false);
  }

  private unlockLair(id: string): void {
    const def = lairById(id);
    const pr = this.profile;
    if (pr.unlocked.includes(id)) return;
    if (pr.gold < def.unlockCost) {
      this.sfx.deny();
      this.ui.toast("Not enough gold", `${def.name} needs ${def.unlockCost} gold`);
      return;
    }
    pr.gold -= def.unlockCost;
    pr.unlocked.push(id);
    pr.lair = id;
    this.sfx.unlock();
    this.sdk.happytime();
    for (const m of checkMilestones(pr)) this.ui.toast(m.name, `+${m.reward} gold`);
    this.ui.toast(`${def.name} unlocked!`, `${def.dragonName} is waiting.`);
    this.sdk.reportProgress(completionPercent(pr));
    this.persist();
    this.pendingView = null;
    this.pendingResult = null;
    this.screenReturn = null;
    this.newRun(false);
  }

  private selectSkin(id: string): void {
    if (!this.profile.skins.includes(id)) {
      this.sfx.deny();
      return;
    }
    this.profile.skin = id;
    this.sfx.click();
    this.persist();
    this.openShop("skins");
  }

  private toggleAudio(which: "sound" | "music"): void {
    const s = this.profile.settings;
    if (which === "sound") s.sound = !s.sound;
    else s.music = !s.music;
    this.audio.setUser(s.sound, s.music);
    this.sfx.click();
    this.persist();
    this.ui.refreshToggles(s.sound, s.music);
  }

  private resetProgress(): void {
    this.profile = defaultProfile();
    this.save.set(PROFILE_KEY, JSON.stringify(this.profile));
    this.save.flush();
    this.ui.closeAll();
    this.ui.toast("Progress reset");
    this.pendingView = null;
    this.pendingResult = null;
    this.newRun(false);
  }

  private persist(): void {
    this.save.set(PROFILE_KEY, JSON.stringify(this.profile));
  }

  // --- loop ----------------------------------------------------------------------------------
  private update(dt: number): void {
    const run = this.run;
    if (!run) return;
    const tu0 = performance.now();
    this.sfx.tick(dt);
    this.updateInner(run, dt);
    this.lastUpdateMs = this.lastUpdateMs * 0.9 + (performance.now() - tu0) * 0.1;
  }

  private updateInner(run: Run, dt: number): void {
    if (this.input.consume("p") || this.input.consume("P")) {
      if (this.paused && this.ui.current === "pause") this.resume();
      else this.pause();
    }
    if (this.paused || (this.ui.current && this.ui.current !== "result") || this.adInProgress) return;
    this.time += dt;
    this.particles.update(dt);
    this.popups.update(dt);
    if (run.phase === "escaped" || run.phase === "caught") {
      if (this.resultTimer > 0) {
        this.resultTimer -= dt;
        if (this.resultTimer <= 0 && !this.ui.current) this.showPendingResult();
      }
      return;
    }
    if (this.input.consume("e") || this.input.consume(" ")) run.useLullaby();
    const move = this.inputOverride ?? this.input.read();
    if (run.phase === "ready" && len(move.x, move.y) > 0.05) run.start();
    if (run.phase === "play") {
      this.sessionPlay += dt;
      run.update(dt, move);
      const d = run.dragon;
      this.music.tension = d.state === "asleep" ? clamp01(d.meter / 100) : 1;
      if (d.flame.active) {
        const f = d.flame;
        for (let i = 0; i < 3; i++) {
          const u = Math.random();
          this.particles.emit("fire", f.x + Math.cos(f.angle) * f.len * u, f.y + Math.sin(f.angle) * f.len * u, { count: 1, speed: 60, life: 0.4, size: 8, color: "#ff8a2a", spread: 20 });
        }
      }
      for (const g of d.groundFires) if (Math.random() < 0.15) this.particles.emit("ember", g.x, g.y, { count: 1, speed: 30, vy: -60, life: 0.7, size: 4, color: "#ffb13b" });
      if (d.state === "awake" && Math.random() < 0.3) this.particles.emit("dust", d.x - Math.cos(d.angle) * 60, d.y - Math.sin(d.angle) * 60, { count: 1, speed: 30, life: 0.5, size: 10, color: "#8a8a8a" });
      if (run.thief.onIce && run.thief.speedFrac > 0.3 && Math.random() < 0.4) this.particles.emit("snow", run.thief.x, run.thief.y + 8, { count: 1, speed: 40, life: 0.4, size: 4, color: "#e8f8ff" });
    } else {
      run.update(dt, move);
    }
  }

  private render(frame: number): void {
    const run = this.run;
    if (!run) return;
    const tr0 = performance.now();
    this.juice.update(frame, Math.min(this.vp.view.w, this.vp.view.h) * 0.012);
    this.loop.timeScale = this.juice.timeScale;
    // Camera: overview of the whole lair while waiting, follow the thief during the heist.
    const playing = run.phase === "play" || run.phase === "caught" || run.phase === "escaped";
    const vp = this.vp;
    if (playing) {
      const th = run.thief;
      const zoom = vp.playZoom * (run.dragon.state === "awake" ? 0.88 : 1);
      vp.follow(th.x + th.vx * 0.22, th.y + th.vy * 0.22, zoom, frame, this.cameraSnap);
    } else {
      vp.follow(500, 500, 1, frame, this.cameraSnap);
    }
    this.cameraSnap = false;
    this.renderer.draw({
      run,
      particles: this.particles,
      popups: this.popups,
      juice: this.juice,
      skin: skinById(this.profile.skin),
      time: this.time,
      showExitHint: this.showExitHint && run.phase !== "caught",
      input: this.input,
    });
    const t = run.thief;
    const d = run.dragon;
    const asleep = d.state === "asleep";
    this.ui.setHud({
      gold: this.profile.gold,
      haul: t.bagValue,
      bagFill: clamp01(t.bagWeight / t.stats.capacity),
      bagFull: t.bagWeight >= t.stats.capacity - 0.5,
      meter: asleep ? d.meter : 100,
      floor: asleep ? d.floor : 0,
      stage: d.stage,
      awake: !asleep,
      eye: d.eye,
      lairName: run.layout.def.name,
      best: this.daily ? this.profile.daily.best : (this.profile.bestHaulByLair[run.layout.def.id] ?? 0),
      lullaby: this.profile.upgrades.lullaby === 0 ? "hidden" : t.lullabyUses > 0 ? "ready" : "used",
      dragonColor: run.layout.def.palette.dragon,
      daily: this.daily,
    });
    const pulse = 0.75 + 0.25 * Math.sin(this.time * 8);
    this.ui.setFx(this.juice.vignette * pulse, this.juice.flashAlpha, this.juice.flashColor);
    this.lastFrameMs = this.lastFrameMs * 0.9 + (performance.now() - tr0) * 0.1;
  }

  // --- debug / QA hooks ------------------------------------------------------------------------
  debugApi(): Record<string, unknown> {
    const self = this;
    return {
      state: () => {
        const r = self.run;
        if (!r) return null;
        const t = r.thief;
        const d = r.dragon;
        const items = r.layout.items.filter((i) => !i.taken).map((i) => ({ kind: i.kind, x: i.x, y: i.y, value: i.value, weight: i.weight }));
        return {
          phase: r.phase,
          time: r.time,
          lair: r.layout.def.id,
          daily: r.layout.daily,
          thief: { x: t.x, y: t.y, bagValue: t.bagValue, bagWeight: t.bagWeight, capacity: t.stats.capacity, speedFrac: t.speedFrac, lullaby: t.lullabyUses },
          dragon: { state: d.state, meter: d.meter, floor: d.floor, stage: d.stage, snoring: d.snoring, x: d.x, y: d.y, flame: d.flame.active },
          exit: r.layout.exit,
          items,
          obstacles: r.layout.obstacles,
          hazards: r.layout.hazards,
          hoardValue: r.layout.hoardValue,
          result: r.result,
          profile: { gold: self.profile.gold, runs: self.profile.runs, bestHaul: self.profile.bestHaul, upgrades: self.profile.upgrades, unlocked: self.profile.unlocked },
          screen: self.ui.current,
          paused: self.paused,
          fps: self.loop.fps,
          particles: self.particles.count,
        };
      },
      setInput: (x: number, y: number) => {
        if (self.sdk.env === "crazygames") return;
        self.inputOverride = x === 0 && y === 0 ? null : { x, y, sneak: false };
      },
      sdkLog: () => self.sdk.log.slice(),
      env: () => self.sdk.env,
      perf: () => ({ ...PERF, particles: self.particles.count, frameMs: self.lastFrameMs, updateMs: self.lastUpdateMs }),
      audio: () => ({
        ctx: !!self.audio.ctx,
        state: self.audio.ctx?.state ?? "none",
        platformMuted: self.audio.platformMuted,
        adMuted: self.audio.adMuted,
        masterGain: self.audio.master?.gain.value ?? -1,
        music: self.music.mode,
        tension: self.music.tension,
      }),
      dist,
      // QA mutators: never available on crazygames.com.
      qa:
        self.sdk.env === "crazygames"
          ? null
          : {
              grant: (n: number) => {
                self.profile.gold += n;
                self.persist();
              },
              buy: (id: UpgradeId) => self.buy(id),
              setLair: (id: string) => {
                if (!self.profile.unlocked.includes(id)) self.profile.unlocked.push(id);
                self.profile.lair = id;
                self.persist();
                self.newRun(false);
              },
              unlockAll: () => {
                self.profile.unlocked = LAIRS.map((l) => l.id);
                self.persist();
              },
              setSessionPlay: (s: number) => {
                self.sessionPlay = s;
                self.runsThisSession = Math.max(self.runsThisSession, 2);
              },
              setDoubleCounter: (n: number) => {
                self.escapesSinceDouble = n;
              },
              wake: () => self.run?.dragon.addNoise(1000),
              reset: () => self.resetProgress(),
              setLevels: (n: number) => {
                for (const u of UPGRADES) self.profile.upgrades[u.id] = Math.min(u.maxLevel, n);
                self.persist();
                if (self.run?.phase === "ready") self.newRun(self.daily, true);
              },
            },
    };
  }
}
