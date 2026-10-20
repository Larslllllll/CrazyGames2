import type { AudioEngine } from "./audio";

type Wave = OscillatorType;

/** All sound effects are synthesised: no audio files, no licences, ~zero bytes. */
export class Sfx {
  private noiseBuf: AudioBuffer | null = null;
  private lastStep = 0;
  private coinCombo = 0;
  private comboTimer = 0;
  private last: Record<string, number> = {};

  constructor(private readonly a: AudioEngine) {}

  private get ctx(): AudioContext | null {
    return this.a.ctx;
  }

  private out(): GainNode | null {
    return this.a.sfxBus;
  }

  private noise(): AudioBuffer | null {
    const c = this.ctx;
    if (!c) return null;
    if (!this.noiseBuf) {
      const len = c.sampleRate * 1.5;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    return this.noiseBuf;
  }

  /** Rate-limit identical sounds (ms). */
  private throttle(key: string, ms: number): boolean {
    const now = performance.now();
    if ((this.last[key] ?? 0) + ms > now) return true;
    this.last[key] = now;
    return false;
  }

  private tone(
    freq: number,
    dur: number,
    type: Wave,
    gain: number,
    o: { attack?: number; slideTo?: number; delay?: number; detune?: number; lp?: number } = {},
  ): void {
    const c = this.ctx;
    const out = this.out();
    if (!c || !out) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = osc;
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private burst(
    dur: number,
    gain: number,
    o: { type?: BiquadFilterType; freq?: number; freqTo?: number; q?: number; attack?: number; delay?: number } = {},
  ): void {
    const c = this.ctx;
    const out = this.out();
    const buf = this.noise();
    if (!c || !out || !buf) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.frequency.setValueAtTime(o.freq ?? 1000, t0);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t0 + dur);
    f.Q.value = o.q ?? 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t0, Math.random());
    src.stop(t0 + dur + 0.05);
  }

  tick(dt: number): void {
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.coinCombo = 0;
  }

  step(speed: number, sneaking: boolean): void {
    const now = performance.now();
    if (now - this.lastStep < 90) return;
    this.lastStep = now;
    const g = sneaking ? 0.035 : 0.06 + 0.1 * speed;
    this.burst(0.07, g, { freq: 500 + 500 * speed, freqTo: 250, q: 1.2 });
  }

