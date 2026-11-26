import { cn } from "@/lib/utils";
import type { AppointmentStatus, CallStatus } from "@/lib/types";

export function ColorBadge({ color, children, className }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap", className)}
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: { name: string; color: string } | undefined | null }) {
  if (!stage) return null;
  return <ColorBadge color={stage.color}>{stage.name}</ColorBadge>;
}

const APPT_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "#6b8afd",
  confirmed: "#14b8a6",
  rescheduled: "#a78bfa",
  completed: "#22c55e",
  no_show: "#f97316",
  cancelled: "#78716c",
};

export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return <ColorBadge color={APPT_COLORS[status]}>{status.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}</ColorBadge>;
}

const CALL_COLORS: Record<CallStatus, string> = {
  answered: "#c2a36b",
  missed: "#ef4444",
  busy: "#f97316",
  failed: "#78716c",
};

export function CallBadge({ status }: { status: CallStatus }) {
  return <ColorBadge color={CALL_COLORS[status]} className="tracking-wider uppercase">{status}</ColorBadge>;
}
