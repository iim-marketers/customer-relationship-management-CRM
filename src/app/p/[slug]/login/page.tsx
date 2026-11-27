import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { AuthCard, AuthShell } from "@/components/auth-card";
import { ProjectLogo } from "@/components/crm/project-logo";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

type Branding = { name: string; slug: string; logo_url: string | null; industry: string | null };

async function getBranding(slug: string): Promise<Branding | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.rpc("get_project_branding", { p_slug: slug }).maybeSingle<Branding>();
  return data ?? null;
}

export const metadata: Metadata = { title: "Sign in" };

export default function ProjectLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <AuthCard>
            <Skeleton className="mx-auto mb-6 size-20 rounded-lg" />
            <Skeleton className="mx-auto h-8 w-48" />
          </AuthCard>
        }
      >
        <ProjectLogin params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function ProjectLogin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getBranding(slug);

  if (!project) {
    return (
      <AuthCard className="text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="mt-2 text-muted-foreground">
          There&apos;s no CRM at <span className="font-mono">/p/{slug}</span>.
        </p>
        <Link href="/login" className="mt-6 inline-block font-medium text-primary hover:underline">
          Go to the main sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div>
        <div className="mb-8 flex flex-col items-center text-center">
          <ProjectLogo project={project} className="mb-5 size-20 rounded-lg text-2xl" />
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue to the <span className="font-medium text-foreground">{project.name}</span> CRM.
          </p>
        </div>
        <Suspense>
          <LoginForm project={project.slug} />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          All CRM data is loaded securely from the backend after login.
        </p>
      </div>
    </AuthCard>
  );
}
