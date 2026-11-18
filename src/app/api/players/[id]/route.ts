import { NextResponse } from "next/server";
import { getPlayerProfile } from "@/lib/data/queries";

/** GET /api/players/:id — full profile (bio, season stats, career line, game logs). */
export async function GET(_req: Request, ctx: RouteContext<"/api/players/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const profile = await getPlayerProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}
