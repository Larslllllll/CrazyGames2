/**
 * Web Audio engine: lazily created on the first user gesture (iOS requires resume() inside a gesture),
 * three buses (master → sfx / music), and three independent mute reasons:
 * the player's own settings, the CrazyGames platform mute setting and "an ad is playing".
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfxBus: GainNode | null = null;
  musicBus: GainNode | null = null;
  userSound = true;
  userMusic = true;
  platformMuted = false;
  adMuted = false;
  private unlockBound = false;

  /** Attach gesture listeners that create/resume the context (call once at boot). */
  unlockOnGesture(): void {
    if (this.unlockBound) return;
    this.unlockBound = true;
    const unlock = (): void => {
      this.ensure();
      this.resume();
    };
    for (const ev of ["pointerdown", "touchend", "keydown", "click"]) window.addEventListener(ev, unlock, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.resume();
    });
  }

  ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyGains();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  resume(): void {
    const c = this.ctx;
    if (c && c.state === "suspended") void c.resume().catch(() => undefined);
  }

  get muted(): boolean {
    return this.platformMuted || this.adMuted;
  }

  applyGains(): void {
    if (!this.ctx || !this.master || !this.sfxBus || !this.musicBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, t, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.userSound ? 1 : 0, t, 0.03);
    this.musicBus.gain.setTargetAtTime(this.userMusic ? 0.55 : 0, t, 0.05);
  }

  setUser(sound: boolean, music: boolean): void {
    this.userSound = sound;
    this.userMusic = music;
    this.applyGains();
  }

  setPlatformMuted(m: boolean): void {
    this.platformMuted = m;
    this.applyGains();
  }

  setAdMuted(m: boolean): void {
    this.adMuted = m;
    this.applyGains();
  }

  get now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }
}
