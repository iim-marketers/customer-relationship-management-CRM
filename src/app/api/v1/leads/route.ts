import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Body = Record<string, unknown>;

function pick(body: Body, ...keys: string[]) {
  const lower = Object.fromEntries(Object.entries(body).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v === undefined || v === null) continue;
    const s = (Array.isArray(v) ? v[0] : v)?.toString().trim();
    if (s) return s.slice(0, 2000);
  }
  return null;
}

async function readBody(request: NextRequest): Promise<Body | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const data = await request.json();
      return data && typeof data === "object" && !Array.isArray(data) ? (data as Body) : null;
    }
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      return Object.fromEntries((await request.formData()).entries()) as Body;
    }
    const text = await request.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Body;
    } catch {
      return Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") ?? request.nextUrl.searchParams.get("key");
  if (!apiKey || !/^[a-f0-9]{16,128}$/i.test(apiKey)) {
    return json({ error: "Missing or invalid API key" }, 401);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return json({ error: "Lead capture is not configured on this server" }, 503);
  }

  const { data: secret } = await admin.from("project_secrets").select("project_id").eq("api_key", apiKey).maybeSingle();
  if (!secret) return json({ error: "Missing or invalid API key" }, 401);

  const body = await readBody(request);
  if (!body) return json({ error: "Body must be JSON or form-encoded" }, 400);

  const firstLast = [pick(body, "first_name", "firstname"), pick(body, "last_name", "lastname")].filter(Boolean).join(" ");
  const name = pick(body, "name", "full_name", "fullname", "your-name") ?? (firstLast || null);
  const phone = pick(body, "phone", "phone_number", "phonenumber", "mobile", "mobile_number", "contact", "whatsapp", "tel");
  if (!name && !phone) return json({ error: "Provide at least a name or a phone number" }, 400);

  const branchName = pick(body, "branch", "location", "branch_name");
  let branchId: string | null = null;
  if (branchName) {
    const { data: branch } = await admin
      .from("branches")
      .select("id")
      .eq("project_id", secret.project_id)
      .ilike("name", branchName.replace(/[%_]/g, "\\$&"))
      .limit(1)
      .maybeSingle();
    branchId = branch?.id ?? null;
  }

  const { data, error } = await admin.rpc("capture_lead", {
    p_project: secret.project_id,
    p_name: name,
    p_phone: phone,
    p_email: pick(body, "email", "email_address", "your-email"),
    p_source: pick(body, "source", "utm_source", "platform", "lead_source") ?? "Website",
    p_service: pick(body, "service", "campaign", "campaign_name", "utm_campaign", "interest", "treatment"),
    p_branch_id: branchId,
    p_notes: pick(body, "notes", "message", "comments", "enquiry", "your-message", "description"),
  });

  if (error) return json({ error: error.message }, 400);
  const result = data as { id: string; repeat: boolean };
  return json({ id: result.id, repeat: result.repeat }, 201);
}
