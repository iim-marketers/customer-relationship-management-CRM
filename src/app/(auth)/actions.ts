"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactLabelFor } from "@/lib/industries";
import { enterApp } from "@/lib/enter-app";
import {
  emailSchema,
  fieldErrorsFrom,
  passwordSchema,
  usernameSchema,
  type FieldErrors,
} from "@/lib/auth-rules";

export type AuthState = { error?: string; fieldErrors?: FieldErrors } | undefined;

const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your name").max(80),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    project_name: z.string().trim().min(2, "Project name must be at least 2 characters").max(80),
    industry: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords don't match",
  });

const MISSING_SECRET =
  "Sign-up isn't configured yet: SUPABASE_SECRET_KEY is missing from the server environment.";

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

async function isUsernameTaken(username: string) {
  const { data } = await createAdminClient().from("profiles").select("id").eq("username", username).maybeSingle();
  return Boolean(data);
}

export async function checkUsername(raw: string): Promise<{ available: boolean; error?: string }> {
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { available: false, error: parsed.error.issues[0].message };
  if (!process.env.SUPABASE_SECRET_KEY) return { available: true };
  return (await isUsernameTaken(parsed.data))
    ? { available: false, error: "That username is taken" }
    : { available: true };
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { full_name, username, email, password, project_name, industry } = parsed.data;

  if (!process.env.SUPABASE_SECRET_KEY) return { error: MISSING_SECRET };
  if (await isUsernameTaken(username)) return { fieldErrors: { username: "That username is taken" } };

  // Pre-confirmed so sign-up never waits on email verification, whatever the Supabase setting.
  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // The on_auth_user_created trigger reads these to create the profile and the project.
    user_metadata: {
      full_name,
      username,
      project_name,
      industry: industry || null,
      contact_label: contactLabelFor(industry),
    },
  });
  if (error) {
    if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) {
      return { fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
    }
    // Likely a username race between our check and the insert.
    if (/database error/i.test(error.message)) {
      return { error: "Couldn't create your account. That username may have just been taken; try another." };
    }
    return { error: error.message };
  }

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("slug")
    .eq("created_by", data.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  redirect(project ? `/p/${project.slug}/dashboard` : "/projects");
}

async function emailFor(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  const { data } = await createAdminClient()
    .rpc("find_auth_user", { p_username: identifier })
    .maybeSingle<{ email: string }>();
  return data?.email ?? null;
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const projectSlug = String(formData.get("project") ?? "") || null;
  if (!identifier || !password) return { error: "Enter your email or username and your password" };

  const email = await emailFor(identifier);
  if (!email) return { error: "Incorrect username or password" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? `Incorrect ${identifier.includes("@") ? "email" : "username"} or password`
          : error.message,
    };
  }

  return enterApp(supabase, data.user.id, projectSlug, safeNext(formData.get("next")));
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
