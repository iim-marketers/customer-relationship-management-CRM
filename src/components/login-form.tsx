"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ project }: { project?: string }) {
  const params = useSearchParams();
  const [state, action] = useActionState<AuthState, FormData>(signIn, undefined);
  const error = state?.error ?? params.get("error");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      {project && <input type="hidden" name="project" value={project} />}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-warning">*</span>
        </Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-warning">*</span>
        </Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter password" required className="h-11" />
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <SubmitButton className="h-11 w-full bg-gradient-to-r from-primary/80 to-primary text-base font-semibold shadow-lg shadow-primary/20">
        Sign in
      </SubmitButton>
    </form>
  );
}
