"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetCode } from "@/lib/email";
import { enterApp } from "@/lib/enter-app";
import { emailSchema, fieldErrorsFrom, OTP_LENGTH, passwordSchema, type FieldErrors } from "@/lib/auth-rules";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 5;

type Feedback = { error?: string; fieldErrors?: FieldErrors; notice?: string };

export type ForgotState =
  | ({ step: "email" } & Feedback)
  | ({ step: "code"; email: string; sentAt: number } & Feedback)
  | { step: "done"; message: string };

export async function forgotPassword(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const intent = formData.get("intent");
  if (intent === "reset") return resetPassword(prev, formData);
  if (intent === "change-email") return { step: "email" };
  return requestCode(prev, formData);
}

function notConfigured() {
  const missing = ["SUPABASE_SECRET_KEY", "RESEND_API_KEY"].filter((k) => !process.env[k]);
  return missing.length ? `Password reset isn't configured yet: ${missing.join(" and ")} missing on the server.` : null;
}

function hashCode(userId: string, code: string) {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY!).update(`${userId}:${code}`).digest("hex");
}

async function findUser(email: string) {
  const { data } = await createAdminClient()
    .rpc("find_auth_user", { p_email: email })
    .maybeSingle<{ id: string; email: string; full_name: string | null }>();
  return data;
}

// Reports success either way so emails can't be probed.
async function requestCode(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const isResend = prev.step === "code";
  const back = (f: Feedback): ForgotState =>
    prev.step === "code" ? { step: "code", email: prev.email, sentAt: prev.sentAt, ...f } : { step: "email", ...f };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return back({ fieldErrors: { email: parsed.error.issues[0].message } });
  const email = parsed.data;

  const configError = notConfigured();
  if (configError) return back({ error: configError });

  const sent: ForgotState = {
    step: "code",
    email,
    sentAt: Date.now(),
    notice: isResend ? "A new code is on its way. Codes sent earlier no longer work." : undefined,
  };

  const user = await findUser(email);
  if (!user) return sent;

  const admin = createAdminClient();
  const { data: recent } = await admin
    .from("password_reset_codes")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  const latest = recent?.[0] ? new Date(recent[0].created_at).getTime() : 0;
  if (Date.now() - latest < RESEND_COOLDOWN_SECONDS * 1000) return { ...sent, sentAt: latest };
  if ((recent?.length ?? 0) >= MAX_CODES_PER_HOUR) {
    return back({ error: "Too many reset requests. Try again in an hour." });
  }

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

  await admin.from("password_reset_codes").update({ used_at: new Date().toISOString() }).eq("user_id", user.id).is("used_at", null);
  const { data: row, error } = await admin
    .from("password_reset_codes")
    .insert({
      user_id: user.id,
      code_hash: hashCode(user.id, code),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (error) return back({ error: "Couldn't start the reset. Please try again." });

  const { error: sendError } = await sendPasswordResetCode({
    to: email,
    name: user.full_name,
    code,
    minutes: CODE_TTL_MINUTES,
  });
  if (sendError) {
    await admin.from("password_reset_codes").delete().eq("id", row.id);
    console.error("Resend failed:", sendError);
    return back({ error: "We couldn't send the email right now. Please try again in a moment." });
  }

  return sent;
}

const resetSchema = z
  .object({
    email: emailSchema,
    code: z.string().trim().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code from your email`),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, { path: ["confirm_password"], message: "Passwords don't match" });

async function resetPassword(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const sentAt = prev.step === "code" ? prev.sentAt : 0;
  const email = String(formData.get("email") ?? "");
  const fail = (f: Feedback): ForgotState => ({ step: "code", email, sentAt, ...f });

  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail({ fieldErrors: fieldErrorsFrom(parsed.error) });

  const configError = notConfigured();
  if (configError) return fail({ error: configError });

  const invalid = fail({ fieldErrors: { code: "That code is incorrect or has expired" } });
  const user = await findUser(parsed.data.email);
  if (!user) return invalid;

  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("password_reset_codes")
    .select("id, code_hash, attempts, expires_at")
    .eq("user_id", user.id)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!entry || new Date(entry.expires_at).getTime() < Date.now()) {
    return fail({ fieldErrors: { code: "This code has expired. Request a new one below." } });
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    return fail({ fieldErrors: { code: "Too many wrong attempts. Request a new code below." } });
  }

  // Count before comparing; matching on the old count makes parallel guesses lose.
  const { data: counted } = await admin
    .from("password_reset_codes")
    .update({ attempts: entry.attempts + 1 })
    .eq("id", entry.id)
    .eq("attempts", entry.attempts)
    .select("id");
  if (!counted?.length) return invalid;

  const expected = Buffer.from(entry.code_hash, "hex");
  const actual = Buffer.from(hashCode(user.id, parsed.data.code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const left = MAX_ATTEMPTS - entry.attempts - 1;
    return fail({
      fieldErrors: {
        code: left > 0 ? `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.` : "Too many wrong attempts. Request a new code below.",
      },
    });
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: parsed.data.password });
  if (error) return fail({ error: error.message });
  await admin.from("password_reset_codes").update({ used_at: new Date().toISOString() }).eq("user_id", user.id).is("used_at", null);

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  const done: ForgotState = { step: "done", message: "Your password has been updated. Sign in with your new password." };
  if (signInError) return done;

  return enterApp(supabase, data.user.id, null);
}
