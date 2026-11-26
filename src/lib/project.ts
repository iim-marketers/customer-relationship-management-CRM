import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Branch, Member, MemberRole, Profile, Project, Service, Source, Stage } from "@/lib/types";

export const requireUser = cache(async (next?: string) => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return { supabase, user: data.user };
});

export const getProjectContext = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/p/${slug}/login`);

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, industry, contact_label, brand_color, logo_url, timezone, created_at")
    .eq("slug", slug)
    .maybeSingle<Project>();

  if (!project) redirect("/projects");

  const { data: member } = await supabase
    .from("project_members")
    .select("role, branch_id, is_active, profile:profiles(id, full_name, email)")
    .eq("project_id", project.id)
    .eq("user_id", auth.user.id)
    .maybeSingle<{ role: MemberRole; branch_id: string | null; is_active: boolean; profile: Profile | null }>();

  if (!member || !member.is_active) redirect("/projects");

  const role = member.role;
  return {
    supabase,
    user: auth.user,
    project,
    role,
    profile: member.profile,
    isAdmin: role === "owner" || role === "admin",
    canDelete: role !== "agent",
    tz: project.timezone,
    base: `/p/${project.slug}`,
  };
});

export type ProjectContext = Awaited<ReturnType<typeof getProjectContext>>;

export const getLookups = cache(async (slug: string) => {
  const { supabase, project } = await getProjectContext(slug);
  const [stages, sources, services, branches, members] = await Promise.all([
    supabase.from("lead_stages").select("id, name, color, position, kind").eq("project_id", project.id).order("position"),
    supabase.from("lead_sources").select("id, name, is_active").eq("project_id", project.id).order("name"),
    supabase.from("services").select("id, name, category, is_active").eq("project_id", project.id).order("name"),
    supabase.from("branches").select("id, name, code, city, address, phone, is_active").eq("project_id", project.id).order("name"),
    supabase
      .from("project_members")
      .select("project_id, user_id, role, branch_id, is_active, created_at, profile:profiles(id, full_name, email)")
      .eq("project_id", project.id)
      .order("created_at"),
  ]);

  const memberList = (members.data ?? []) as unknown as Member[];
  return {
    stages: (stages.data ?? []) as Stage[],
    sources: (sources.data ?? []) as Source[],
    services: (services.data ?? []) as Service[],
    branches: (branches.data ?? []) as Branch[],
    members: memberList,
    memberName: (id: string | null | undefined) => {
      if (!id) return "Unassigned";
      const m = memberList.find((x) => x.user_id === id);
      return m?.profile?.full_name || m?.profile?.email || "Unknown";
    },
  };
});

export type Lookups = Awaited<ReturnType<typeof getLookups>>;

export function clientLookups(l: Lookups) {
  return {
    stages: l.stages,
    sources: l.sources,
    services: l.services,
    branches: l.branches,
    members: l.members
      .filter((m) => m.is_active)
      .map((m) => ({ id: m.user_id, name: m.profile?.full_name || m.profile?.email || "Unknown", role: m.role })),
  };
}

export type ClientLookups = ReturnType<typeof clientLookups>;

export async function authorizeProject(slug: string, opts: { admin?: boolean; manager?: boolean } = {}) {
  const ctx = await getProjectContext(slug);
  if (opts.admin && !ctx.isAdmin) throw new Error("Only project admins can do this.");
  if (opts.manager && !ctx.canDelete) throw new Error("You don't have permission to do this.");
  return ctx;
}
