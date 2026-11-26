"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { zonedToUtc } from "@/lib/dates";
import { authorizeProject, getLookups } from "@/lib/project";
import type { ActionResult, AppointmentStatus, CallDirection, CallStatus } from "@/lib/types";
import { idOrNull, str } from "@/lib/utils";

type Ctx = Awaited<ReturnType<typeof authorizeProject>>;

async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    unstable_rethrow(e); // let redirect()/notFound() through
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

function wallToIso(v: FormDataEntryValue | null, tz: string) {
  const s = str(v);
  return s ? zonedToUtc(s, tz).toISOString() : null;
}

async function logActivity(ctx: Ctx, leadId: string, type: string, body: string) {
  await ctx.supabase.from("lead_activities").insert({
    project_id: ctx.project.id,
    lead_id: leadId,
    type,
    body,
    created_by: ctx.user.id,
  });
}

/**
 * Moves an open lead to the first stage whose name matches, e.g. "appointment"
 * → "Appointment Booked". Projects can rename stages, so this is best-effort.
 */
async function moveLeadToStageLike(ctx: Ctx, leadId: string, pattern: string) {
  const { stages } = await getLookups(ctx.project.slug);
  const target = stages.find((s) => s.kind === "open" && s.name.toLowerCase().includes(pattern));
  if (!target) return;
  const { data: lead } = await ctx.supabase.from("leads").select("stage_id").eq("id", leadId).maybeSingle();
  const current = stages.find((s) => s.id === lead?.stage_id);
  if (lead && current?.kind === "open" && current.id !== target.id) {
    await ctx.supabase.from("leads").update({ stage_id: target.id }).eq("id", leadId);
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLead(slug: string, formData: FormData) {
  return run<{ id: string; repeat: boolean }>(async () => {
    const ctx = await authorizeProject(slug);
    const { sources, services } = await getLookups(slug);
    const sourceId = idOrNull(formData.get("source_id"));
    const serviceId = idOrNull(formData.get("service_id"));

    const { data, error } = await ctx.supabase.rpc("capture_lead", {
      p_project: ctx.project.id,
      p_name: str(formData.get("name")),
      p_phone: str(formData.get("phone")),
      p_email: str(formData.get("email")),
      p_source: sources.find((s) => s.id === sourceId)?.name ?? null,
      p_service: services.find((s) => s.id === serviceId)?.name ?? null,
      p_branch_id: idOrNull(formData.get("branch_id")),
      p_assigned_to: idOrNull(formData.get("assigned_to")),
      p_notes: str(formData.get("notes")),
      p_stage_id: idOrNull(formData.get("stage_id")),
      p_follow_up_at: wallToIso(formData.get("follow_up_at"), ctx.tz),
    });
    if (error) return { ok: false, error: error.message };
    const result = data as { id: string; repeat: boolean };
    return {
      ok: true,
      data: result,
      message: result.repeat ? "Phone already exists — logged as a repeat enquiry" : "Lead added",
    };
  });
}

export async function updateLead(slug: string, leadId: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const name = str(formData.get("name"));
    if (!name) return { ok: false, error: "Name is required" };
    const { error } = await ctx.supabase
      .from("leads")
      .update({
        name,
        phone: str(formData.get("phone")),
        email: str(formData.get("email")),
        stage_id: idOrNull(formData.get("stage_id")) ?? undefined,
        source_id: idOrNull(formData.get("source_id")),
        service_id: idOrNull(formData.get("service_id")),
        branch_id: idOrNull(formData.get("branch_id")),
        assigned_to: idOrNull(formData.get("assigned_to")),
        notes: str(formData.get("notes")),
        follow_up_at: wallToIso(formData.get("follow_up_at"), ctx.tz),
      })
      .eq("id", leadId)
      .eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Lead updated" };
  });
}

export async function moveLeadStage(slug: string, leadId: string, stageId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const { stages } = await getLookups(slug);
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return { ok: false, error: "Unknown stage" };

    if (stage.kind === "won") {
      // Winning a lead creates the contact record too.
      const { error } = await ctx.supabase.rpc("convert_lead", { p_lead: leadId });
      if (error) return { ok: false, error: error.message };
      const { error: e2 } = await ctx.supabase.from("leads").update({ stage_id: stageId }).eq("id", leadId);
      if (e2) return { ok: false, error: e2.message };
      return { ok: true, message: `Converted to ${ctx.project.contact_label.toLowerCase()}` };
    }

    const { error } = await ctx.supabase
      .from("leads")
      .update({ stage_id: stageId, ...(stage.kind === "lost" ? { follow_up_at: null } : {}) })
      .eq("id", leadId)
      .eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: `Moved to ${stage.name}` };
  });
}

