"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({ label, htmlFor, className, children }: { label: string; htmlFor?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function TextField({ label, name, className, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <Field label={label} htmlFor={name} className={className}>
      <Input id={name} name={name} {...props} />
    </Field>
  );
}

export function TextAreaField({ label, name, className, ...props }: { label: string; name: string } & React.ComponentProps<typeof Textarea>) {
  return (
    <Field label={label} htmlFor={name} className={className}>
      <Textarea id={name} name={name} {...props} />
    </Field>
  );
}

/** Form-bound select. Radix renders a hidden native <select name=…>; "none" → null on the server. */
export function SelectField({
  label,
  name,
  options,
  defaultValue,
  noneLabel,
  placeholder = "Select…",
  className,
  required,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} className={className}>
      <Select name={name} defaultValue={defaultValue ?? (noneLabel ? "none" : undefined)} required={required}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel && <SelectItem value="none">{noneLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export const toOptions = (rows: { id: string; name: string; is_active?: boolean }[], keep?: string | null) =>
  rows.filter((r) => r.is_active !== false || r.id === keep).map((r) => ({ value: r.id, label: r.name }));
