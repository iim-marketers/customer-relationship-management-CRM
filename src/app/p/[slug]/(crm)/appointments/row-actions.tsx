"use client";

import { CalendarClockIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { deleteAppointment, rescheduleAppointment } from "@/app/p/[slug]/(crm)/actions";
import { useAction } from "@/components/crm/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toZonedInput } from "@/lib/dates";

export function AppointmentRowActions({
  slug,
  id,
  tz,
  scheduledAt,
  canDelete,
}: {
  slug: string;
  id: string;
  tz: string;
  scheduledAt: string;
  canDelete: boolean;
}) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [wall, setWall] = useState(toZonedInput(scheduledAt, tz));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Appointment actions" disabled={pending}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <CalendarClockIcon /> Reschedule
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem variant="destructive" onSelect={() => run(() => deleteAppointment(slug, id))}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule</DialogTitle>
          </DialogHeader>
          <Input type="datetime-local" value={wall} onChange={(e) => setWall(e.target.value)} />
          <Button disabled={pending || !wall} onClick={() => run(() => rescheduleAppointment(slug, id, wall), () => setOpen(false))}>
            Save new time
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
