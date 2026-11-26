import { cn } from "@/lib/utils";

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
  tone?: "success" | "warning" | "info" | "muted";
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-xs">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-primary tabular-nums">{value}</div>
      {hint && (
        <div
          className={cn(
            "mt-1 truncate text-sm font-medium",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "info" && "text-info",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {hint}
        </div>
      )}
      {Icon ? (
        <span className="absolute top-4 right-4 grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
      ) : null}
    </div>
  );
}
