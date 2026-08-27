import Link from "next/link";
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

  const nowMs = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Calendário</h1>
      <ol className="flex flex-col gap-3">
        {schedule.map((race) => {
          const isPast = new Date(race.sessions.race).getTime() < nowMs;
          return (
            <li key={race.round} className={`rounded bg-surface p-4 ${isPast ? "opacity-60" : ""}`}>
              <Link href={`/resultados/${race.round}`} className="font-semibold hover:text-accent">
                Round {race.round} — {race.raceName}
              </Link>
              <p className="text-sm text-muted">
                {race.locality}, {race.country}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                {race.sessions.fp1 && (
                  <div>
                    <dt className="text-muted">TL1</dt>
                    <dd>{formatDate(race.sessions.fp1)}</dd>
                  </div>
                )}
                {race.sessions.fp2 && (
                  <div>
                    <dt className="text-muted">TL2</dt>
                    <dd>{formatDate(race.sessions.fp2)}</dd>
                  </div>
                )}
                {race.sessions.fp3 && (
                  <div>
                    <dt className="text-muted">TL3</dt>
                    <dd>{formatDate(race.sessions.fp3)}</dd>
                  </div>
                )}
                {race.sessions.sprintQualifying && (
                  <div>
                    <dt className="text-muted">Class. Sprint</dt>
                    <dd>{formatDate(race.sessions.sprintQualifying)}</dd>
                  </div>
                )}
                {race.sessions.sprint && (
                  <div>
                    <dt className="text-muted">Sprint</dt>
                    <dd>{formatDate(race.sessions.sprint)}</dd>
                  </div>
                )}
                {race.sessions.qualifying && (
                  <div>
                    <dt className="text-muted">Classificação</dt>
                    <dd>{formatDate(race.sessions.qualifying)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Corrida</dt>
                  <dd className="font-semibold">{formatDate(race.sessions.race)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
