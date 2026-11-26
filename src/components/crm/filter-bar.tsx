"use client";

import { FilterIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterDef = {
  key: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

/** Select-based filters that live in the URL so they survive refresh and sharing. */
export function FilterBar({ filters, className, keep = [] }: { filters: FilterDef[]; className?: string; keep?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  const reset = () => {
    const next = new URLSearchParams();
    keep.forEach((k) => params.get(k) && next.set(k, params.get(k)!));
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  return (
    <div className={cn("mb-4 rounded-2xl border bg-card/90 p-3", pending && "opacity-70", className)}>
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((f) => (
          <div key={f.key} className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-56">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{f.label}</span>
            <Select value={params.get(f.key) ?? "all"} onValueChange={(v) => set(f.key, v)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.allLabel}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button variant="outline" className="h-9" onClick={reset}>
          <FilterIcon /> Reset
        </Button>
      </div>
    </div>
  );
}
