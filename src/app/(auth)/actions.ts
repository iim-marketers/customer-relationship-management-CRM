"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { contactLabelFor } from "@/lib/industries";

export type AuthState = { error?: string; message?: string; email?: string } | undefined;

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  project_name: z.string().trim().min(2, "Project name must be at least 2 characters").max(80),
  industry: z.string().trim().optional(),
});

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { full_name, email, password, project_name, industry } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The on_auth_user_created trigger reads these and creates the project.
      data: { full_name, project_name, industry: industry || null, contact_label: contactLabelFor(industry) },
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/projects`,
    },
  });
  if (error) return { error: error.message };

  // Email confirmation is on: the project already exists, they just need to verify.
  if (!data.session) {
    return { message: "Check your inbox to confirm your email, then sign in.", email };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("slug")
    .eq("created_by", data.user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  redirect(project ? `/p/${project.slug}/dashboard` : "/projects");
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const projectSlug = String(formData.get("project") ?? "") || null;
  if (!email || !password) return { error: "Enter your email and password" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message === "Invalid login credentials" ? "Incorrect email or password" : error.message };

  // Branded project login: only let members of that project in.
  if (projectSlug) {
    const { data: project } = await supabase.from("projects").select("id").eq("slug", projectSlug).maybeSingle();
    if (!project) {
      await supabase.auth.signOut();
      return { error: "This account doesn't have access to this project." };
    }
    redirect(safeNext(formData.get("next")) ?? `/p/${projectSlug}/dashboard`);
  }

  const next = safeNext(formData.get("next"));
  if (next) redirect(next);

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project:projects(slug)")
    .eq("user_id", data.user.id)
    .eq("is_active", true);
  const slugs = (memberships ?? []).map((m) => (m.project as unknown as { slug: string } | null)?.slug).filter(Boolean);
  redirect(slugs.length === 1 ? `/p/${slugs[0]}/dashboard` : "/projects");
}

export async function signOut(formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const slug = formData?.get("project");
  redirect(typeof slug === "string" && slug ? `/p/${slug}/login` : "/login");
}

export type CreateProjectState = { error?: string } | undefined;

export async function createProject(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "") || null;
  if (name.length < 2) return { error: "Project name must be at least 2 characters" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_project", { p_name: name, p_industry: industry, p_contact_label: contactLabelFor(industry) })
    .single<{ slug: string }>();
  if (error) return { error: error.message };
  redirect(`/p/${data.slug}/dashboard`);
}
