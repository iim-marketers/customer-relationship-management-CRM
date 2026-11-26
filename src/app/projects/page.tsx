import { FolderKanbanIcon, LogOutIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand";
import { ProjectLogo } from "@/components/crm/project-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { industryLabel } from "@/lib/industries";
import { requireUser } from "@/lib/project";
import { ROLE_LABELS, type MemberRole, type Project } from "@/lib/types";
import { NewProjectDialog } from "./new-project-dialog";

export const metadata: Metadata = { title: "Your projects" };

export default function ProjectsPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-10 flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button variant="outline" size="icon" aria-label="Sign out">
              <LogOutIcon />
            </Button>
          </form>
        </div>
      </header>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectList({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const { supabase, user } = await requireUser("/projects");
  const { data } = await supabase
    .from("project_members")
    .select("role, project:projects(id, name, slug, industry, contact_label, brand_color, logo_url, timezone, created_at)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as unknown as { role: MemberRole; project: Project }[];
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
          <p className="mt-1 text-muted-foreground">Signed in as {name}. Pick a CRM to open.</p>
        </div>
        <NewProjectDialog />
      </div>

      {denied && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <ShieldAlertIcon className="size-4 text-warning" />
          You don&apos;t have access to <span className="font-mono">{denied}</span>, or it doesn&apos;t exist.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <FolderKanbanIcon className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first project, or ask a project admin to add you to theirs.
          </p>
          <NewProjectDialog />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 rounded-xl border bg-card px-4 py-10 shadow-xs sm:grid-cols-4 lg:grid-cols-6">
          {rows.map(({ role, project }) => (
            <Link
              key={project.id}
              href={`/p/${project.slug}/dashboard`}
              title={`${project.name} · ${ROLE_LABELS[role]}${project.industry ? ` · ${industryLabel(project.industry)}` : ""}`}
              className="group flex flex-col items-center gap-2 rounded-lg p-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ProjectLogo
                project={project}
                className="size-16 rounded-2xl text-lg shadow-md transition group-hover:-translate-y-0.5 group-hover:shadow-lg sm:size-18"
              />
              <span className="line-clamp-2 text-sm font-medium">{project.name}</span>
              <Badge variant="secondary" className="-mt-1 text-[10px]">
                {ROLE_LABELS[role]}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
