"use client";

import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { passwordStrength } from "@/lib/auth-rules";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("h-11 pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}

const STRENGTH_COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("h-1 rounded-full bg-muted transition-colors", i <= Math.max(score, 1) && STRENGTH_COLORS[score])}
          />
        ))}
      </div>
      <span className={cn("w-16 text-right text-xs", score <= 1 ? "text-destructive" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

/** "Passwords match" / "don't match" hint once the confirm field has input. */
export function MatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <p className={cn("flex items-center gap-1 text-xs", match ? "text-success" : "text-destructive")} aria-live="polite">
      {match ? <CheckIcon className="size-3.5" /> : <XIcon className="size-3.5" />}
      {match ? "Passwords match" : "Passwords don't match"}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {children}
    </p>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "info"; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-foreground",
      )}
    >
      {children}
    </p>
  );
}

/** Track which server-reported field errors the user has since edited, so they disappear on change. */
export function useFieldErrors(fieldErrors: Partial<Record<string, string>> | undefined) {
  const [source, setSource] = useState(fieldErrors);
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set());
  if (source !== fieldErrors) {
    setSource(fieldErrors);
    setCleared(new Set());
  }
  return {
    error: (name: string) => (cleared.has(name) ? undefined : fieldErrors?.[name]),
    clear: (name: string) => {
      if (fieldErrors?.[name] && !cleared.has(name)) setCleared(new Set(cleared).add(name));
    },
  };
}