  coin(kind: "coin" | "bigcoin"): void {
    if (this.throttle("coin", 28)) return;
    this.coinCombo = Math.min(16, this.coinCombo + 1);
    this.comboTimer = 0.9;
    const semis = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36][this.coinCombo - 1];
    const f = (kind === "bigcoin" ? 660 : 880) * Math.pow(2, semis / 12);
    this.tone(f, 0.13, "sine", 0.16);
    this.tone(f * 2, 0.08, "triangle", 0.05);
  }

  gem(): void {
    this.tone(1320, 0.18, "sine", 0.14);
    this.tone(1760, 0.22, "sine", 0.12, { delay: 0.07 });
    this.burst(0.15, 0.05, { freq: 5000, q: 2 });
  }

  artefact(rarity: number): void {
    const base = 523;
    const notes = [0, 4, 7, 12, 16];
    for (let i = 0; i < 3 + Math.min(2, rarity); i++) {
      this.tone(base * Math.pow(2, notes[i] / 12), 0.35, "triangle", 0.12, { delay: i * 0.07 });
    }
    this.burst(0.5, 0.08, { freq: 3000, freqTo: 8000, q: 1 });
  }

  grab(): void {
    if (this.throttle("grab", 400)) return;
    this.tone(220, 0.5, "sawtooth", 0.03, { slideTo: 440, lp: 900 });
  }

  bagFull(): void {
    if (this.throttle("bagfull", 1500)) return;
    this.tone(330, 0.16, "square", 0.06, { lp: 1200 });
    this.tone(247, 0.25, "square", 0.06, { delay: 0.16, lp: 1200 });
  }

  bump(kind: string, speed: number): void {
    if (this.throttle("bump", 120)) return;
    const g = Math.min(0.3, 0.08 + speed / 1200);
    this.burst(0.12, g, { type: "lowpass", freq: 400, q: 0.7 });
    if (kind === "bone") {
      for (let i = 0; i < 3; i++) this.tone(1800 + i * 300, 0.04, "square", 0.05, { delay: 0.03 * i, lp: 4000 });
    } else if (kind === "dragon") {
      this.tone(90, 0.3, "sine", 0.2, { slideTo: 50 });
    }
  }

  plate(): void {
    this.tone(1200, 0.9, "sine", 0.2);
    this.tone(2400, 0.6, "sine", 0.08);
    this.tone(1200 * 1.5, 0.5, "triangle", 0.06, { delay: 0.02 });
  }

  snore(): void {
    const c = this.ctx;
    if (!c) return;
    this.tone(55, 1.25, "sawtooth", 0.16, { attack: 0.3, slideTo: 42, lp: 160 });
    this.burst(1.2, 0.06, { type: "lowpass", freq: 300, freqTo: 120, attack: 0.3 });
  }

  stir(): void {
    this.tone(70, 0.4, "sawtooth", 0.14, { slideTo: 48, lp: 300, attack: 0.05 });
  }

  growl(): void {
    this.tone(60, 0.9, "sawtooth", 0.2, { slideTo: 75, lp: 400, attack: 0.08 });
    this.tone(90, 0.9, "square", 0.08, { slideTo: 110, lp: 500, attack: 0.08, detune: 12 });
  }

  roar(): void {
    const c = this.ctx;
    const out = this.out();
    if (!c || !out) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t0);
    osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.25);
    osc.frequency.exponentialRampToValueAtTime(55, t0 + 1.1);
    const shaper = c.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 4);
    }
    shaper.curve = curve;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t0);
    f.frequency.exponentialRampToValueAtTime(200, t0 + 1.1);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
    osc.connect(shaper);
    shaper.connect(f);
    f.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + 1.3);
    this.burst(0.8, 0.3, { type: "lowpass", freq: 2000, freqTo: 200, attack: 0.02 });
    this.tone(40, 0.9, "sine", 0.5, { slideTo: 28 });
  }

  inhale(): void {
    this.burst(0.45, 0.14, { freq: 400, freqTo: 2400, q: 1.5, attack: 0.1 });
  }

  fire(): void {
    this.burst(0.65, 0.35, { type: "lowpass", freq: 3000, freqTo: 400, attack: 0.02 });
    this.tone(60, 0.5, "sine", 0.25, { slideTo: 40 });
  }

  escape(): void {
    const n = [523, 659, 784, 1047];
    n.forEach((f, i) => this.tone(f, 0.35, "triangle", 0.14, { delay: i * 0.09 }));
    this.burst(0.4, 0.1, { freq: 1500, freqTo: 6000, q: 0.8 });
  }

  closeCall(): void {
    const n = [784, 988, 1175, 1568, 1976];
    n.forEach((f, i) => this.tone(f, 0.4, "triangle", 0.14, { delay: 0.3 + i * 0.08 }));
  }

  caught(): void {
    const n = [440, 370, 311];
    n.forEach((f, i) => this.tone(f, 0.45, "square", 0.1, { delay: i * 0.22, lp: 1500 }));
    this.burst(0.3, 0.25, { type: "lowpass", freq: 500, freqTo: 100 });
  }

  lullaby(): void {
    const n = [1047, 880, 784, 659, 523];
    n.forEach((f, i) => this.tone(f, 0.6, "sine", 0.12, { delay: i * 0.14 }));
  }

  lullabyFail(): void {
    this.tone(200, 0.18, "square", 0.05, { lp: 800 });
  }

  ice(): void {
    if (this.throttle("ice", 600)) return;
    this.burst(0.35, 0.08, { freq: 2500, freqTo: 1200, q: 2 });
  }

  click(): void {
    this.tone(900, 0.06, "sine", 0.08);
  }

  buy(): void {
    this.tone(880, 0.12, "sine", 0.12);
    this.tone(1320, 0.25, "sine", 0.12, { delay: 0.1 });
    this.tone(1760, 0.3, "triangle", 0.08, { delay: 0.2 });
  }

  deny(): void {
    this.tone(180, 0.15, "square", 0.05, { lp: 600 });
  }

  unlock(): void {
    const n = [523, 659, 784, 1047, 1319];
    n.forEach((f, i) => this.tone(f, 0.5, "triangle", 0.13, { delay: i * 0.1 }));
    this.burst(0.8, 0.1, { freq: 2000, freqTo: 7000 });
  }

  reveal(rarity: number): void {
    this.burst(0.6, 0.08 + rarity * 0.03, { freq: 1000, freqTo: 6000, q: 1 });
    this.tone(660 + rarity * 110, 0.5, "sine", 0.1, { delay: 0.1 });
    this.tone(990 + rarity * 165, 0.6, "sine", 0.1, { delay: 0.25 });
  }

  record(): void {
    const n = [659, 784, 988, 1319, 1568];
    n.forEach((f, i) => this.tone(f, 0.5, "triangle", 0.14, { delay: i * 0.1 }));
  }
}
