import Link from "next/link";
import { io } from "next/cache";
import { getSeasonSchedule } from "@/lib/jolpica";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

export default async function CalendarioPage() {
  let schedule: Awaited<ReturnType<typeof getSeasonSchedule>> = [];
  let loadError = false;

  try {
    schedule = await getSeasonSchedule();
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar o calendário agora.</p>;
  }

  // Marks `Date.now()` below as an intentional per-request read, not a value to
  // freeze into a static shell if Cache Components is ever enabled here — see
  // node_modules/next/dist/docs/.../io.md. The react-hooks/purity rule doesn't
  // know about this Next-specific escape hatch, so it still needs silencing:
  // this Server Component renders once per request (no re-render to be unstable
  // across), only to fade out races already in the past.
  await io();
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Calendário
      </h1>
      <ol className="flex flex-col gap-3">
        {schedule.map((race) => {
          const isPast = new Date(race.sessions.race).getTime() < nowMs;
          return (
            <li
              key={race.round}
              className={`border-l-4 border-line bg-surface p-4 transition-colors hover:bg-surface-raised ${isPast ? "opacity-50" : ""}`}
            >
              <p className="section-label mb-1">Round {String(race.round).padStart(2, "0")}</p>
              <Link
                href={`/resultados/${race.round}`}
                className="text-lg font-bold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {race.raceName}
              </Link>
              <p className="text-sm text-muted">
                <Link href={`/circuitos/${race.circuitId}`} className="hover:text-accent">
                  {race.circuitName}
                </Link>{" "}
                — {race.locality}, {race.country}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {race.sessions.fp1 && (
                  <div>
                    <dt className="section-label text-[0.65rem]">TL1</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.fp1)}</dd>
                  </div>
                )}
                {race.sessions.fp2 && (
                  <div>
                    <dt className="section-label text-[0.65rem]">TL2</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.fp2)}</dd>
                  </div>
                )}
                {race.sessions.fp3 && (
                  <div>
                    <dt className="section-label text-[0.65rem]">TL3</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.fp3)}</dd>
                  </div>
                )}
                {race.sessions.sprintQualifying && (
                  <div>
                    <dt className="section-label text-[0.65rem]">Class. Sprint</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.sprintQualifying)}</dd>
                  </div>
                )}
                {race.sessions.sprint && (
                  <div>
                    <dt className="section-label text-[0.65rem]">Sprint</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.sprint)}</dd>
                  </div>
                )}
                {race.sessions.qualifying && (
                  <div>
                    <dt className="section-label text-[0.65rem]">Classificação</dt>
                    <dd className="tabular-nums">{formatDate(race.sessions.qualifying)}</dd>
                  </div>
                )}
                <div>
                  <dt className="section-label text-[0.65rem] text-accent">Corrida</dt>
                  <dd className="tabular-nums font-semibold">{formatDate(race.sessions.race)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
