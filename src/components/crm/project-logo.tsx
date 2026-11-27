import { cn, initials } from "@/lib/utils";

type P = { name: string; logo_url: string | null };

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
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground",
        className,
      )}
    >
      {initials(project.name)}
    </span>
  );
}
