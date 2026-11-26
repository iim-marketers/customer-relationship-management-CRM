"use client";

import { MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type AuthState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/industries";

function slugPreview(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, undefined);
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");

  if (state?.message) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheckIcon className="size-10 text-primary" />
        <h2 className="text-xl font-semibold">Confirm your email</h2>
        <p className="text-muted-foreground">
          We sent a link to <span className="font-medium text-foreground">{state.email}</span>. Your project is
          ready and waiting — open the link, then sign in.
        </p>
        <Link href="/login" className="mt-2 font-medium text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  const slug = slugPreview(projectName);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project_name">Project / business name</Label>
        <Input
          id="project_name"
          name="project_name"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Adyant Ayurveda"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="h-11"
        />
        {slug.length >= 2 && (
          <p className="text-xs text-muted-foreground">
            Your CRM will live at <span className="font-mono text-foreground">/p/{slug}</span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Industry</Label>
        <input type="hidden" name="industry" value={industry} />
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full data-[size=default]:h-11">
            <SelectValue placeholder="Choose one (optional)" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">Your name</Label>
        <Input id="full_name" name="full_name" required autoComplete="name" placeholder="Full name" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="h-11" />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton className="h-11 w-full bg-gradient-to-r from-primary/80 to-primary text-base font-semibold shadow-lg shadow-primary/20">
        Create project
      </SubmitButton>
    </form>
  );
}
