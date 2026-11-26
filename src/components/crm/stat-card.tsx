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
    <div className="relative overflow-hidden rounded-2xl border bg-card/90 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
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
        <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      ) : (
        <span aria-hidden className="absolute -right-3 -bottom-3 size-16 rounded-full bg-primary/10" />
      )}
    </div>
  );
}
