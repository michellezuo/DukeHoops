"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { seasonLabel } from "@/lib/stats";

export interface PickerPlayer {
  id: string;
  name: string;
  first: number;
  last: number;
}

import { MAX_COMPARE } from "@/lib/compare";

/** Add/remove players; selection lives in the URL (?players=a,b) so comparisons are shareable. */
export function PlayerPicker({ all, selected }: { all: PickerPlayer[]; selected: PickerPlayer[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const ids = selected.map((s) => s.id);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    return all.filter((p) => !ids.includes(p.id) && p.name.toLowerCase().includes(n)).slice(0, 8);
  }, [q, all, ids]);

  const push = (next: string[]) => router.push(next.length ? `/compare?players=${next.join(",")}` : "/compare", { scroll: false });

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-2" aria-label="Selected players">
        {selected.map((p) => (
          <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-sm">
            {p.name} <span className="text-xs text-muted">{seasonLabel(p.first)}{p.first !== p.last && `–${String(p.last).slice(-2)}`}</span>
            <button type="button" aria-label={`Remove ${p.name}`} onClick={() => push(ids.filter((i) => i !== p.id))} className="rounded-full p-1 hover:bg-surface-2">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {selected.length < MAX_COMPARE && (
        <div className="relative max-w-sm">
          <Plus aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            aria-label="Add a player to compare"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={selected.length ? "Add another player…" : "Type a player name…"}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface py-1 shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { setQ(""); push([...ids, p.id]); }} className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-surface-2">
                    <span>{p.name}</span>
                    <span className="text-xs text-muted">{seasonLabel(p.first)}{p.first !== p.last && `–${String(p.last).slice(-2)}`}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
