import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-svh items-center justify-center px-4 py-10">{children}</main>;
}

export function AuthCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border bg-card/80 p-8 shadow-2xl shadow-black/20 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
