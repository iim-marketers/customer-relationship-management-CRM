"use client";

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type PickedRecord = { kind: "lead" | "contact"; id: string; name: string; phone: string | null };

/** Type-ahead search over leads and contacts (RLS scopes results to the project). */
export function RecordPicker({
  projectId,
  contactLabel,
  value,
  onChange,
  kinds = ["lead", "contact"],
}: {
  projectId: string;
  contactLabel: string;
  value: PickedRecord | null;
  onChange: (r: PickedRecord | null) => void;
  kinds?: ("lead" | "contact")[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const kindKey = kinds.join(",");

  useEffect(() => {
    clearTimeout(timer.current);
    const term = q.trim();
    if (term.length < 2) return; // dropdown is hidden below 2 chars
    timer.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const safe = term.replace(/[%,()]/g, " ");
      const filter = `name.ilike.%${safe}%,phone.ilike.%${safe}%`;
      const [leads, contacts] = await Promise.all([
        kindKey.includes("lead")
          ? supabase.from("leads").select("id, name, phone").eq("project_id", projectId).or(filter).limit(6)
          : Promise.resolve({ data: [] }),
        kindKey.includes("contact")
          ? supabase.from("contacts").select("id, name, phone").eq("project_id", projectId).or(filter).limit(6)
          : Promise.resolve({ data: [] }),
      ]);
      setResults([
        ...(contacts.data ?? []).map((r) => ({ kind: "contact" as const, ...r })),
        ...(leads.data ?? []).map((r) => ({ kind: "lead" as const, ...r })),
      ]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q, projectId, kindKey]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{value.name}</div>
          <div className="text-xs text-muted-foreground">
            {value.kind === "lead" ? "Lead" : contactLabel.replace(/s$/, "")} · {value.phone ?? "no phone"}
          </div>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Clear">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone…" className="pl-9" />
      {q.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>}
          {!loading && results.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>}
          {results.map((r) => (
            <button
              type="button"
              key={`${r.kind}-${r.id}`}
              onClick={() => {
                onChange(r);
                setQ("");
              }}
              className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted")}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.phone ?? "no phone"}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {r.kind === "lead" ? "Lead" : contactLabel.replace(/s$/, "")}
                <CheckIcon className="size-3 opacity-0" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
