"use client";

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDaysYmd, weekStart } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** Week strip with a dot under days that have items. Selected day lives in ?date= */
export function DayStrip({ selected, today, marked = [] }: { selected: string; today: string; marked?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const monday = weekStart(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDaysYmd(monday, i));

  const go = (ymd: string) => {
    const next = new URLSearchParams(params);
    if (ymd === today) next.delete("date");
    else next.set("date", ymd);
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  return (
    <div className={cn("mb-4 flex items-center gap-2", pending && "opacity-70")}>
      <Button variant="outline" size="icon" onClick={() => go(addDaysYmd(selected, -7))} aria-label="Previous week">
        <ChevronLeftIcon />
      </Button>
      <div className="grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const active = d === selected;
          return (
            <button
              key={d}
              onClick={() => go(d)}
              className={cn(
                "flex flex-col items-center rounded-xl border bg-card py-2 transition hover:border-primary/50",
                active && "border-primary bg-primary text-primary-foreground hover:border-primary",
              )}
            >
              <span className={cn("text-[10px] font-semibold tracking-wider", !active && "text-muted-foreground")}>{DOW[i]}</span>
              <span className="text-lg leading-tight font-bold sm:text-xl">{Number(d.slice(8))}</span>
              <span
                className={cn(
                  "mt-0.5 size-1.5 rounded-full",
                  marked.includes(d) ? (active ? "bg-primary-foreground" : "bg-warning") : "bg-transparent",
                  d === today && !marked.includes(d) && !active && "bg-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="icon" onClick={() => go(addDaysYmd(selected, 7))} aria-label="Next week">
        <ChevronRightIcon />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Pick a date">
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={new Date(`${selected}T12:00:00`)}
            onSelect={(d) => {
              if (!d) return;
              const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              go(ymd);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
