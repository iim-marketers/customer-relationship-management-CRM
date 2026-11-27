"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { authorizeProject } from "@/lib/project";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, MemberRole } from "@/lib/types";
import { idOrNull, str } from "@/lib/utils";
import { MASTER_TABLES, type MasterTable } from "./master-config";

async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

function friendly(message: string) {
  if (message.includes("violates foreign key constraint") && message.includes("lead_stages")) {
    return "Move leads out of this stage first.";
  }
  if (message.includes("duplicate key")) return "An entry with that name already exists.";
  return message;
}

export async function updateProjectProfile(slug: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    const name = str(formData.get("name"));
    if (!name || name.length < 2) return { ok: false, error: "Project name must be at least 2 characters" };

    const timezone = str(formData.get("timezone")) ?? ctx.project.timezone;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      return { ok: false, error: "Unknown timezone" };
    }

    const logo = str(formData.get("logo_url"));
    if (logo && !/^https?:\/\//i.test(logo)) return { ok: false, error: "Logo URL must start with http:// or https://" };

    const { error } = await ctx.supabase
      .from("projects")
      .update({
        name,
        contact_label: str(formData.get("contact_label")) ?? "Customers",
        industry: idOrNull(formData.get("industry")),
        logo_url: logo,
        timezone,
      })
      .eq("id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Project updated" };
  });
}

export async function deleteProject(slug: string, confirmSlug: string) {
  const result = await run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (ctx.role !== "owner") return { ok: false, error: "Only owners can delete a project." };
    if (confirmSlug.trim() !== ctx.project.slug) return { ok: false, error: "Type the project slug exactly to confirm." };
    if (!process.env.SUPABASE_SECRET_KEY) {
      return { ok: false, error: "Deleting a CRM needs SUPABASE_SECRET_KEY in your environment (.env). Add it and restart the server." };
    }
    const admin = createAdminClient();

    const { data: members, error: membersError } = await admin
      .from("project_members")
      .select("user_id")
      .eq("project_id", ctx.project.id);
    if (membersError) return { ok: false, error: membersError.message };

    const { error } = await ctx.supabase.from("projects").delete().eq("id", ctx.project.id);
    if (error) return { ok: false, error: error.message };

    await ctx.supabase.auth.signOut();
    for (const { user_id } of members ?? []) {
      const { error: userError } = await admin.auth.admin.deleteUser(user_id);
      if (userError) console.error(`deleteProject: couldn't delete user ${user_id}:`, userError.message);
    }
    return { ok: true };
  });
  if (result.ok) redirect("/");
  return result;
}

const ASSIGNABLE: MemberRole[] = ["admin", "manager", "agent"];

export async function addMember(slug: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    const email = str(formData.get("email"))?.toLowerCase();
    const fullName = str(formData.get("full_name"));
    const password = String(formData.get("password") ?? "");
    const role = (str(formData.get("role")) ?? "agent") as MemberRole;
    const branchId = idOrNull(formData.get("branch_id"));

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email" };
    if (!ASSIGNABLE.includes(role)) return { ok: false, error: "Invalid role" };

    if (!process.env.SUPABASE_SECRET_KEY) {
      return {
        ok: false,
        error: "Adding team members needs SUPABASE_SECRET_KEY in your environment (.env). Add it and restart the server.",
      };
    }
    const admin = createAdminClient();

    if (branchId) {
      const { data: branch } = await admin.from("branches").select("id").eq("id", branchId).eq("project_id", ctx.project.id).maybeSingle();
      if (!branch) return { ok: false, error: "Unknown branch" };
    }

    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    let userId = existing?.id as string | undefined;

    if (userId) {
      const { data: membership } = await admin
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (membership) {
        return {
          ok: false,
          error:
            membership.project_id === ctx.project.id
              ? "That person is already a member of this CRM."
              : "That email is already used by another CRM. Each login belongs to one CRM, so use a different email.",
        };
      }
    } else {
      if (password.length < 8) return { ok: false, error: "New users need a password of at least 8 characters" };
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName ?? email.split("@")[0] },
      });
      if (error) return { ok: false, error: error.message };
      userId = data.user.id;
    }

    const { error } = await admin.from("project_members").insert({
      project_id: ctx.project.id,
      user_id: userId,
      role,
      branch_id: branchId,
    });
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      message: existing ? "Existing login added to this CRM" : `Account created — they can sign in at /p/${ctx.project.slug}/login`,
    };
  });
}

export async function updateMember(slug: string, userId: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    const role = (str(formData.get("role")) ?? "agent") as MemberRole;
    const branchId = idOrNull(formData.get("branch_id"));

    const { data: target } = await ctx.supabase
      .from("project_members")
      .select("role")
      .eq("project_id", ctx.project.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!target) return { ok: false, error: "Member not found" };

    if (userId === ctx.user.id && role !== target.role) return { ok: false, error: "You can't change your own role." };
    if ((role === "owner" || target.role === "owner") && ctx.role !== "owner" && role !== target.role) {
      return { ok: false, error: "Only owners can grant or remove the owner role." };
    }
    if (target.role === "owner" && ctx.role !== "owner") return { ok: false, error: "Only owners can edit an owner." };

    const { error } = await ctx.supabase
      .from("project_members")
      .update({ role, branch_id: branchId })
      .eq("project_id", ctx.project.id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Member updated" };
  });
}

