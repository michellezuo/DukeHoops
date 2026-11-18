"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { cn } from "@/components/ui/primitives";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/seasons", label: "Seasons" },
  { href: "/compare", label: "Compare" },
  { href: "/search", label: "Stat Search" },
  { href: "/tenting", label: "Tenting Prep" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-duke-navy text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-black text-duke-royal">D</span>
          <span className="hidden text-lg sm:inline">Duke Hoops Intel</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[0.95rem] font-semibold transition-colors",
                isActive(n.href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto w-full max-w-xs">
          <GlobalSearch variant="header" />
        </div>
        <button
          type="button"
          className="rounded-md p-2 hover:bg-white/10 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-white/10 px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn("block rounded-md px-3 py-2 text-base font-semibold", isActive(n.href) ? "bg-white/15" : "text-white/80")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
