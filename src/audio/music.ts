import type { AudioEngine } from "./audio";

export type MusicMode = "off" | "menu" | "sneak" | "chase";

/**
 * Generative soundtrack: a low drone + sparse pentatonic plucks whose density, tempo and filter
 * follow the Wake meter; a heartbeat above 80 %; a driving pulse during the chase.
 */
export class Music {
  mode: MusicMode = "off";
  tension = 0;
  private drone: OscillatorNode[] = [];
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private timer = 0;
  private nextBeat = 0;
  private beatIndex = 0;
  private started = false;

  constructor(private readonly a: AudioEngine) {}

  start(): void {
    if (this.started) return;
    const c = this.a.ctx;
    const bus = this.a.musicBus;
    if (!c || !bus) return;
    this.started = true;
    this.droneFilter = c.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 180;
    this.droneGain = c.createGain();
    this.droneGain.gain.value = 0;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(bus);
    for (const [f, type] of [
      [55, "sawtooth"],
      [55.4, "sawtooth"],
      [110, "triangle"],
    ] as [number, OscillatorType][]) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(this.droneFilter);
      o.start();
      this.drone.push(o);
    }
    this.nextBeat = c.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  stop(): void {
    if (!this.started) return;
    clearInterval(this.timer);
    for (const o of this.drone) o.stop();
    this.drone = [];
    this.started = false;
  }

  setMode(m: MusicMode): void {
    if (m === this.mode) return;
    this.mode = m;
    this.beatIndex = 0;
  }

  private schedule(): void {
    const c = this.a.ctx;
    const bus = this.a.musicBus;
    if (!c || !bus || !this.droneGain || !this.droneFilter) return;
    const t = c.currentTime;
    const tension = this.tension;
    const mode = this.mode;
    // Drone follows tension.
    const targetGain = mode === "off" ? 0 : mode === "menu" ? 0.05 : mode === "chase" ? 0.1 : 0.08 + 0.08 * tension;
    this.droneGain.gain.setTargetAtTime(targetGain, t, 0.3);
    this.droneFilter.frequency.setTargetAtTime(mode === "chase" ? 700 : 160 + 700 * tension * tension, t, 0.3);
    if (mode === "off") return;
    // Beat scheduler with 120 ms look-ahead.
    while (this.nextBeat < t + 0.12) {
      const bpm = mode === "chase" ? 152 : mode === "menu" ? 60 : 68 + 70 * tension;
      const beat = 60 / bpm;
      this.playBeat(this.nextBeat, this.beatIndex, mode, tension);
      this.nextBeat += beat;
      this.beatIndex++;
    }
  }

  private pluck(time: number, freq: number, gain: number, type: OscillatorType = "triangle", dur = 0.5): void {
    const c = this.a.ctx;
    const bus = this.a.musicBus;
    if (!c || !bus) return;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(bus);
    o.start(time);
    o.stop(time + dur + 0.05);
  }

  private thump(time: number, gain: number): void {
    const c = this.a.ctx;
    const bus = this.a.musicBus;
    if (!c || !bus) return;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.18);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    o.connect(g);
    g.connect(bus);
    o.start(time);
    o.stop(time + 0.3);
  }

  private hat(time: number, gain: number): void {
    const c = this.a.ctx;
    const bus = this.a.musicBus;
    if (!c || !bus) return;
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = 6000 + Math.random() * 2000;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 5000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(f);
    f.connect(g);
    g.connect(bus);
    o.start(time);
    o.stop(time + 0.08);
  }

  private playBeat(time: number, i: number, mode: MusicMode, tension: number): void {
    // A minor pentatonic over two octaves.
    const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
    if (mode === "menu") {
      if (i % 4 === 0) this.pluck(time, scale[Math.floor(Math.random() * 5)], 0.05, "sine", 1.2);
      return;
    }
    if (mode === "chase") {
      if (i % 2 === 0) this.thump(time, 0.35);
      if (i % 2 === 1) this.hat(time, 0.12);
      if (i % 4 === 0) this.pluck(time, 110, 0.12, "sawtooth", 0.22);
      if (i % 4 === 2) this.pluck(time, 82.4, 0.12, "sawtooth", 0.22);
      if (i % 8 === 6) this.pluck(time, scale[5 + Math.floor(Math.random() * 4)], 0.08, "square", 0.15);
      return;
    }
    // Sneak: sparse plucks whose density follows tension, heartbeat above 0.8.
    const density = 0.12 + 0.6 * tension;
    if (Math.random() < density) {
      const hi = tension > 0.5 ? 5 : 0;
      this.pluck(time, scale[hi + Math.floor(Math.random() * 5)], 0.06 + 0.05 * tension, "triangle", 0.9 - 0.5 * tension);
    }
    if (tension >= 0.8) {
      if (i % 2 === 0) {
        this.thump(time, 0.25);
        this.thump(time + 0.16, 0.18);
      }
    } else if (i % 8 === 0) {
      this.thump(time, 0.1);
    }
  }
}
