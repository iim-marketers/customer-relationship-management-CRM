import { cn, initials, readableOn } from "@/lib/utils";

type P = { name: string; logo_url: string | null; brand_color: string | null };

export function ProjectLogo({ project, className }: { project: P; className?: string }) {
  if (project.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided logo hosts
      <img
        src={project.logo_url}
        alt=""
        className={cn("size-10 shrink-0 rounded-xl bg-white object-contain p-1", className)}
      />
    );
  }
  const bg = project.brand_color ?? undefined;
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground",
        className,
      )}
      style={bg ? { background: bg, color: readableOn(bg) } : undefined}
    >
      {initials(project.name)}
    </span>
  );
}
