export { cn } from "cn"

export function initials(name: string | null | undefined) {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function readableOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "#1a1712" : "#ffffff";
}

export function str(v: FormDataEntryValue | null | undefined) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export function idOrNull(v: FormDataEntryValue | null | undefined) {
  const s = str(v);
  return s && s !== "none" && s !== "all" ? s : null;
}

export function percent(n: number, d: number) {
  return d ? `${((n / d) * 100).toFixed(1)}%` : "0%";
}
