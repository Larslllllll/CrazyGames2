/**
 * Fixed-timestep game loop (120 Hz simulation) with a variable-rate render.
 * Physics are identical at 60, 144 or 165 Hz (CrazyGames requirement).
 */
export class Loop {
  readonly step = 1 / 120;
  timeScale = 1;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private fpsAcc = 0;
  private fpsFrames = 0;
  fps = 60;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: (alpha: number, frameDt: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      let frame = (now - this.last) / 1000;
      this.last = now;
      if (frame > 0.1) frame = 0.1; // tab switch / hiccup: never spiral
      this.fpsAcc += frame;
      this.fpsFrames++;
      if (this.fpsAcc >= 0.5) {
        this.fps = this.fpsFrames / this.fpsAcc;
        this.fpsAcc = 0;
        this.fpsFrames = 0;
      }
      this.acc += frame * this.timeScale;
      let steps = 0;
      while (this.acc >= this.step && steps < 24) {
        this.update(this.step);
        this.acc -= this.step;
        steps++;
      }
      if (steps === 24) this.acc = 0;
      this.render(this.acc / this.step, frame);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
