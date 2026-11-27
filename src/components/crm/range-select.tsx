"use client";

import { CalendarRangeIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_OPTIONS } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Date-range picker bound to the `range` search param. */
export function RangeSelect({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const value = params.get("range") ?? "all";

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === "all") next.delete("range");
        else next.set("range", v);
        start(() => router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false }));
      }}
    >
      <SelectTrigger className={cn("w-44 bg-card", pending && "opacity-70", className)} aria-label="Date range">
        <CalendarRangeIcon className="text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {RANGE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
