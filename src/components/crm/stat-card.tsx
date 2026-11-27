import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
  muted: "bg-muted text-muted-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "success",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {Icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", TONES[tone])}>
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && (
        <div className="truncate text-sm text-muted-foreground" title={hint}>
          {hint}
        </div>
      )}
    </div>
  );
}
