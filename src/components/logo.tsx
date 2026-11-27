import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-8 shrink-0 overflow-hidden rounded-[25%] bg-linear-to-br from-[#14a898] to-[#0b5f58]",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="block size-full">
        <g fill="none" strokeWidth="4">
          <path d="M21.34 9.96A8.4 8.4 0 0 0 10.33 9.38" stroke="#5eead4" />
          <path d="M9.66 9.96A8.4 8.4 0 0 0 9.66 22.04" stroke="#b8f5ea" />
          <path d="M10.33 22.62A8.4 8.4 0 0 0 21.34 22.04" stroke="#fff" />
        </g>
        <circle cx="21.34" cy="9.96" r="2" fill="#5eead4" />
        <circle cx="21.34" cy="22.04" r="2" fill="#fff" />
        <circle cx="23.3" cy="16" r="3" fill="#f2645e" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex leading-none", className)}>
      <LogoMark className="size-[1.5em]" />
    </span>
  );
}
