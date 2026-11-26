import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Secret-key (service role) client. Bypasses RLS — only use after authorizing the caller
 * yourself (e.g. checking they are an admin of the project).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to .env to enable this feature.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
