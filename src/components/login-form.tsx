"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/(auth)/actions";
import { FormAlert, PasswordInput } from "@/components/auth-fields";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ project }: { project?: string }) {
  const params = useSearchParams();
  const [state, action] = useActionState<AuthState, FormData>(
    signIn,
    undefined,
  );
  const [identifier, setIdentifier] = useState("");
  const error = state?.error ?? params.get("error");
  const forgotHref = project
    ? `/forgot-password?project=${encodeURIComponent(project)}`
    : "/forgot-password";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      {project && <input type="hidden" name="project" value={project} />}
      <div className="space-y-2">
        <Label htmlFor="identifier">Email or username</Label>
        <Input
          id="identifier"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Enter email or username"
          required
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href={forgotHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
        />
      </div>
      <FormAlert>{error}</FormAlert>
      <SubmitButton className="h-11 w-full bg-gradient-to-r from-primary/80 to-primary text-base font-semibold shadow-lg shadow-primary/20">
        Sign in
      </SubmitButton>
    </form>
  );
}
