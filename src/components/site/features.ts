import {
  BarChart3Icon,
  CalendarCheckIcon,
  KanbanSquareIcon,
  ListTodoIcon,
  PhoneCallIcon,
  RepeatIcon,
  UsersIcon,
  WebhookIcon,
} from "lucide-react";

/** Product modules shown on the landing page and in the header's CRM menu. */
export const FEATURES = [
  { id: "pipeline", icon: KanbanSquareIcon, color: "#714b67", title: "Lead pipeline", body: "Kanban and list views with drag-and-drop stages you define." },
  { id: "follow-ups", icon: ListTodoIcon, color: "#e99d00", title: "Follow-up to-dos", body: "A daily queue of due and overdue follow-ups for every agent." },
  { id: "appointments", icon: CalendarCheckIcon, color: "#017e84", title: "Appointments", body: "Book, confirm, reschedule and track no-shows by branch." },
  { id: "repeat-enquiries", icon: RepeatIcon, color: "#f2645e", title: "Repeat enquiries", body: "The same phone number never creates a duplicate lead." },
  { id: "call-logs", icon: PhoneCallIcon, color: "#28a745", title: "Call logs", body: "Every call with duration, agent and recording, linked to leads." },
  { id: "reports", icon: BarChart3Icon, color: "#5b6dd1", title: "Reports", body: "Conversion funnel, source ROI, service mix and team performance." },
  { id: "team", icon: UsersIcon, color: "#d6145f", title: "Team & branches", body: "Owner, admin, manager and agent roles, per project." },
  { id: "webhook", icon: WebhookIcon, color: "#475577", title: "Lead webhook", body: "Pipe in leads from your site, Meta or Google Ads with one API key." },
] as const;

export function featureTile(color: string) {
  return { background: `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 70%, black))` };
}
