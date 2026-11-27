"use client";

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ColorBadge } from "@/components/crm/badges";
import { Field, SelectField, TextField } from "@/components/crm/fields";
import { EmptyState } from "@/components/crm/panel";
import { onSubmitForm, useAction } from "@/components/crm/use-action";
import { SubmitButton } from "@/components/submit-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMasterRecord, moveStage, saveMasterRecord, setMasterActive } from "./actions";
import { MASTER_TABLES, type MasterTable } from "./master-config";

export type MasterRow = { id: string } & Record<string, unknown>;

function RecordDialog({
  slug,
  table,
  row,
  trigger,
}: {
  slug: string;
  table: MasterTable;
  row?: MasterRow;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  const config = MASTER_TABLES[table];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {row ? "Edit" : "Add"} {config.singular}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmitForm((fd) => run(() => saveMasterRecord(slug, table, row?.id ?? null, fd), () => setOpen(false)))}
          className="grid gap-4"
        >
          {config.fields.map((f) => {
            const value = row?.[f.name];
            if (f.type === "switch") {
              return (
                <label key={f.name} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                  {f.label}
                  <Switch name={f.name} defaultChecked={row ? Boolean(value) : true} />
                </label>
              );
            }
            if (f.type === "color") {
              return (
                <Field key={f.name} label={f.label} htmlFor={`m-${f.name}`}>
                  <input
                    id={`m-${f.name}`}
                    name={f.name}
                    type="color"
                    defaultValue={(value as string) ?? "#0f766e"}
                    className="h-9 w-20 cursor-pointer rounded-lg border bg-transparent p-1"
                  />
                </Field>
              );
            }
            if (f.type === "select") {
              return (
                <SelectField
                  key={f.name}
                  label={f.label}
                  name={f.name}
                  options={f.options ?? []}
                  defaultValue={(value as string) ?? f.options?.[0]?.value}
                />
              );
            }
            return (
              <TextField
                key={f.name}
                label={f.label}
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={(value as string) ?? ""}
              />
            );
          })}
          <SubmitButton pending={pending}>{row ? "Save" : "Add"}</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MasterList({ slug, table, rows, isAdmin }: { slug: string; table: MasterTable; rows: MasterRow[]; isAdmin: boolean }) {
  const config = MASTER_TABLES[table];
  const { pending, run } = useAction();
  const columns = config.fields.filter((f) => "column" in f && f.column);
  const hasActive = config.fields.some((f) => f.name === "is_active");
  const isStages = table === "lead_stages";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">{config.description}</p>
        {isAdmin && (
          <RecordDialog
            slug={slug}
            table={table}
            trigger={
              <Button size="sm">
                <PlusIcon /> Add {config.singular}
              </Button>
            }
          />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState>No {config.title.toLowerCase()} yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {isStages && <TableHead className="w-24">Order</TableHead>}
                {columns.map((c) => (
                  <TableHead key={c.name}>{c.label}</TableHead>
                ))}
                {hasActive && <TableHead className="w-24">Active</TableHead>}
                {isAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id}>
                  {isStages && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={pending || i === 0}
                              aria-label="Move up"
                              onClick={() => run(() => moveStage(slug, row.id, "up"))}
                            >
                              <ArrowUpIcon />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={pending || i === rows.length - 1}
                              aria-label="Move down"
                              onClick={() => run(() => moveStage(slug, row.id, "down"))}
                            >
                              <ArrowDownIcon />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell key={c.name} className={c.name === "name" ? "font-medium" : "text-muted-foreground"}>
                      {isStages && c.name === "name" ? (
                        <ColorBadge color={String(row.color ?? "#0f766e")}>{String(row.name)}</ColorBadge>
                      ) : c.type === "select" ? (
                        (c.options?.find((o) => o.value === row[c.name])?.label ?? String(row[c.name] ?? "—"))
                      ) : (
                        String(row[c.name] ?? "—") || "—"
                      )}
                    </TableCell>
                  ))}
                  {hasActive && (
                    <TableCell>
                      <Switch
                        checked={Boolean(row.is_active)}
                        disabled={!isAdmin || pending}
                        onCheckedChange={(v) => run(() => setMasterActive(slug, table, row.id, v))}
                        aria-label="Active"
                      />
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <RecordDialog
                          slug={slug}
                          table={table}
                          row={row}
                          trigger={
                            <Button variant="outline" size="icon-sm" aria-label="Edit">
                              <PencilIcon />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon-sm" aria-label="Delete">
                              <Trash2Icon />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete “{String(row.name)}”?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {isStages
                                  ? "Stages that still contain leads can't be deleted."
                                  : `Records using this ${config.singular} will keep working but show it as not set.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => run(() => deleteMasterRecord(slug, table, row.id))}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
