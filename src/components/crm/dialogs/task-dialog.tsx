"use client";

import { useState } from "react";
import { createTask } from "@/app/p/[slug]/(crm)/actions";
import { Field, SelectField, TextAreaField, TextField } from "@/components/crm/fields";
import { RecordPicker, type PickedRecord } from "@/components/crm/record-picker";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ClientLookups } from "@/lib/project";

export function TaskDialog({
  slug,
  projectId,
  contactLabel,
  lookups,
  defaultDue,
  lead,
  currentUserId,
  trigger,
}: {
  slug: string;
  projectId: string;
  contactLabel: string;
  lookups: ClientLookups;
  defaultDue: string;
  lead?: PickedRecord;
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedRecord | null>(lead ?? null);
  const { pending, run } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmitForm((fd) => run(() => createTask(slug, fd), () => setOpen(false)))} className="grid gap-4">
          <TextField label="Task" name="title" required placeholder="e.g. Call back about pricing" />
          <TextField label="Due" name="due_at" type="datetime-local" required defaultValue={defaultDue} />
          <Field label="Related lead (optional)">
            <input type="hidden" name="lead_id" value={picked?.kind === "lead" ? picked.id : ""} />
            <RecordPicker projectId={projectId} contactLabel={contactLabel} value={picked} onChange={setPicked} kinds={["lead"]} />
          </Field>
          <SelectField
            label="Assign to"
            name="assigned_to"
            options={lookups.members.map((m) => ({ value: m.id, label: m.name }))}
            defaultValue={currentUserId}
          />
          <TextAreaField label="Notes" name="notes" rows={2} />
          <SubmitButton pending={pending}>Add task</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