export async function setFollowUp(slug: string, leadId: string, wall: string | null) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const followUp = wall ? zonedToUtc(wall, ctx.tz).toISOString() : null;
    const { error } = await ctx.supabase.from("leads").update({ follow_up_at: followUp }).eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: followUp ? "Follow-up scheduled" : "Follow-up cleared" };
  });
}

export async function deleteLead(slug: string, leadId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { manager: true });
    const { error } = await ctx.supabase.from("leads").delete().eq("id", leadId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Lead deleted" };
  });
}

export async function addLeadNote(slug: string, leadId: string, body: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    if (!body.trim()) return { ok: false, error: "Write something first" };
    await logActivity(ctx, leadId, "note", body.trim());
    return { ok: true, message: "Note added" };
  });
}

export async function convertLead(slug: string, leadId: string) {
  return run<{ contactId: string }>(async () => {
    const ctx = await authorizeProject(slug);
    const { data, error } = await ctx.supabase.rpc("convert_lead", { p_lead: leadId });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { contactId: data as string }, message: `Converted to ${ctx.project.contact_label.toLowerCase()}` };
  });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(slug: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const title = str(formData.get("title"));
    const due = wallToIso(formData.get("due_at"), ctx.tz);
    if (!title) return { ok: false, error: "Give the task a title" };
    if (!due) return { ok: false, error: "Pick a due date" };
    const { error } = await ctx.supabase.from("tasks").insert({
      project_id: ctx.project.id,
      title,
      notes: str(formData.get("notes")),
      due_at: due,
      lead_id: idOrNull(formData.get("lead_id")),
      assigned_to: idOrNull(formData.get("assigned_to")) ?? ctx.user.id,
      created_by: ctx.user.id,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Task added" };
  });
}

export async function toggleTask(slug: string, taskId: string, done: boolean) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const { error } = await ctx.supabase
      .from("tasks")
      .update({ completed_at: done ? new Date().toISOString() : null })
      .eq("id", taskId)
      .eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: done ? "Task completed" : "Task reopened" };
  });
}

export async function deleteTask(slug: string, taskId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const { error } = await ctx.supabase.from("tasks").delete().eq("id", taskId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Task deleted" };
  });
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function createAppointment(slug: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const leadId = idOrNull(formData.get("lead_id"));
    const contactId = idOrNull(formData.get("contact_id"));
    const when = wallToIso(formData.get("scheduled_at"), ctx.tz);
    if (!leadId && !contactId) return { ok: false, error: "Pick who the appointment is for" };
    if (!when) return { ok: false, error: "Pick a date and time" };

    const { error } = await ctx.supabase.from("appointments").insert({
      project_id: ctx.project.id,
      lead_id: leadId,
      contact_id: contactId,
      scheduled_at: when,
      duration_minutes: Number(formData.get("duration_minutes")) || 30,
      branch_id: idOrNull(formData.get("branch_id")),
      service_id: idOrNull(formData.get("service_id")),
      assigned_to: idOrNull(formData.get("assigned_to")),
      notes: str(formData.get("notes")),
      created_by: ctx.user.id,
    });
    if (error) return { ok: false, error: error.message };

    if (leadId) {
      await logActivity(ctx, leadId, "appointment", `Appointment booked for ${formData.get("scheduled_at")?.toString().replace("T", " ")}`);
      await moveLeadToStageLike(ctx, leadId, "appointment");
    }
    return { ok: true, message: "Appointment booked" };
  });
}

export async function updateAppointmentStatus(slug: string, appointmentId: string, status: AppointmentStatus) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const { data, error } = await ctx.supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .eq("project_id", ctx.project.id)
      .select("lead_id")
      .single();
    if (error) return { ok: false, error: error.message };

    if (data.lead_id) {
      await logActivity(ctx, data.lead_id, "appointment", `Appointment marked ${status.replace("_", " ")}`);
      if (status === "no_show") await moveLeadToStageLike(ctx, data.lead_id, "no show");
    }
    return { ok: true, message: "Status updated" };
  });
}

export async function rescheduleAppointment(slug: string, appointmentId: string, wall: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const { error } = await ctx.supabase
      .from("appointments")
      .update({ scheduled_at: zonedToUtc(wall, ctx.tz).toISOString(), status: "rescheduled" })
      .eq("id", appointmentId)
      .eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Appointment rescheduled" };
  });
}

export async function deleteAppointment(slug: string, appointmentId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { manager: true });
    const { error } = await ctx.supabase.from("appointments").delete().eq("id", appointmentId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Appointment deleted" };
  });
}

