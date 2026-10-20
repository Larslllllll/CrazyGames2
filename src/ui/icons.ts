/** Inline SVG icons (no image assets). */
export const ICONS = {
  coin: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f3c640" stroke="#b8871f" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="none" stroke="#b8871f" stroke-width="2"/><path d="M12 8v8M9.5 10.5h4" stroke="#b8871f" stroke-width="2" stroke-linecap="round"/></svg>`,
  bag: `<svg viewBox="0 0 24 24"><path d="M8 6c0-2 1.5-3 4-3s4 1 4 3l-1 2H9z" fill="#5a3a1a"/><path d="M5 20c-1-6 2-11 7-11s8 5 7 11c0 1-1 2-2 2H7c-1 0-2-1-2-2z" fill="#9c7a4f" stroke="#4a2f14" stroke-width="1.5"/><circle cx="10" cy="15" r="2" fill="#f3c640"/><circle cx="14.5" cy="16.5" r="1.6" fill="#f3c640"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z" fill="#fff"/></svg>`,
  video: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2" fill="currentColor"/><path d="M16 10l5-3v10l-5-3z" fill="currentColor"/></svg>`,
  gear: `<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.5 4l2 1.2-2 3.5-2.3-.8a7 7 0 01-1.7 1l-.3 2.4h-4l-.3-2.4a7 7 0 01-1.7-1l-2.3.8-2-3.5 2-1.2a7 7 0 010-2L1.5 8.8l2-3.5 2.3.8a7 7 0 011.7-1L7.8 2.7h4l.3 2.4a7 7 0 011.7 1l2.3-.8 2 3.5-2 1.2a7 7 0 010 2z" fill="#cfe0ea"/></svg>`,
  note: `<svg viewBox="0 0 24 24"><path d="M9 18a3 3 0 11-2-2.8V6l10-2v11a3 3 0 11-2-2.8V7.5L9 9z" fill="#dff3ff"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  shop: `<svg viewBox="0 0 24 24"><path d="M4 9h16l-1.5 11h-13z" fill="#cfe0ea"/><path d="M8 9V7a4 4 0 018 0v2" fill="none" stroke="#cfe0ea" stroke-width="2"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 01-10 0z" fill="#f3c640"/><path d="M5 5h2v3a3 3 0 01-2-3zm12 0h2a3 3 0 01-2 3z" fill="#f3c640"/><rect x="10" y="13" width="4" height="4" fill="#b8871f"/><rect x="7" y="17" width="10" height="3" rx="1" fill="#f3c640"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" fill="#cfe0ea"/><rect x="3" y="5" width="18" height="5" fill="#f3c640"/><rect x="7" y="12" width="3" height="3" fill="#1d2b36"/><rect x="12" y="12" width="3" height="3" fill="#1d2b36"/></svg>`,
  dragonFace: (eye: number, awake: boolean, color = "#5cb46e"): string => {
    const lidY = 11 + (1 - eye) * 3;
    const eyes = awake || eye > 0.08
      ? `<ellipse cx="9" cy="12" rx="2.4" ry="${(2.2 * Math.max(eye, awake ? 1 : 0)).toFixed(2)}" fill="#fff6c8"/><ellipse cx="15" cy="12" rx="2.4" ry="${(2.2 * Math.max(eye, awake ? 1 : 0)).toFixed(2)}" fill="#fff6c8"/><rect x="8.4" y="${(12 - 1.8 * eye).toFixed(2)}" width="1.2" height="${(3.6 * eye).toFixed(2)}" fill="#1b0f0a"/><rect x="14.4" y="${(12 - 1.8 * eye).toFixed(2)}" width="1.2" height="${(3.6 * eye).toFixed(2)}" fill="#1b0f0a"/>`
      : `<path d="M6.5 ${lidY}q2.5 2 5 0M12.5 ${lidY}q2.5 2 5 0" stroke="#1b2b33" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 24 24"><path d="M5 7l2-5 3 4h4l3-4 2 5z" fill="${color}"/><ellipse cx="12" cy="13" rx="9" ry="8" fill="${color}"/><rect x="7" y="15" width="10" height="6" rx="3" fill="${color}"/><circle cx="10" cy="19" r="1" fill="#1b2b33"/><circle cx="14" cy="19" r="1" fill="#1b2b33"/>${eyes}</svg>`;
  },
};
