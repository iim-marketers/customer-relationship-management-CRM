import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set. Add it to .env to enable password reset emails.");
  client ??= new Resend(key);
  return client;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendPasswordResetCode({
  to,
  name,
  code,
  minutes,
}: {
  to: string;
  name: string | null;
  code: string;
  minutes: number;
}): Promise<{ error?: string }> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const { error } = await resend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "CRM <onboarding@resend.dev>",
    to,
    subject: `${code} is your CRM password reset code`,
    text: [
      name ? `Hi ${name},` : "Hi,",
      "",
      `Your password reset code is: ${code}`,
      "",
      `It expires in ${minutes} minutes. If you didn't ask to reset your password, you can ignore this email.`,
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td>
            <p style="margin:0 0 16px;font-size:15px">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Use this code to reset your CRM password:</p>
            <p style="margin:0 0 24px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${code}</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#71717a">The code expires in ${minutes} minutes. If you didn't ask to reset your password, you can safely ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  });
  return error ? { error: error.message } : {};
}
