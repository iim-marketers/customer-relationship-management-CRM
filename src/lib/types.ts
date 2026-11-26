export type MemberRole = "owner" | "admin" | "manager" | "agent";
export type StageKind = "open" | "won" | "lost";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "no_show"
  | "cancelled";
export type CallDirection = "incoming" | "outgoing";
export type CallStatus = "answered" | "missed" | "busy" | "failed";

export type Project = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  contact_label: string;
  brand_color: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
};

export type Profile = { id: string; full_name: string | null; email: string | null };

export type Member = {
  project_id: string;
  user_id: string;
  role: MemberRole;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  profile: Profile | null;
};

export type Branch = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};
export type Stage = { id: string; name: string; color: string; position: number; kind: StageKind };
export type Source = { id: string; name: string; is_active: boolean };
export type Service = { id: string; name: string; category: string | null; is_active: boolean };

export type Lead = {
  id: string;
  project_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  stage_id: string;
  source_id: string | null;
  service_id: string | null;
  branch_id: string | null;
  assigned_to: string | null;
  contact_id: string | null;
  notes: string | null;
  follow_up_at: string | null;
  enquiry_count: number;
  last_enquiry_at: string;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  branch_id: string | null;
  service_id: string | null;
  source_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  branch_id: string | null;
  service_id: string | null;
  assigned_to: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  lead?: { id: string; name: string; phone: string | null } | null;
  contact?: { id: string; name: string; phone: string | null } | null;
};

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  due_at: string;
  lead_id: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  lead?: { id: string; name: string; phone: string | null } | null;
};

export type CallLog = {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  phone: string;
  direction: CallDirection;
  status: CallStatus;
  agent_status: string | null;
  handled_by: string | null;
  branch_id: string | null;
  duration_seconds: number;
  recording_url: string | null;
  called_at: string;
};

export type Activity = {
  id: string;
  type: "note" | "stage_change" | "enquiry" | "call" | "appointment" | "system";
  body: string;
  created_at: string;
  author: { full_name: string | null; email: string | null } | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
];

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
};
