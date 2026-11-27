"use client";

import {
  AtSignIcon,
  CheckCircle2Icon,
  Loader2Icon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { checkUsername, signUp, type AuthState } from "@/app/(auth)/actions";
import {
  FieldError,
  FormAlert,
  MatchHint,
  PasswordInput,
  PasswordStrength,
  useFieldErrors,
} from "@/components/auth-fields";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN } from "@/lib/auth-rules";
import { INDUSTRIES } from "@/lib/industries";
import { cn } from "@/lib/utils";

function slugPreview(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const EMPTY = {
  project_name: "",
  industry: "",
  full_name: "",
  username: "",
  email: "",
  password: "",
  confirm_password: "",
};
type Values = typeof EMPTY;

type Availability = { for: string; available: boolean; error?: string };

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    signUp,
    undefined,
  );
  const [values, setValues] = useState<Values>(EMPTY);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const errors = useFieldErrors(state?.fieldErrors);

  const set = (name: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    errors.clear(name);
  };
  const bind = (name: keyof Values) => ({
    id: name,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(name)(e.target.value),
    "aria-invalid": Boolean(errors.error(name)) || undefined,
    "aria-describedby": errors.error(name) ? `${name}-error` : undefined,
  });

  const username = values.username;
  const usernameValid = USERNAME_PATTERN.test(username);

  useEffect(() => {
    if (!USERNAME_PATTERN.test(username)) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const result = await checkUsername(username);
      if (!cancelled) setAvailability({ for: username, ...result });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username]);

  const checked = availability?.for === username ? availability : null;
  const usernameError =
    errors.error("username") ??
    (username && /[^a-z0-9_]/.test(username)
      ? "Use only letters, numbers and underscores"
      : undefined) ??
    (checked && !checked.available ? checked.error : undefined);

  const slug = slugPreview(values.project_name);

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-3">
        <SectionLegend step={1} title="Your business" />
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="project_name">Project / business name</Label>
            <Input
              {...bind("project_name")}
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Adyant Ayurveda"
              className="h-10"
            />
            {errors.error("project_name") ? (
              <FieldError id="project_name-error">
                {errors.error("project_name")}
              </FieldError>
            ) : (
              slug.length >= 2 && (
                <p className="truncate text-xs text-muted-foreground">
                  Lives at{" "}
                  <span className="font-mono text-foreground">/p/{slug}</span>
                </p>
              )
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry-trigger">
              Industry{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <input type="hidden" name="industry" value={values.industry} />
            <div className="relative">
              <Select value={values.industry} onValueChange={set("industry")}>
                <SelectTrigger
                  id="industry-trigger"
                  className="w-full data-[size=default]:h-10"
                >
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {values.industry && (
                <button
                  type="button"
                  aria-label="Clear industry"
                  onClick={() => set("industry")("")}
                  className="absolute top-1/2 right-8 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <SectionLegend step={2} title="Your account" />
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              {...bind("full_name")}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="Priya Sharma"
              className="h-10"
            />
            <FieldError id="full_name-error">
              {errors.error("full_name")}
            </FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSignIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...bind("username")}
                onChange={(e) =>
                  set("username")(
                    e.target.value.toLowerCase().replace(/\s+/g, ""),
                  )
                }
                aria-invalid={Boolean(usernameError) || undefined}
                aria-describedby="username-hint"
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="priya_s"
                title="3–30 letters, numbers or underscores"
                className="h-10 pr-9 pl-9"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {usernameValid &&
                  !usernameError &&
                  (checked?.available ? (
                    <CheckCircle2Icon
                      className="size-4 text-success"
                      aria-label="Username available"
                    />
                  ) : (
                    <Loader2Icon
                      className="size-4 animate-spin text-muted-foreground"
                      aria-label="Checking username"
                    />
                  ))}
                {usernameError && (
                  <XCircleIcon
                    className="size-4 text-destructive"
                    aria-hidden
                  />
                )}
              </span>
            </div>
            {username && (
              <p
                id="username-hint"
                className={cn(
                  "text-xs",
                  usernameError ? "text-destructive" : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                {usernameError ??
                  (checked?.available
                    ? "Available"
                    : usernameValid
                      ? "Checking…"
                      : "3–30 letters, numbers or _")}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              {...bind("email")}
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="h-10"
            />
            <FieldError id="email-error">{errors.error("email")}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              {...bind("password")}
              required
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              autoComplete="new-password"
              placeholder={`${PASSWORD_MIN}+ characters`}
              className="h-10"
            />
            {errors.error("password") ? (
              <FieldError id="password-error">
                {errors.error("password")}
              </FieldError>
            ) : (
              <PasswordStrength password={values.password} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <PasswordInput
              {...bind("confirm_password")}
              required
              autoComplete="new-password"
              placeholder="Type it again"
              className="h-10"
            />
            {errors.error("confirm_password") ? (
              <FieldError id="confirm_password-error">
                {errors.error("confirm_password")}
              </FieldError>
            ) : (
              <MatchHint
                password={values.password}
                confirm={values.confirm_password}
              />
            )}
          </div>
        </div>
      </fieldset>

      <div className="space-y-3 pt-1">
        <FormAlert>{state?.error}</FormAlert>
        <SubmitButton className="h-11 w-full bg-gradient-to-r from-primary/80 to-primary text-base font-semibold shadow-lg shadow-primary/20">
          Create my CRM
        </SubmitButton>
      </div>
    </form>
  );
}

function SectionLegend({ step, title }: { step: number; title: string }) {
  return (
    <legend className="flex w-full items-center gap-3 text-sm font-semibold">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs text-primary">
        {step}
      </span>
      {title}
      <span className="h-px flex-1 bg-border" />
    </legend>
  );
}
