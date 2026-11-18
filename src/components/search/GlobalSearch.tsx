"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Search, Trophy, User, Users } from "lucide-react";
import type { SearchHit } from "@/lib/data/queries";
import { cn } from "@/components/ui/primitives";

const ICONS = { player: User, season: CalendarDays, game: Trophy, coach: Users } as const;

/** Typeahead over players, seasons, games, coaches. Enter → full search page. */
export function GlobalSearch({ variant = "header", autoFocus = false }: { variant?: "header" | "hero"; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) return; // dropdown is hidden below 2 chars; stale hits are replaced on next fetch
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          const body = (await res.json()) as { hits: SearchHit[] };
          setHits(body.hits);
          setActive(-1);
        }
      } catch {
        /* aborted or offline — keep previous hits */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && hits[active]) go(hits[active].href);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hero = variant === "hero";
  return (
    <div ref={boxRef} className="relative w-full">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search players, seasons, opponents
      </label>
      <div className="relative">
        <Search aria-hidden className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2", hero ? "h-5 w-5 text-muted" : "h-4 w-4 text-white/60")} />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={hero ? 'Search players, seasons, opponents — or "over 20 points"' : "Search…"}
          className={cn(
            "w-full rounded-lg outline-none focus:ring-2",
            hero
              ? "border border-border bg-surface py-3.5 pl-11 pr-10 text-base text-fg shadow-sm focus:ring-accent"
              : "border border-white/15 bg-white/10 py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/60 focus:bg-white/15 focus:ring-white/40",
          )}
        />
        {loading && <Loader2 aria-hidden className={cn("absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin", hero ? "text-muted" : "text-white/60")} />}
      </div>
      {open && q.trim().length >= 2 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-lg border border-border bg-surface py-1 text-fg shadow-lg">
          {hits.length === 0 && !loading && <li className="px-4 py-3 text-sm text-muted">No direct matches. Press Enter for full search.</li>}
          {hits.map((h, i) => {
            const Icon = ICONS[h.kind];
            return (
              <li key={`${h.kind}-${h.id}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(h.href)}
                  className={cn("flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-2", i === active && "bg-surface-2")}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{h.title}</span>
                    <span className="block truncate text-xs text-muted">{h.subtitle}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
