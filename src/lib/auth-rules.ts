import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(USERNAME_PATTERN, "Use only letters, numbers and underscores");

export const PASSWORD_MIN = 8;
// bcrypt (used by Supabase Auth) ignores anything past 72 bytes.
export const PASSWORD_MAX = 72;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be ${PASSWORD_MAX} characters or fewer`);

export const emailSchema = z.email("Enter a valid email").trim().toLowerCase();

export const OTP_LENGTH = 6;

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  if (pw.length < PASSWORD_MIN) return { score: 0, label: "Too short" };
  const extras = [pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = Math.min(4, 1 + extras.filter(Boolean).length) as 1 | 2 | 3 | 4;
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong"][score] };
}

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
