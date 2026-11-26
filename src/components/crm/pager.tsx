import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 50;

/** Parse ?page= (1-based) into a page number and a Supabase .range() window. */
export function pageWindow(page: string | undefined, size = PAGE_SIZE) {
  const n = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  return { page: n, from: (n - 1) * size, to: n * size - 1 };
}

/** Prev/next links that keep the current filters in the URL. */
export function Pager({
  pathname,
  searchParams,
  page,
  total,
  size = PAGE_SIZE,
}: {
  pathname: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  total: number;
  size?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const next = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => v && k !== "page" && next.set(k, v));
    if (p > 1) next.set("page", String(p));
    return `${pathname}${next.size ? `?${next}` : ""}`;
  };
  const start = (page - 1) * size + 1;
  const end = Math.min(total, page * size);

  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)} scroll={false}>
              <ChevronLeftIcon /> Prev
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeftIcon /> Prev
          </Button>
        )}
        <span className="tabular-nums">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)} scroll={false}>
              Next <ChevronRightIcon />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRightIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
