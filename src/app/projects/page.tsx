import { FolderXIcon, LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { crmSlugFor } from "@/lib/enter-app";
import { requireUser } from "@/lib/project";

export const metadata: Metadata = { title: "No CRM" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-10 flex items-center justify-between gap-4">
        <BrandMark />
        <ThemeToggle />
      </header>
      <Suspense>
        <NoCrm />
      </Suspense>
    </div>
  );
}

async function NoCrm() {
  const { supabase, user } = await requireUser("/projects");
  const slug = await crmSlugFor(supabase, user.id);
  if (slug) redirect(`/p/${slug}/dashboard`);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
      <FolderXIcon className="size-10 text-muted-foreground" />
      <h1 className="text-lg font-semibold">
        This account isn&apos;t part of a CRM
      </h1>
      <p className="text-sm text-muted-foreground">
        {user.email} has been removed from its CRM, or the CRM was deactivated.
        Ask your CRM admin to restore access, or sign up with a different email
        to start a new CRM.
      </p>
      <div className="mt-2 flex gap-2">
        <form action={signOut}>
          <Button variant="outline">
            <LogOutIcon /> Sign out
          </Button>
        </form>
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
