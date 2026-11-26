import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthShell } from "@/components/auth-card";
import { BrandMark } from "@/components/brand";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create a project" };

export default function SignupPage() {
  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark className="mb-6 text-lg" />
          <h1 className="text-3xl font-bold tracking-tight">Start a new CRM</h1>
          <p className="mt-2 text-muted-foreground">One minute. Pipeline, sources and a branch are set up for you.</p>
        </div>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
