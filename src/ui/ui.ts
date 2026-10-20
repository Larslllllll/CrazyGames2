import "./styles.css";
import { fmtGold } from "../core/format";
import { RARITY_COLORS, RARITY_NAMES, type ArtefactDef } from "../progression/collection";
import type { SkinDef } from "../progression/milestones";
import type { UpgradeId } from "../progression/upgrades";
import { artefactIcon } from "../render/artefacts";
import type { SdkUser } from "../sdk/crazygames";
import { ICONS } from "./icons";

export interface HudState {
  gold: number;
  haul: number;
  bagFill: number;
  bagFull: boolean;
  meter: number;
  floor: number;
  stage: number;
  awake: boolean;
  eye: number;
  lairName: string;
  best: number;
  lullaby: "hidden" | "ready" | "used";
  dragonColor: string;
  daily: boolean;
}

export interface ResultArtefact {
  def: ArtefactDef;
  isNew: boolean;
}

export interface ResultView {
  escaped: boolean;
  title: string;
  subtitle: string;
  haul: number;
  baseHaul: number;
  bonus: number;
  lostHaul: number;
  coins: number;
  gems: number;
  artefacts: ResultArtefact[];
  newRecord: boolean;
  daily: boolean;
  offer: "none" | "double" | "keep";
  offerSeconds: number;
  milestones: { name: string; reward: number }[];
}

export interface ShopUpgradeView {
  id: UpgradeId;
  name: string;
  blurb: string;
  level: number;
  max: number;
  cost: number;
  canAfford: boolean;
  effectNow: string;
  effectNext: string;
}

export interface ShopLairView {
  id: string;
  name: string;
  dragonName: string;
  blurb: string;
  color: string;
  colorDark: string;
  unlocked: boolean;
  cost: number;
  canAfford: boolean;
  selected: boolean;
  best: number;
}

export interface ShopSkinView {
  def: SkinDef;
  owned: boolean;
  selected: boolean;
  hint: string;
}

export interface ShopView {
  gold: number;
  upgrades: ShopUpgradeView[];
  lairs: ShopLairView[];
  skins: ShopSkinView[];
}

export interface MuseumView {
  lairs: { id: string; name: string; items: { def: ArtefactDef; have: boolean }[] }[];
  total: number;
  found: number;
}

export interface SettingsView {
  sound: boolean;
  music: boolean;
  user: SdkUser | null;
  stats: { runs: number; escapes: number; caught: number; bestHaul: number; totalGold: number };
  env: string;
}

export interface UiCallbacks {
  nextHeist: () => void;
  home: () => void;
  openShop: () => void;
  openMuseum: () => void;
  openSettings: () => void;
  closeScreen: () => void;
  buy: (id: UpgradeId) => void;
  selectLair: (id: string) => void;
  unlockLair: (id: string) => void;
  selectSkin: (id: string) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  resetProgress: () => void;
  rewarded: (kind: "double" | "keep") => void;
  skipOffer: () => void;
  daily: () => void;
  lullaby: () => void;
  uiClick: () => void;
}

const el = <T extends HTMLElement>(html: string): T => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
};

const q = <T extends HTMLElement>(root: ParentNode, sel: string): T => root.querySelector(sel) as T;

/** All DOM UI: HUD, screens, toasts. The canvas does the game; this does the chrome. */
export class Ui {
  private root: HTMLElement;
  private hud: HTMLElement;
  private goldEl: HTMLElement;
  private haulEl: HTMLElement;
  private bagEl: HTMLElement;
  private bagFillEl: HTMLElement;
  private meterFill: HTMLElement;
  private meterFloor: HTMLElement;
  private meterBar: HTMLElement;
  private meterLabel: HTMLElement;
  private meterFace: HTMLElement;
  private bestEl: HTMLElement;
  private lairEl: HTMLElement;
  private hintEl: HTMLElement;
  private abilityBtn: HTMLButtonElement;
  private menubar: HTMLElement;
  private dailyBtn: HTMLButtonElement;
  private readyEl: HTMLElement;
  private screens: Record<string, HTMLElement> = {};
  private toasts: HTMLElement;
  private hintTimer = 0;
  private lastHud: Partial<HudState> = {};
  private faceKey = "";
  private shopTab: "upgrades" | "lairs" | "skins" = "upgrades";
  private offerTimer = 0;
  current: string | null = null;

