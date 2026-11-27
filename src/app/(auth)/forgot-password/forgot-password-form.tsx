"use client";

import { ArrowLeftIcon, CheckCircle2Icon, KeyRoundIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPassword, type ForgotState } from "./actions";
import { FieldError, FormAlert, MatchHint, PasswordInput, PasswordStrength, useFieldErrors } from "@/components/auth-fields";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTP_LENGTH, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-rules";

const RESEND_AFTER_SECONDS = 60;
const primaryButton = "h-11 w-full bg-gradient-to-r from-primary/80 to-primary text-base font-semibold shadow-lg shadow-primary/20";

export function ForgotPasswordForm() {
  const loginHref = "/login";
  const [state, action] = useActionState<ForgotState, FormData>(forgotPassword, { step: "email" });

  if (state.step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2Icon className="size-10 text-success" />
        <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
        <p className="text-muted-foreground">{state.message}</p>
        <Button asChild className={`${primaryButton} mt-3`}>
          <Link href={loginHref}>Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {state.step === "email" ? (
        <EmailStep state={state} action={action} />
      ) : (
        <CodeStep key={state.email} state={state} action={action} />
      )}
      <Link
        href={loginHref}
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to sign in
      </Link>
    </>
  );
}

function Header({ icon: Icon, title, children }: { icon: typeof MailIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <span className="mb-5 grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}

function EmailStep({ state, action }: { state: Extract<ForgotState, { step: "email" }>; action: (fd: FormData) => void }) {
  const [email, setEmail] = useState("");
  const errors = useFieldErrors(state.fieldErrors);

  return (
    <>
      <Header icon={KeyRoundIcon} title="Forgot your password?">
        Enter the email you signed up with and we&apos;ll send you a {OTP_LENGTH}-digit code to reset it.
      </Header>
      <form action={action} className="space-y-4">
        <input type="hidden" name="intent" value="send" />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              errors.clear("email");
            }}
            aria-invalid={Boolean(errors.error("email")) || undefined}
          />
          <FieldError>{errors.error("email")}</FieldError>
        </div>
        <FormAlert>{state.error}</FormAlert>
        <SubmitButton className={primaryButton}>Send code</SubmitButton>
      </form>
    </>
  );
}

function CodeStep({
  state,
  action,
}: {
  state: Extract<ForgotState, { step: "code" }>;
  action: (fd: FormData) => void;
}) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const errors = useFieldErrors(state.fieldErrors);

  return (
    <>
      <Header icon={MailIcon} title="Check your email">
        If an account exists for <span className="font-medium text-foreground">{state.email}</span>, we&apos;ve sent it a
        code. It expires in 10 minutes.
      </Header>
      <form action={action} className="space-y-4">
        <input type="hidden" name="email" value={state.email} />
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`\\d{${OTP_LENGTH}}`}
            maxLength={OTP_LENGTH}
            placeholder={"•".repeat(OTP_LENGTH)}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
              errors.clear("code");
            }}
            aria-invalid={Boolean(errors.error("code")) || undefined}
            className="h-14 text-center font-mono text-2xl tracking-[0.5em] placeholder:tracking-[0.5em] md:text-2xl"
          />
          <FieldError>{errors.error("code")}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN}+ characters`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              errors.clear("password");
            }}
            aria-invalid={Boolean(errors.error("password")) || undefined}
          />
          {errors.error("password") ? (
            <FieldError>{errors.error("password")}</FieldError>
          ) : (
            <PasswordStrength password={password} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            required
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              errors.clear("confirm_password");
            }}
            aria-invalid={Boolean(errors.error("confirm_password")) || undefined}
          />
          {errors.error("confirm_password") ? (
            <FieldError>{errors.error("confirm_password")}</FieldError>
          ) : (
            <MatchHint password={password} confirm={confirm} />
          )}
        </div>
        <FormAlert tone="info">{state.notice}</FormAlert>
        <FormAlert>{state.error}</FormAlert>
        {/* First submit button, so pressing Enter resets rather than resends. */}
        <SubmitButton name="intent" value="reset" className={primaryButton}>
          Reset password
        </SubmitButton>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <ResendButton sentAt={state.sentAt} />
          <Button type="submit" name="intent" value="change-email" formNoValidate variant="link" className="h-auto p-0 text-muted-foreground">
            Use a different email
          </Button>
        </div>
      </form>
    </>
  );
}

function ResendButton({ sentAt }: { sentAt: number }) {
  const { pending, data } = useFormStatus();
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.min(RESEND_AFTER_SECONDS, Math.max(0, Math.ceil((sentAt + RESEND_AFTER_SECONDS * 1000 - now) / 1000)));

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const resending = pending && data?.get("intent") === "resend";
  return (
    <Button
      type="submit"
      name="intent"
      value="resend"
      formNoValidate
      variant="link"
      disabled={pending || remaining > 0}
      className="h-auto p-0"
    >
      {resending ? "Sending…" : remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
    </Button>
  );
}
