import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { listPlayerSummaries, type PlayerSummary } from "@/lib/data/queries";

const SORTABLE = ["name", "ppg", "rpg", "apg", "fgPct", "gamesPlayed", "firstSeason", "lastSeason"] as const;

const Query = z.object({
  q: z.string().trim().max(60).optional(),
  position: z.string().trim().max(20).optional(),
  season: z.coerce.number().int().min(1900).max(2100).optional(),
  jersey: z.string().trim().max(3).optional(),
  sort: z.enum(SORTABLE).default("name"),
  dir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

/** GET /api/players — filter, sort, paginate the player database. */
export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  const { q, position, season, jersey, sort, dir, page, pageSize } = parsed.data;

  let rows = await listPlayerSummaries();
  if (q) rows = rows.filter((p) => p.fullName.toLowerCase().includes(q.toLowerCase()));
  if (position) rows = rows.filter((p) => p.positionAbbr?.toLowerCase() === position.toLowerCase() || p.position?.toLowerCase() === position.toLowerCase());
  if (season) rows = rows.filter((p) => p.seasons.includes(season));
  if (jersey) rows = rows.filter((p) => p.jersey === jersey);

  const key = sort === "name" ? "lastName" : sort;
  rows.sort((a, b) => {
    const av = a[key as keyof PlayerSummary];
    const bv = b[key as keyof PlayerSummary];
    if (av === null) return 1; // nulls last regardless of direction
    if (bv === null) return -1;
    const c = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
    return dir === "asc" ? c : -c;
  });

  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  return NextResponse.json({ total, page, pageSize, items });
}