  constructor(
    root: HTMLElement,
    private readonly cb: UiCallbacks,
  ) {
    this.root = root;
    root.innerHTML = "";
    this.hud = el(`
      <div class="hud">
        <div class="hud-top">
          <div class="hud-left">
            <div class="pill gold">${ICONS.coin}<span data-gold>0</span></div>
            <div class="pill haul">${ICONS.bag}<span data-haul>0</span><span class="bagfill" data-bag><i data-bagfill></i></span></div>
          </div>
          <div class="hud-center">
            <div class="meter">
              <div class="meter-row">
                <div class="meter-face" data-face></div>
                <div class="meter-bar" data-meterbar><i data-meterfill></i><em data-meterfloor></em></div>
              </div>
              <div class="meter-label" data-meterlabel>ASLEEP</div>
            </div>
          </div>
          <div class="hud-right">
            <div class="pill best"><span>BEST</span><b data-best>0</b></div>
            <button class="icon-btn" data-pause aria-label="Pause">${ICONS.pause}</button>
          </div>
        </div>
        <div class="hud-bottom">
          <div class="hud-hint" data-hint></div>
          <button class="ability" data-lullaby aria-label="Lullaby">${ICONS.note}<span>Lullaby</span><span class="key">E</span></button>
        </div>
      </div>`);
    root.appendChild(this.hud);
    this.goldEl = q(this.hud, "[data-gold]");
    this.haulEl = q(this.hud, "[data-haul]");
    this.bagEl = q(this.hud, "[data-bag]");
    this.bagFillEl = q(this.hud, "[data-bagfill]");
    this.meterFill = q(this.hud, "[data-meterfill]");
    this.meterFloor = q(this.hud, "[data-meterfloor]");
    this.meterBar = q(this.hud, "[data-meterbar]");
    this.meterLabel = q(this.hud, "[data-meterlabel]");
    this.meterFace = q(this.hud, "[data-face]");
    this.bestEl = q(this.hud, "[data-best]");
    this.lairEl = this.bestEl;
    this.hintEl = q(this.hud, "[data-hint]");
    this.abilityBtn = q(this.hud, "[data-lullaby]");
    q<HTMLButtonElement>(this.hud, "[data-pause]").addEventListener("click", () => {
      cb.uiClick();
      cb.pause();
    });
    this.abilityBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      cb.lullaby();
    });

    this.menubar = el(`
      <div class="menubar">
        <button class="btn" data-shop><span class="ico">${ICONS.shop}</span>Shop</button>
        <button class="btn" data-museum><span class="ico">${ICONS.trophy}</span>Museum</button>
        <button class="btn daily" data-daily><span class="ico">${ICONS.calendar}</span>Daily Heist</button>
        <button class="btn" data-settings><span class="ico">${ICONS.gear}</span></button>
      </div>`);
    root.appendChild(this.menubar);
    this.dailyBtn = q(this.menubar, "[data-daily]");
    q(this.menubar, "[data-shop]").addEventListener("click", () => {
      cb.uiClick();
      cb.openShop();
    });
    q(this.menubar, "[data-museum]").addEventListener("click", () => {
      cb.uiClick();
      cb.openMuseum();
    });
    q(this.menubar, "[data-settings]").addEventListener("click", () => {
      cb.uiClick();
      cb.openSettings();
    });
    this.dailyBtn.addEventListener("click", () => {
      cb.uiClick();
      cb.daily();
    });

    this.readyEl = el(`<div class="ready"><h1>Don't Wake<span>the Dragon</span></h1><p data-readytext></p><p class="ctrl" data-readyctrl></p></div>`);
    root.appendChild(this.readyEl);

    for (const id of ["result", "shop", "museum", "settings", "pause", "ad"]) {
      const s = el(`<div class="screen" data-screen="${id}"></div>`);
      root.appendChild(s);
      this.screens[id] = s;
    }
    this.screens.ad.innerHTML = `<div class="ad-note">Ad playing<small>The heist continues right after.</small></div>`;
    this.toasts = el(`<div class="toasts"></div>`);
    root.appendChild(this.toasts);
  }

  // --- HUD ---------------------------------------------------------------------------------
  setHud(h: HudState): void {
    const L = this.lastHud;
    if (L.gold !== h.gold) this.goldEl.textContent = fmtGold(h.gold);
    if (L.haul !== h.haul) this.haulEl.textContent = fmtGold(h.haul);
    if (L.bagFill !== h.bagFill) this.bagFillEl.style.width = `${Math.round(h.bagFill * 100)}%`;
    if (L.bagFull !== h.bagFull) this.bagEl.classList.toggle("full", h.bagFull);
    if (L.meter !== h.meter) this.meterFill.style.width = `${h.meter.toFixed(1)}%`;
    if (L.floor !== h.floor) this.meterFloor.style.width = `${h.floor.toFixed(1)}%`;
    if (L.stage !== h.stage || L.awake !== h.awake) {
      this.meterBar.classList.toggle("stage2", h.stage >= 2 && !h.awake);
      this.meterLabel.className = `meter-label ${h.awake ? "awake" : h.stage === 2 ? "s2" : h.stage === 1 ? "s1" : ""}`;
      this.meterLabel.textContent = h.awake ? "AWAKE!" : h.stage === 2 ? "WAKING UP…" : h.stage === 1 ? "STIRRING" : "ASLEEP";
    }
    const fk = `${Math.round(h.eye * 10)}:${h.awake}:${h.dragonColor}`;
    if (fk !== this.faceKey) {
      this.faceKey = fk;
      this.meterFace.innerHTML = ICONS.dragonFace(h.eye, h.awake, h.dragonColor);
    }
    if (L.best !== h.best || L.daily !== h.daily) this.bestEl.textContent = h.daily ? `Daily ${fmtGold(h.best)}` : fmtGold(h.best);
    if (L.lullaby !== h.lullaby) {
      this.abilityBtn.classList.toggle("show", h.lullaby !== "hidden");
      this.abilityBtn.classList.toggle("used", h.lullaby === "used");
    }
    this.lastHud = { ...h };
    void this.lairEl;
  }

  setHudVisible(v: boolean): void {
    this.hud.style.display = v ? "" : "none";
  }

  setMenubar(visible: boolean, dailyDone: boolean, dailyBest: number): void {
    this.menubar.classList.toggle("show", visible);
    this.dailyBtn.classList.toggle("done", dailyDone);
    this.dailyBtn.innerHTML = `<span class="ico">${ICONS.calendar}</span>${dailyDone ? `Daily ${fmtGold(dailyBest)}` : "Daily Heist"}`;
  }

  showReady(text: string, ctrl: string): void {
    q(this.readyEl, "[data-readytext]").textContent = text;
    q(this.readyEl, "[data-readyctrl]").textContent = ctrl;
    this.readyEl.classList.add("show");
  }

  hideReady(): void {
    this.readyEl.classList.remove("show");
  }

  hint(text: string, seconds = 2.6): void {
    this.hintEl.textContent = text;
    this.hintEl.classList.add("show");
    clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.hintEl.classList.remove("show"), seconds * 1000);
  }

  toast(title: string, sub = ""): void {
    const t = el(`<div class="toast"><b></b><span></span></div>`);
    q(t, "b").textContent = title;
    q(t, "span").textContent = sub;
    this.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  // --- screens ------------------------------------------------------------------------------
  private open(id: string, html: string): HTMLElement {
    this.closeAll();
    const s = this.screens[id];
    s.innerHTML = html;
    s.classList.add("show");
    this.current = id;
    const close = s.querySelector("[data-close]");
    close?.addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.closeScreen();
    });
    return s;
  }

  closeAll(): void {
    for (const [id, s] of Object.entries(this.screens)) {
      s.classList.remove("show");
      if (id !== "ad") s.innerHTML = "";
    }
    this.current = null;
    clearInterval(this.offerTimer);
  }

  showAd(show: boolean): void {
    this.screens.ad.classList.toggle("show", show);
  }

  showResult(r: ResultView): void {
    const cls = r.escaped ? "good" : "danger";
    const reveals = r.artefacts
      .map(
        (a) =>
          `<div class="reveal" style="--rar:${RARITY_COLORS[a.def.rarity]}" data-art="${a.def.id}">${a.isNew ? '<span class="new">NEW</span>' : ""}<div class="rar">${RARITY_NAMES[a.def.rarity]}</div><div class="name">${a.def.name}</div></div>`,
      )
      .join("");
    const ms = r.milestones.map((m) => `<div class="stat bonus"><span>★ ${m.name}</span><b>+${fmtGold(m.reward)}</b></div>`).join("");
    let actions = "";
    if (r.offer === "double") {
      actions = `<div class="pair"><button class="btn big primary" data-reward="double"><span class="ico">${ICONS.video}</span>Double haul</button><button class="btn big primary" data-next>Next heist</button></div><div class="countdown">Watch a short ad to double this haul · optional</div>`;
    } else if (r.offer === "keep") {
      actions = `<div class="pair"><button class="btn big primary" data-reward="keep"><span class="ico">${ICONS.video}</span>Keep loot <span data-count>(${r.offerSeconds})</span></button><button class="btn big primary" data-next>Continue</button></div><div class="countdown">The dragon sneezes you out with your bag · optional ad</div>`;
    } else {
      actions = `<button class="btn big primary wide" data-next>Next heist</button>`;
    }
    const s = this.open(
      "result",
      `<div class="card">
        <h2 class="${cls}">${r.title}</h2>
        <p class="sub">${r.subtitle}</p>
        ${r.newRecord ? `<div class="record">★ NEW BEST HAUL ★</div>` : ""}
        ${r.daily ? `<div class="record" style="color:var(--gold2)">DAILY HEIST</div>` : ""}
        <div class="reveals">${reveals}</div>
        <div class="stack">
          ${r.escaped ? `<div class="stat"><span>Loot · ${r.coins} coins · ${r.gems} gems · ${r.artefacts.length} artefact${r.artefacts.length === 1 ? "" : "s"}</span><b>${fmtGold(r.baseHaul)}</b></div>` : `<div class="stat"><span>Lost loot</span><b style="text-decoration:line-through;color:var(--danger)">${fmtGold(r.lostHaul)}</b></div>`}
          ${r.bonus > 0 ? `<div class="stat bonus"><span>Close call bonus +20%</span><b>+${fmtGold(r.bonus)}</b></div>` : ""}
          ${ms}
          <div class="stat total"><span>Banked</span><b>${fmtGold(r.haul)}</b></div>
        </div>
        <div class="actions">${actions}<div class="row center"><button class="btn ghost" data-shop><span class="ico">${ICONS.shop}</span>Shop</button><button class="btn ghost" data-museum><span class="ico">${ICONS.trophy}</span>Museum</button></div></div>
      </div>`,
    );
    for (const a of r.artefacts) {
      const holder = s.querySelector(`[data-art="${a.def.id}"]`);
      holder?.insertBefore(artefactIcon(a.def, 56), holder.firstChild?.nextSibling ?? null);
    }
    s.querySelector("[data-next]")?.addEventListener("click", () => {
      this.cb.uiClick();
      if (r.offer !== "none") this.cb.skipOffer();
      else this.cb.nextHeist();
    });
    s.querySelector("[data-shop]")?.addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.openShop();
    });
    s.querySelector("[data-museum]")?.addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.openMuseum();
    });
    const rb = s.querySelector<HTMLButtonElement>("[data-reward]");
    rb?.addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.rewarded(rb.dataset.reward as "double" | "keep");
    });
    if (r.offer === "keep") {
      let left = r.offerSeconds;
      const count = s.querySelector("[data-count]");
      this.offerTimer = window.setInterval(() => {
        left--;
        if (count) count.textContent = `(${left})`;
        if (left <= 0) {
          clearInterval(this.offerTimer);
          const act = s.querySelector(".actions");
          if (act) {
            act.querySelector(".pair")?.remove();
            act.querySelector(".countdown")?.remove();
            const b = el<HTMLButtonElement>(`<button class="btn big primary wide" data-next>Next heist</button>`);
            b.addEventListener("click", () => {
              this.cb.uiClick();
              this.cb.nextHeist();
            });
            act.insertBefore(b, act.firstChild);
          }
        }
      }, 1000);
    }
  }

  /** Stop the keep-loot countdown while an ad is playing. */
  freezeOffer(): void {
    clearInterval(this.offerTimer);
  }

  /** Re-render the result's reward button after an ad outcome. */
  resultOfferDone(text: string): void {
    const s = this.screens.result;
    const act = s.querySelector(".actions");
    if (!act) return;
    act.querySelector(".pair")?.remove();
    act.querySelector(".countdown")?.remove();
    clearInterval(this.offerTimer);
    const b = el<HTMLButtonElement>(`<button class="btn big primary wide" data-next>Next heist</button>`);
    b.addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.nextHeist();
    });
    act.insertBefore(b, act.firstChild);
    const total = s.querySelector(".stat.total b");
    if (total && text) total.textContent = text;
  }

  showShop(v: ShopView, tab?: "upgrades" | "lairs" | "skins"): void {
    if (tab) this.shopTab = tab;
    const s = this.open(
      "shop",
      `<div class="card wide">
        <button class="icon-btn close" data-close>${ICONS.close}</button>
        <h2>Shop</h2>
        <p class="sub">${ICONS.coin.replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} <b style="color:var(--gold2)">${fmtGold(v.gold)}</b> gold</p>
        <div class="tabs"><button data-tab="upgrades">Upgrades</button><button data-tab="lairs">Lairs</button><button data-tab="skins">Skins</button></div>
        <div data-body></div>
      </div>`,
    );
    const body = q(s, "[data-body]");
    const render = (): void => {
      s.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === this.shopTab));
      if (this.shopTab === "upgrades") {
        body.innerHTML = `<div class="stack">${v.upgrades
          .map(
            (u) => `<div class="upgrade">
              <div><div class="name">${u.name}</div><div class="blurb">${u.blurb}</div><div class="fx">${u.effectNow}${u.level < u.max ? ` → ${u.effectNext}` : ""}</div>
              <div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < u.level ? "on" : ""}"></i>`).join("")}</div></div>
              ${u.level >= u.max ? `<button class="btn maxed" disabled>MAX</button>` : `<button class="btn ${u.canAfford ? "primary" : ""}" data-buy="${u.id}" ${u.canAfford ? "" : "disabled"}>${fmtGold(u.cost)}</button>`}
            </div>`,
          )
          .join("")}</div>`;
        body.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((b) => b.addEventListener("click", () => this.cb.buy(b.dataset.buy as UpgradeId)));
      } else if (this.shopTab === "lairs") {
        body.innerHTML = `<div class="lairs">${v.lairs
          .map(
            (l) => `<button class="lair ${l.selected ? "on" : ""} ${l.unlocked ? "" : "locked"}" data-lair="${l.id}">
              <div class="swatch" style="background:linear-gradient(135deg,${l.color},${l.colorDark})">${ICONS.dragonFace(0, false, l.color)}</div>
              <div class="name">${l.name}</div><div class="dragon">${l.dragonName}</div><div class="blurb">${l.blurb}</div>
              ${l.unlocked ? `<div class="best">Best haul ${fmtGold(l.best)}</div>` : `<div class="cost ${l.canAfford ? "" : "no"}">Unlock ${fmtGold(l.cost)}</div>`}
            </button>`,
          )
          .join("")}</div>`;
        body.querySelectorAll<HTMLButtonElement>("[data-lair]").forEach((b) =>
          b.addEventListener("click", () => {
            const id = b.dataset.lair!;
            const l = v.lairs.find((x) => x.id === id)!;
            if (l.unlocked) this.cb.selectLair(id);
            else this.cb.unlockLair(id);
          }),
        );
      } else {
        body.innerHTML = `<div class="skins">${v.skins
          .map(
            (k) => `<button class="skin ${k.selected ? "on" : ""} ${k.owned ? "" : "locked"}" data-skin="${k.def.id}" style="--c1:${k.def.hood};--c2:${k.def.hoodDark}"><i></i><span>${k.def.name}</span>${k.owned ? "" : `<span class="small">${k.hint}</span>`}</button>`,
          )
          .join("")}</div>`;
        body.querySelectorAll<HTMLButtonElement>("[data-skin]").forEach((b) => b.addEventListener("click", () => this.cb.selectSkin(b.dataset.skin!)));
      }
    };
    s.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        this.cb.uiClick();
        this.shopTab = b.dataset.tab as typeof this.shopTab;
        render();
      }),
    );
    render();
  }

  showMuseum(v: MuseumView): void {
    const s = this.open(
      "museum",
      `<div class="card wide">
        <button class="icon-btn close" data-close>${ICONS.close}</button>
        <h2>Hoard Museum</h2>
        <p class="sub">${v.found} / ${v.total} artefacts found · complete a lair's set to unlock a thief skin</p>
        ${v.lairs
          .map(
            (l) => `<div class="museum-lair"><h3>${l.name}<span>${l.items.filter((i) => i.have).length}/${l.items.length}</span></h3>
            <div class="grid8">${l.items
              .map(
                (i) => `<div class="art ${i.have ? "have" : "miss"}" style="--rar:${RARITY_COLORS[i.def.rarity]}" data-art="${i.def.id}"><div class="rar">${RARITY_NAMES[i.def.rarity]}</div><div>${i.have ? i.def.name : "???"}</div></div>`,
              )
              .join("")}</div></div>`,
          )
          .join("")}
      </div>`,
    );
    for (const l of v.lairs)
      for (const i of l.items) {
        const holder = s.querySelector(`[data-art="${i.def.id}"]`);
        holder?.insertBefore(artefactIcon(i.def, 44, !i.have), holder.firstChild);
      }
  }

  showSettings(v: SettingsView): void {
    const s = this.open(
      "settings",
      `<div class="card">
        <button class="icon-btn close" data-close>${ICONS.close}</button>
        <h2>Settings</h2>
        ${v.user ? `<p class="sub"><span class="user"><img src="${v.user.profilePictureUrl}" alt="" />${v.user.username}</span></p>` : ""}
        <div class="stack">
          <div class="toggle"><span>Sound effects</span><button class="btn ${v.sound ? "on" : ""}" data-sound>${v.sound ? "ON" : "OFF"}</button></div>
          <div class="toggle"><span>Music</span><button class="btn ${v.music ? "on" : ""}" data-music>${v.music ? "ON" : "OFF"}</button></div>
          <table class="controls">
            <tr><td>Move</td><td>WASD / arrows / ZQSD · drag anywhere (touch or mouse)</td></tr>
            <tr><td>Sneak</td><td>Hold Shift · or drag only a little</td></tr>
            <tr><td>Lullaby</td><td>E / Space · the blue button</td></tr>
            <tr><td>Pause</td><td>P · the pause button</td></tr>
          </table>
          <div class="stat"><span>Heists · escaped · caught</span><b>${v.stats.runs} · ${v.stats.escapes} · ${v.stats.caught}</b></div>
          <div class="stat"><span>Best haul · total gold</span><b>${fmtGold(v.stats.bestHaul)} · ${fmtGold(v.stats.totalGold)}</b></div>
          <p class="small">Don't Wake the Dragon v1.0 · All art and sound are generated by the game. Fonts: Titan One &amp; Fredoka (SIL Open Font License). Progress is saved${v.env === "crazygames" ? " to your CrazyGames account" : " on this device"}.</p>
          <button class="btn ghost" data-reset>Reset progress</button>
        </div>
      </div>`,
    );
    q(s, "[data-sound]").addEventListener("click", () => this.cb.toggleSound());
    q(s, "[data-music]").addEventListener("click", () => this.cb.toggleMusic());
    const reset = q<HTMLButtonElement>(s, "[data-reset]");
    let armed = false;
    reset.addEventListener("click", () => {
      this.cb.uiClick();
      if (!armed) {
        armed = true;
        reset.textContent = "Tap again to erase everything";
        reset.style.borderColor = "var(--danger)";
        setTimeout(() => {
          armed = false;
          reset.textContent = "Reset progress";
          reset.style.borderColor = "";
        }, 4000);
        return;
      }
      this.cb.resetProgress();
    });
  }

  showPause(sound: boolean, music: boolean): void {
    const s = this.open(
      "pause",
      `<div class="card">
        <h2>Paused</h2>
        <div class="stack">
          <button class="btn big primary wide" data-resume><span class="ico">${ICONS.play}</span>Resume</button>
          <button class="btn wide" data-restart>Restart heist</button>
          <div class="row"><button class="btn wide ${sound ? "on" : ""}" data-sound>Sound ${sound ? "ON" : "OFF"}</button><button class="btn wide ${music ? "on" : ""}" data-music>Music ${music ? "ON" : "OFF"}</button></div>
        </div>
      </div>`,
    );
    q(s, "[data-resume]").addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.resume();
    });
    q(s, "[data-restart]").addEventListener("click", () => {
      this.cb.uiClick();
      this.cb.restart();
    });
    q(s, "[data-sound]").addEventListener("click", () => this.cb.toggleSound());
    q(s, "[data-music]").addEventListener("click", () => this.cb.toggleMusic());
  }

  /** Refresh toggle labels on whatever screen is open. */
  refreshToggles(sound: boolean, music: boolean): void {
    for (const s of Object.values(this.screens)) {
      const sb = s.querySelector("[data-sound]");
      const mb = s.querySelector("[data-music]");
      if (sb) {
        sb.textContent = (s.dataset.screen === "pause" ? "Sound " : "") + (sound ? "ON" : "OFF");
        sb.classList.toggle("on", sound);
      }
      if (mb) {
        mb.textContent = (s.dataset.screen === "pause" ? "Music " : "") + (music ? "ON" : "OFF");
        mb.classList.toggle("on", music);
      }
    }
  }

  get rootEl(): HTMLElement {
    return this.root;
  }
}
