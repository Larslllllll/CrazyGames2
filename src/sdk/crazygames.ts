import type { StorageLike } from "../core/save";

/**
 * CrazyGames SDK v3 (HTML5) wrapper. Every method is a safe no-op when the SDK is absent or
 * reports environment "disabled" (any non-CrazyGames domain), so the game runs anywhere.
 * API names verified against docs.crazygames.com and the live crazygames-sdk-v3.js bundle (2026-10-20).
 */
export type SdkEnv = "none" | "local" | "crazygames" | "disabled";

export interface AdOutcome {
  finished: boolean;
  code?: string;
}

export interface SdkUser {
  username: string;
  profilePictureUrl: string;
}

export interface SystemInfo {
  device: "desktop" | "tablet" | "mobile" | string;
  locale: string;
  applicationType: string;
  os: string;
  browser: string;
}

type Listener = (settings: { muteAudio?: boolean; disableChat?: boolean }) => void;

interface RawSdk {
  init: () => Promise<void>;
  environment: string;
  game: {
    loadingStart: () => void;
    loadingStop: () => void;
    gameplayStart: () => void;
    gameplayStop: () => void;
    happytime: () => void;
    reportGameCompletedPercentage?: (n: number) => void;
    setGameContext?: (ctx: Record<string, string | number>) => void;
    clearGameContext?: () => void;
    settings?: { muteAudio?: boolean; disableChat?: boolean };
    addSettingsChangeListener?: (fn: Listener) => void;
  };
  ad: {
    requestAd: (type: "midgame" | "rewarded", cb: { adStarted?: () => void; adFinished?: () => void; adError?: (e: { code?: string; message?: string }) => void }) => void;
    hasAdblock: () => Promise<boolean>;
  };
  data: StorageLike & { clear: () => void };
  user: {
    isUserAccountAvailable: boolean;
    getUser: () => Promise<{ username: string; profilePictureUrl: string } | null>;
    addAuthListener?: (fn: (user: unknown) => void) => void;
    systemInfo?: { countryCode?: string; locale?: string; device?: { type?: string }; os?: { name?: string }; browser?: { name?: string }; applicationType?: string };
  };
}

declare global {
  interface Window {
    CrazyGames?: { SDK: RawSdk };
  }
}

export class CrazySdk {
  env: SdkEnv = "none";
  ready = false;
  private sdk: RawSdk | null = null;
  private gameplayActive = false;
  private lastGameplayStart = -1e9;
  private startTimer = 0;
  private settingsListeners: Listener[] = [];
  log: string[] = [];

  private note(s: string): void {
    this.log.push(s);
    if (this.log.length > 200) this.log.shift();
  }

  get active(): boolean {
    return this.ready && (this.env === "local" || this.env === "crazygames");
  }

  async init(timeoutMs = 5000): Promise<void> {
    const raw = window.CrazyGames?.SDK;
    if (!raw) {
      this.env = "none";
      this.note("sdk: script not available");
      return;
    }
    this.sdk = raw;
    try {
      await Promise.race([raw.init(), new Promise<void>((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))]);
      const env = String(raw.environment ?? "disabled");
      this.env = env === "local" || env === "crazygames" ? env : "disabled";
      this.ready = true;
      this.note(`sdk: init ok, environment=${this.env}`);
      if (this.active && raw.game.addSettingsChangeListener) {
        raw.game.addSettingsChangeListener((s) => {
          this.note(`sdk: settings ${JSON.stringify(s)}`);
          for (const fn of this.settingsListeners) fn(s);
        });
      }
    } catch (e) {
      this.env = "disabled";
      this.note(`sdk: init failed (${(e as Error).message})`);
    }
  }

  private call(name: string, fn: (s: RawSdk) => void): void {
    if (!this.active || !this.sdk) return;
    try {
      fn(this.sdk);
      this.note(`sdk: ${name}`);
    } catch (e) {
      this.note(`sdk: ${name} threw ${(e as Error).message}`);
    }
  }

  loadingStart(): void {
    this.call("loadingStart", (s) => s.game.loadingStart());
  }

  loadingStop(): void {
    this.call("loadingStop", (s) => s.game.loadingStop());
  }