export async function setMemberActive(slug: string, userId: string, active: boolean) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (userId === ctx.user.id && !active) return { ok: false, error: "You can't deactivate yourself." };
    const { data: target } = await ctx.supabase
      .from("project_members")
      .select("role")
      .eq("project_id", ctx.project.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (target?.role === "owner" && ctx.role !== "owner") return { ok: false, error: "Only owners can deactivate an owner." };
    const { error } = await ctx.supabase
      .from("project_members")
      .update({ is_active: active })
      .eq("project_id", ctx.project.id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: active ? "Member activated" : "Member deactivated" };
  });
}

export async function removeMember(slug: string, userId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (userId === ctx.user.id) return { ok: false, error: "You can't remove yourself." };
    const { data: target } = await ctx.supabase
      .from("project_members")
      .select("role")
      .eq("project_id", ctx.project.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (target?.role === "owner" && ctx.role !== "owner") return { ok: false, error: "Only owners can remove an owner." };
    const { error } = await ctx.supabase.from("project_members").delete().eq("project_id", ctx.project.id).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Member removed" };
  });
}

function masterValues(table: MasterTable, formData: FormData) {
  const values: Record<string, unknown> = {};
  for (const f of MASTER_TABLES[table].fields) {
    if (f.type === "switch") values[f.name] = formData.get(f.name) === "on" || formData.get(f.name) === "true";
    else values[f.name] = str(formData.get(f.name));
  }
  return values;
}

export async function saveMasterRecord(slug: string, table: MasterTable, id: string | null, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (!Object.hasOwn(MASTER_TABLES, table)) return { ok: false, error: "Unknown list" };
    const values = masterValues(table, formData);
    if (!values.name) return { ok: false, error: "Name is required" };
    if (table === "lead_stages" && values.color && !/^#[0-9a-fA-F]{6}$/.test(String(values.color))) {
      return { ok: false, error: "Colour must be a hex value like #0f766e" };
    }

    if (id) {
      const { error } = await ctx.supabase.from(table).update(values).eq("id", id).eq("project_id", ctx.project.id);
      if (error) return { ok: false, error: friendly(error.message) };
      return { ok: true, message: "Saved" };
    }

    if (table === "lead_stages") {
      const { data: last } = await ctx.supabase
        .from("lead_stages")
        .select("position")
        .eq("project_id", ctx.project.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      values.position = (last?.position ?? 0) + 1;
    }
    const { error } = await ctx.supabase.from(table).insert({ project_id: ctx.project.id, ...values });
    if (error) return { ok: false, error: friendly(error.message) };
    return { ok: true, message: "Added" };
  });
}

export async function setMasterActive(slug: string, table: MasterTable, id: string, active: boolean) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (!Object.hasOwn(MASTER_TABLES, table) || !MASTER_TABLES[table].fields.some((f) => f.name === "is_active")) return { ok: false, error: "Not supported" };
    const { error } = await ctx.supabase.from(table).update({ is_active: active }).eq("id", id).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: friendly(error.message) };
    return { ok: true, message: active ? "Activated" : "Deactivated" };
  });
}

export async function deleteMasterRecord(slug: string, table: MasterTable, id: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    if (!Object.hasOwn(MASTER_TABLES, table)) return { ok: false, error: "Unknown list" };
    if (table === "lead_stages") {
      const { count } = await ctx.supabase.from("lead_stages").select("id", { count: "exact", head: true }).eq("project_id", ctx.project.id);
      if ((count ?? 0) <= 1) return { ok: false, error: "A pipeline needs at least one stage." };
    }
    const { error } = await ctx.supabase.from(table).delete().eq("id", id).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: friendly(error.message) };
    return { ok: true, message: "Deleted" };
  });
}

export async function moveStage(slug: string, stageId: string, direction: "up" | "down") {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    const { data: stages, error } = await ctx.supabase
      .from("lead_stages")
      .select("id, position")
      .eq("project_id", ctx.project.id)
      .order("position");
    if (error) return { ok: false, error: error.message };

    const list = stages ?? [];
    const i = list.findIndex((s) => s.id === stageId);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true };

    // Renumber everything so duplicate positions can't stall the swap.
    [list[i], list[j]] = [list[j], list[i]];
    const updates = list.map((s, idx) =>
      s.position === idx + 1
        ? null
        : ctx.supabase.from("lead_stages").update({ position: idx + 1 }).eq("id", s.id).eq("project_id", ctx.project.id),
    );
    const results = await Promise.all(updates.filter(Boolean));
    const failed = results.find((r) => r?.error);
    if (failed?.error) return { ok: false, error: failed.error.message };
    return { ok: true };
  });
}

export async function rotateApiKey(slug: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { admin: true });
    const { error } = await ctx.supabase
      .from("project_secrets")
      .update({ api_key: randomBytes(24).toString("hex") })
      .eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "API key rotated — update your integrations" };
  });
}
