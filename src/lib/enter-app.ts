import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function crmSlugFor(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("project_members")
    .select("project:projects(slug)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return (data?.project as unknown as { slug: string } | null)?.slug ?? null;
}

export async function enterApp(supabase: SupabaseClient, userId: string, next: string | null): Promise<never> {
  const slug = await crmSlugFor(supabase, userId);
  if (!slug) redirect("/projects");

  redirect(next?.startsWith(`/p/${slug}/`) ? next : `/p/${slug}/dashboard`);
}
