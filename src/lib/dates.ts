/**
 * Timezone helpers. Every project has a timezone; all "today", "this week" and
 * display formatting is done in that zone so server and browser agree.
 */

function partsInTz(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

function offsetMs(date: Date, timeZone: string) {
  const p = partsInTz(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

/** "2026-11-26T09:30" wall-clock time in `timeZone` → UTC Date. */
export function zonedToUtc(wall: string, timeZone: string): Date {
  const [d, t = "00:00"] = wall.split("T");
  const guess = new Date(`${d}T${t.length === 5 ? `${t}:00` : t}Z`);
  const first = new Date(guess.getTime() - offsetMs(guess, timeZone));
  // Second pass handles DST transitions.
  return new Date(guess.getTime() - offsetMs(first, timeZone));
}

/** UTC → "YYYY-MM-DDTHH:mm" in timeZone (for datetime-local inputs). */
export function toZonedInput(iso: string | Date | null | undefined, timeZone: string) {
  if (!iso) return "";
  const p = partsInTz(new Date(iso), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Calendar date ("YYYY-MM-DD") of an instant in timeZone. */
export function ymdInTz(date: Date, timeZone: string) {
  return toZonedInput(date, timeZone).slice(0, 10);
}

export function addDaysYmd(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** [start, end) of a calendar day in timeZone as UTC instants. */
export function dayBounds(ymd: string, timeZone: string) {
  return { from: zonedToUtc(`${ymd}T00:00`, timeZone), to: zonedToUtc(`${addDaysYmd(ymd, 1)}T00:00`, timeZone) };
}

/** Monday of the week containing ymd. */
export function weekStart(ymd: string) {
  const dow = new Date(`${ymd}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDaysYmd(ymd, -((dow + 6) % 7));
}

export function isYmd(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function formatInTz(
  iso: string | Date | null | undefined,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeZone, ...opts }).format(new Date(iso));
}

export const fmt = {
  dateTime: (iso: string | null | undefined, tz: string) => formatInTz(iso, tz),
  date: (iso: string | null | undefined, tz: string) =>
    formatInTz(iso, tz, { day: "numeric", month: "short", year: "numeric" }),
  time: (iso: string | null | undefined, tz: string) =>
    formatInTz(iso, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  longDay: (ymd: string) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
      new Date(`${ymd}T00:00:00Z`),
    ),
};

export const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "90d", label: "Last 90 days" },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["value"];

/** Resolve a named date range relative to "now" in timeZone. */
export function resolveRange(range: string | undefined, timeZone: string, now: Date) {
  const key = (RANGE_OPTIONS.find((r) => r.value === range)?.value ?? "all") as RangeKey;
  const label = RANGE_OPTIONS.find((r) => r.value === key)!.label;
  const today = ymdInTz(now, timeZone);
  const start = (ymd: string) => zonedToUtc(`${ymd}T00:00`, timeZone);
  const monthStart = `${today.slice(0, 8)}01`;
  const prevMonth = (() => {
    const d = new Date(`${monthStart}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toISOString().slice(0, 10);
  })();

  let from: Date | null = null;
  let to: Date | null = null;
  switch (key) {
    case "today": from = start(today); to = start(addDaysYmd(today, 1)); break;
    case "yesterday": from = start(addDaysYmd(today, -1)); to = start(today); break;
    case "7d": from = start(addDaysYmd(today, -6)); break;
    case "30d": from = start(addDaysYmd(today, -29)); break;
    case "90d": from = start(addDaysYmd(today, -89)); break;
    case "this_month": from = start(monthStart); break;
    case "last_month": from = start(prevMonth); to = start(monthStart); break;
  }
  return { key, label, from, to };
}

export function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}
