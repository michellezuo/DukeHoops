import type { Metadata } from "next";
import { listPlayerSummaries, listSeasons } from "@/lib/data/queries";
import { PlayerTable, type PlayerFilters } from "@/components/players/PlayerTable";
import { DataNote, PageHeader } from "@/components/ui/primitives";
import { seasonLabel } from "@/lib/stats";

export const metadata: Metadata = { title: "Players" };

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const sp = await searchParams;
  const [players, seasons] = await Promise.all([listPlayerSummaries(), listSeasons()]);
  const status = str(sp.status);
  const initial: PlayerFilters & { sort?: string; dir?: string } = {
    q: str(sp.q),
    position: str(sp.position),
    season: str(sp.season),
    jersey: str(sp.jersey),
    status: status === "current" || status === "former" ? status : "",
    sort: str(sp.sort),
    dir: str(sp.dir),
  };
  const first = seasons.at(-1)?.season;

  return (
    <>
      <PageHeader
        eyebrow="Player database"
        title="Duke players"
        description="Search, filter, and sort every player on a Duke roster in the dataset. Career numbers cover games played at Duke only."
      />
      <PlayerTable players={players} seasons={seasons.map((s) => s.season)} initial={initial} />
      <div className="mt-6 space-y-1">
        <DataNote>Coverage currently starts with the {first ? seasonLabel(first) : "earliest available"} season (ESPN&apos;s earliest roster data). Earlier eras will be added from historical sources.</DataNote>
        <DataNote>Jersey number, height, and position reflect the player&apos;s most recent ESPN record. A career value is shown as “—” if any season is missing that stat.</DataNote>
      </div>
    </>
  );
}
