"use client";

import { ChevronDownIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterDef = {
  key: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

export function FilterBar({ filters, className, keep = [] }: { filters: FilterDef[]; className?: string; keep?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const base = pathname.split("/").slice(0, 3).join("/");

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

  const facets = filters.flatMap((f) => {
    const v = params.get(f.key);
    if (!v) return [];
    return [{ key: f.key, label: f.label, value: f.options.find((o) => o.value === v)?.label ?? v }];
  });

  return (
    <div
      className={cn(
        "flex min-h-9 w-full items-stretch rounded-md border bg-card transition-colors focus-within:border-info",
        pending && "opacity-70",
        className,
      )}
    >
      <form
        className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1 pr-1 pl-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q")?.toString().trim();
          if (q) router.push(`${base}/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        {facets.map((f) => (
          <span key={f.key} className="flex max-w-full items-center overflow-hidden rounded-sm bg-muted text-xs">
            <span className="grid self-stretch place-items-center bg-primary px-1.5 text-primary-foreground">
              <FilterIcon className="size-3" />
            </span>
            <span className="truncate px-1.5 py-0.5">
              <span className="text-muted-foreground">{f.label}:</span> {f.value}
            </span>
            <button type="button" onClick={() => set(f.key, "all")} className="px-1 py-0.5 text-muted-foreground hover:text-foreground" aria-label={`Remove ${f.label} filter`}>
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input name="q" placeholder="Search…" className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
      </form>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="flex items-center border-l px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted" aria-label="Toggle search panel">
            <ChevronDownIcon className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(36rem,calc(100vw-1.5rem))] p-0">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FilterIcon className="size-4 text-primary" /> Filters
            </span>
            {facets.length > 0 && (
              <button type="button" onClick={reset} className="text-xs font-medium text-info hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {filters.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                <Select value={params.get(f.key) ?? "all"} onValueChange={(v) => set(f.key, v)}>
                  <SelectTrigger className="h-8 w-full">
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
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
