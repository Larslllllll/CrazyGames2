export const fmtGold = (n: number): string => {
  n = Math.round(n);
  if (n < 10000) return n.toLocaleString("en-US");
  if (n < 1e6) return (n / 1e3).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, "") + "K";
  if (n < 1e9) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
};
export const fmtTime = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};
export const pct = (v: number): string => `${Math.round(v * 100)}%`;
