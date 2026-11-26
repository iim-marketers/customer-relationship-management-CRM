"use client";

import { useState } from "react";
import { createAppointment } from "@/app/p/[slug]/(crm)/actions";
import { Field, SelectField, TextAreaField, TextField, toOptions } from "@/components/crm/fields";
import { RecordPicker, type PickedRecord } from "@/components/crm/record-picker";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ClientLookups } from "@/lib/project";

export function AppointmentDialog({
  slug,
  projectId,
  contactLabel,
  lookups,
  defaultWhen,
  record,
  defaults,
  trigger,
}: {
  slug: string;
  projectId: string;
  contactLabel: string;
  lookups: ClientLookups;
  defaultWhen: string;
  record?: PickedRecord;
  defaults?: { branch_id?: string | null; service_id?: string | null; assigned_to?: string | null };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedRecord | null>(record ?? null);
  const { pending, run } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmitForm((fd) => run(() => createAppointment(slug, fd), () => setOpen(false)))} className="grid gap-4 sm:grid-cols-2">
          <Field label="For" className="sm:col-span-2">
            <input type="hidden" name="lead_id" value={picked?.kind === "lead" ? picked.id : ""} />
            <input type="hidden" name="contact_id" value={picked?.kind === "contact" ? picked.id : ""} />
            {record ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">{record.name}</div>
            ) : (
              <RecordPicker projectId={projectId} contactLabel={contactLabel} value={picked} onChange={setPicked} />
            )}
          </Field>
          <TextField label="Date & time" name="scheduled_at" type="datetime-local" required defaultValue={defaultWhen} />
          <SelectField
            label="Duration"
            name="duration_minutes"
            options={[15, 30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} min` }))}
            defaultValue="30"
          />
          <SelectField label="Branch" name="branch_id" noneLabel="No branch" options={toOptions(lookups.branches)} defaultValue={defaults?.branch_id} />
          <SelectField label="Service" name="service_id" noneLabel="Not set" options={toOptions(lookups.services)} defaultValue={defaults?.service_id} />
          <SelectField
            label="With"
            name="assigned_to"
            noneLabel="Unassigned"
            options={lookups.members.map((m) => ({ value: m.id, label: m.name }))}
            defaultValue={defaults?.assigned_to}
            className="sm:col-span-2"
          />
          <TextAreaField label="Notes" name="notes" rows={2} className="sm:col-span-2" />
          <SubmitButton pending={pending} disabled={!picked} className="sm:col-span-2">
            Book appointment
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