  /** The SDK throttles gameplayStart() to one call per second; defer instead of tripping its console error. */
  gameplayStart(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    const wait = 1050 - (performance.now() - this.lastGameplayStart);
    clearTimeout(this.startTimer);
    if (wait > 0) {
      this.startTimer = window.setTimeout(() => {
        if (!this.gameplayActive) return;
        this.lastGameplayStart = performance.now();
        this.call("gameplayStart (deferred)", (s) => s.game.gameplayStart());
      }, wait);
      return;
    }
    this.lastGameplayStart = performance.now();
    this.call("gameplayStart", (s) => s.game.gameplayStart());
  }

  gameplayStop(): void {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    clearTimeout(this.startTimer);
    this.call("gameplayStop", (s) => s.game.gameplayStop());
  }

  happytime(): void {
    this.call("happytime", (s) => s.game.happytime());
  }

  reportProgress(percent: number): void {
    this.call(`reportGameCompletedPercentage(${percent})`, (s) => s.game.reportGameCompletedPercentage?.(percent));
  }

  setContext(ctx: Record<string, string | number>): void {
    this.call("setGameContext", (s) => s.game.setGameContext?.(ctx));
  }

  get muteAudio(): boolean {
    return !!this.sdk?.game.settings?.muteAudio;
  }

  onSettingsChange(fn: Listener): void {
    this.settingsListeners.push(fn);
  }

  async hasAdblock(): Promise<boolean> {
    if (!this.active || !this.sdk) return false;
    try {
      const r = await this.sdk.ad.hasAdblock();
      this.note(`sdk: hasAdblock=${r}`);
      return !!r;
    } catch {
      return false;
    }
  }

  /**
   * Request a video ad. Resolves when the ad finished or errored.
   * `onStarted` fires when the ad actually plays (mute + pause there), `onDone` always fires once.
   */
  requestAd(type: "midgame" | "rewarded", hooks: { onStarted?: () => void }): Promise<AdOutcome> {
    if (!this.active || !this.sdk) return Promise.resolve({ finished: false, code: "sdkInactive" });
    const sdk = this.sdk;
    return new Promise<AdOutcome>((resolve) => {
      let done = false;
      const finish = (o: AdOutcome): void => {
        if (done) return;
        done = true;
        this.note(`sdk: ad ${type} → ${o.finished ? "finished" : o.code}`);
        resolve(o);
      };
      // Safety net: never leave the game blocked if the SDK never calls back.
      const guard = setTimeout(() => finish({ finished: false, code: "timeout" }), 90000);
      try {
        sdk.ad.requestAd(type, {
          adStarted: () => {
            this.note(`sdk: ad ${type} started`);
            hooks.onStarted?.();
          },
          adFinished: () => {
            clearTimeout(guard);
            finish({ finished: true });
          },
          adError: (e) => {
            clearTimeout(guard);
            finish({ finished: false, code: e?.code ?? "other" });
          },
        });
        this.note(`sdk: requestAd(${type})`);
      } catch (e) {
        clearTimeout(guard);
        finish({ finished: false, code: "other" });
      }
    });
  }

  dataStorage(): StorageLike | null {
    if (!this.active || !this.sdk) return null;
    const d = this.sdk.data;
    return {
      getItem: (k) => {
        try {
          const v = d.getItem(k);
          return v === undefined || v === null ? null : String(v);
        } catch {
          return null;
        }
      },
      setItem: (k, v) => {
        try {
          d.setItem(k, v);
        } catch (e) {
          this.note(`sdk: data.setItem failed ${(e as Error).message}`);
        }
      },
      removeItem: (k) => {
        try {
          d.removeItem(k);
        } catch {
          /* ignore */
        }
      },
    };
  }

  async getUser(): Promise<SdkUser | null> {
    if (!this.active || !this.sdk) return null;
    try {
      if (!this.sdk.user.isUserAccountAvailable) return null;
      const u = await this.sdk.user.getUser();
      if (!u) return null;
      return { username: u.username, profilePictureUrl: u.profilePictureUrl };
    } catch {
      return null;
    }
  }

  onAuth(fn: () => void): void {
    if (!this.active || !this.sdk) return;
    try {
      this.sdk.user.addAuthListener?.(() => fn());
    } catch {
      /* ignore */
    }
  }

  systemInfo(): SystemInfo | null {
    if (!this.active || !this.sdk) return null;
    const si = this.sdk.user.systemInfo;
    if (!si) return null;
    return {
      device: si.device?.type ?? "desktop",
      locale: si.locale ?? "en",
      applicationType: si.applicationType ?? "web",
      os: si.os?.name ?? "",
      browser: si.browser?.name ?? "",
    };
  }
}
