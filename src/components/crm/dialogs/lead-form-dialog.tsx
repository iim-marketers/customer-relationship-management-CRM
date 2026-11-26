"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLead, updateLead } from "@/app/p/[slug]/(crm)/actions";
import { SelectField, TextAreaField, TextField, toOptions } from "@/components/crm/fields";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toZonedInput } from "@/lib/dates";
import type { ClientLookups } from "@/lib/project";
import type { Lead } from "@/lib/types";

export function LeadFormDialog({
  slug,
  tz,
  lookups,
  lead,
  defaultStageId,
  trigger,
}: {
  slug: string;
  tz: string;
  lookups: ClientLookups;
  lead?: Lead;
  defaultStageId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const router = useRouter();
  const editing = Boolean(lead);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit lead" : "Add lead"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update details, stage and follow-up." : "If the phone number already exists, it's logged as a repeat enquiry instead."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmitForm((fd) =>
            run(
              () => (lead ? updateLead(slug, lead.id, fd) : createLead(slug, fd)),
              (r) => {
                setOpen(false);
                const created = r.data as { id: string } | undefined;
                if (!editing && created?.id) router.push(`/p/${slug}/leads/${created.id}`);
              },
            ),
          )}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TextField label="Name" name="name" required defaultValue={lead?.name} placeholder="Full name" />
          <TextField label="Phone" name="phone" type="tel" defaultValue={lead?.phone ?? ""} placeholder="+91…" />
          <TextField label="Email" name="email" type="email" defaultValue={lead?.email ?? ""} />
          <SelectField
            label="Stage"
            name="stage_id"
            options={lookups.stages.map((s) => ({ value: s.id, label: s.name }))}
            defaultValue={lead?.stage_id ?? defaultStageId ?? lookups.stages[0]?.id}
          />
          <SelectField label="Source" name="source_id" noneLabel="Not set" options={toOptions(lookups.sources, lead?.source_id)} defaultValue={lead?.source_id} />
          <SelectField label="Service" name="service_id" noneLabel="Not set" options={toOptions(lookups.services, lead?.service_id)} defaultValue={lead?.service_id} />
          <SelectField label="Branch" name="branch_id" noneLabel="No branch" options={toOptions(lookups.branches, lead?.branch_id)} defaultValue={lead?.branch_id} />
          <SelectField
            label="Assigned to"
            name="assigned_to"
            noneLabel="Unassigned"
            options={lookups.members.map((m) => ({ value: m.id, label: m.name }))}
            defaultValue={lead?.assigned_to}
          />
          <TextField label="Follow-up" name="follow_up_at" type="datetime-local" defaultValue={toZonedInput(lead?.follow_up_at, tz)} />
          <div className="hidden sm:block" />
          <TextAreaField label="Notes / enquiry" name="notes" defaultValue={lead?.notes ?? ""} rows={3} className="sm:col-span-2" />
          <SubmitButton pending={pending} className="sm:col-span-2">
            {editing ? "Save changes" : "Add lead"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