// ---------------------------------------------------------------------------
// Call logs
// ---------------------------------------------------------------------------

export async function createCallLog(slug: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const phone = str(formData.get("phone"));
    if (!phone) return { ok: false, error: "Phone number is required" };

    // Link to an existing lead / contact with the same number.
    const key = phone.replace(/\D/g, "").slice(-10);
    const [{ data: lead }, { data: contact }] = await Promise.all([
      ctx.supabase.from("leads").select("id, name").eq("project_id", ctx.project.id).eq("phone_key", key).limit(1).maybeSingle(),
      ctx.supabase.from("contacts").select("id, name").eq("project_id", ctx.project.id).eq("phone_key", key).limit(1).maybeSingle(),
    ]);

    const minutes = Number(formData.get("minutes")) || 0;
    const seconds = Number(formData.get("seconds")) || 0;
    const status = (str(formData.get("status")) ?? "answered") as CallStatus;
    const { error } = await ctx.supabase.from("call_logs").insert({
      project_id: ctx.project.id,
      phone,
      contact_name: str(formData.get("contact_name")) ?? contact?.name ?? lead?.name ?? null,
      lead_id: lead?.id ?? null,
      contact_id: contact?.id ?? null,
      direction: (str(formData.get("direction")) ?? "incoming") as CallDirection,
      status,
      agent_status: str(formData.get("agent_status")),
      handled_by: str(formData.get("handled_by")),
      branch_id: idOrNull(formData.get("branch_id")),
      duration_seconds: minutes * 60 + seconds,
      recording_url: str(formData.get("recording_url")),
      called_at: wallToIso(formData.get("called_at"), ctx.tz) ?? new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    if (lead) await logActivity(ctx, lead.id, "call", `${status === "answered" ? "Call" : `Call (${status})`} logged`);
    return { ok: true, message: "Call logged" };
  });
}

export async function createLeadFromCall(slug: string, callId: string) {
  return run<{ id: string }>(async () => {
    const ctx = await authorizeProject(slug);
    const { data: call, error } = await ctx.supabase
      .from("call_logs")
      .select("id, phone, contact_name, branch_id")
      .eq("id", callId)
      .eq("project_id", ctx.project.id)
      .single();
    if (error) return { ok: false, error: error.message };

    const { data, error: e2 } = await ctx.supabase.rpc("capture_lead", {
      p_project: ctx.project.id,
      p_name: call.contact_name || `Inbound Call - ${call.phone}`,
      p_phone: call.phone,
      p_source: "Inbound Call",
      p_branch_id: call.branch_id,
    });
    if (e2) return { ok: false, error: e2.message };
    const lead = data as { id: string; repeat: boolean };
    await ctx.supabase.from("call_logs").update({ lead_id: lead.id }).eq("id", callId);
    return { ok: true, data: { id: lead.id }, message: lead.repeat ? "Linked to existing lead" : "Lead created" };
  });
}

export async function deleteCallLog(slug: string, callId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { manager: true });
    const { error } = await ctx.supabase.from("call_logs").delete().eq("id", callId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Call log deleted" };
  });
}

// ---------------------------------------------------------------------------
// Contacts (customers / patients / clients …)
// ---------------------------------------------------------------------------

function contactFields(formData: FormData) {
  return {
    name: str(formData.get("name")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    branch_id: idOrNull(formData.get("branch_id")),
    service_id: idOrNull(formData.get("service_id")),
    source_id: idOrNull(formData.get("source_id")),
    assigned_to: idOrNull(formData.get("assigned_to")),
    notes: str(formData.get("notes")),
  };
}

export async function createContact(slug: string, formData: FormData) {
  return run<{ id: string }>(async () => {
    const ctx = await authorizeProject(slug);
    const fields = contactFields(formData);
    if (!fields.name) return { ok: false, error: "Name is required" };
    const { data, error } = await ctx.supabase
      .from("contacts")
      .insert({ project_id: ctx.project.id, ...fields })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { id: data.id }, message: "Saved" };
  });
}

export async function updateContact(slug: string, contactId: string, formData: FormData) {
  return run(async () => {
    const ctx = await authorizeProject(slug);
    const fields = contactFields(formData);
    if (!fields.name) return { ok: false, error: "Name is required" };
    const { error } = await ctx.supabase.from("contacts").update(fields).eq("id", contactId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Saved" };
  });
}

export async function deleteContact(slug: string, contactId: string) {
  return run(async () => {
    const ctx = await authorizeProject(slug, { manager: true });
    const { error } = await ctx.supabase.from("contacts").delete().eq("id", contactId).eq("project_id", ctx.project.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Deleted" };
  });
}
