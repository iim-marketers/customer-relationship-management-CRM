"use client";

import { ChevronDownIcon } from "lucide-react";
import { updateAppointmentStatus } from "@/app/p/[slug]/(crm)/actions";
import { AppointmentBadge } from "@/components/crm/badges";
import { useAction } from "@/components/crm/use-action";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppointmentStatusMenu({ slug, id, status }: { slug: string; id: string; status: AppointmentStatus }) {
  const { pending, run } = useAction();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-1 rounded-md outline-none", pending && "opacity-50")}>
        <AppointmentBadge status={status} />
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {APPOINTMENT_STATUSES.map((s) => (
          <DropdownMenuItem key={s.value} disabled={s.value === status} onSelect={() => run(() => updateAppointmentStatus(slug, id, s.value))}>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
