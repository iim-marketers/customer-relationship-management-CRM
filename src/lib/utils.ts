export { cn } from "cn"

export function initials(name: string | null | undefined) {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
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
