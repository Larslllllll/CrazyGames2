/**
 * Storage adapter: CrazyGames SDK data module when available (cloud-synced for logged-in users),
 * localStorage otherwise. The whole profile is one JSON key, far below the 1 MB SDK limit.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveStore {
  private backend: StorageLike | null = null;
  private pending: Map<string, string> = new Map();
  private timer = 0;

  setBackend(backend: StorageLike | null): void {
    this.backend = backend;
  }

  private local(): StorageLike | null {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  get(key: string): string | null {
    try {
      const b = this.backend ?? this.local();
      if (!b) return null;
      const v = b.getItem(key);
      if (v !== null) return v;
      // Returning players: migrate a localStorage value into the SDK data module.
      if (this.backend) {
        const l = this.local();
        const lv = l?.getItem(key) ?? null;
        if (lv !== null) this.set(key, lv);
        return lv;
      }
      return null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    this.pending.set(key, value);
    if (this.timer) return;
    this.timer = window.setTimeout(() => this.flush(), 250);
  }

  flush(): void {
    this.timer = 0;
    for (const [k, v] of this.pending) {
      try {
        (this.backend ?? this.local())?.setItem(k, v);
        // Keep a local mirror too, so a later SDK-disabled environment still has the data.
        if (this.backend) this.local()?.setItem(k, v);
      } catch {
        /* storage full / disabled: ignore */
      }
    }
    this.pending.clear();
  }

  remove(key: string): void {
    try {
      (this.backend ?? this.local())?.removeItem(key);
      this.local()?.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
