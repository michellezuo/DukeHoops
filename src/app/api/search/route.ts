import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchAll } from "@/lib/data/queries";

const Query = z.object({ q: z.string().trim().min(1).max(100), limit: z.coerce.number().int().min(1).max(25).default(8) });

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  const hits = await searchAll(parsed.data.q, parsed.data.limit);
  return NextResponse.json({ hits }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
