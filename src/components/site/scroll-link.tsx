"use client";

export function ScrollLink({ href, className, children }: { href: `#${string}`; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        history.pushState(null, "", href);
      }}
    >
      {children}
    </a>
  );
}
