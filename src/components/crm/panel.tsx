import { cn } from "@/lib/utils";

export function Panel({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border bg-card shadow-xs", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            {Icon && <Icon className="size-4 text-primary" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}
