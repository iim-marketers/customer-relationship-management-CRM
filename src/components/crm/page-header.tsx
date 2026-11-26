import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  primary,
  search,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href: string }[];
  primary?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-3 mb-4 border-b bg-card px-3 py-2.5 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {primary}
          <div className="min-w-0">
            <h1 className="flex min-w-0 items-center gap-1.5 text-lg leading-tight">
              {breadcrumbs?.map((b) => (
                <span key={b.href} className="flex shrink-0 items-center gap-1.5">
                  <Link href={b.href} className="text-info hover:underline">
                    {b.label}
                  </Link>
                  <span className="text-muted-foreground">/</span>
                </span>
              ))}
              <span className="truncate font-semibold">{title}</span>
            </h1>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {search && <div className="order-last w-full lg:order-none lg:mx-auto lg:w-auto lg:max-w-xl lg:min-w-96 lg:flex-1">{search}</div>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
