import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Send a freshly signed-in user to the right place. On a branded project login,
 * only that project's members get in.
 */
export async function enterApp(
  supabase: SupabaseClient,
  userId: string,
  projectSlug: string | null,
  next: string | null,
): Promise<{ error: string }> {
  if (projectSlug) {
    const { data: project } = await supabase.from("projects").select("id").eq("slug", projectSlug).maybeSingle();
    if (!project) {
      await supabase.auth.signOut();
      return { error: "This account doesn't have access to this project." };
    }
    redirect(next ?? `/p/${projectSlug}/dashboard`);
  }

  if (next) redirect(next);

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project:projects(slug)")
    .eq("user_id", userId)
    .eq("is_active", true);
  const slugs = (memberships ?? []).map((m) => (m.project as unknown as { slug: string } | null)?.slug).filter(Boolean);
  redirect(slugs.length === 1 ? `/p/${slugs[0]}/dashboard` : "/projects");
}
