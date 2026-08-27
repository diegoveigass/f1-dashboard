import { getDriverStandings, getConstructorStandings, getSeasonSchedule, type RaceScheduleEntry } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

function findNextRace(schedule: RaceScheduleEntry[]): RaceScheduleEntry | null {
  const nowMs = Date.now();
  return schedule.find((race) => new Date(race.sessions.race).getTime() > nowMs) ?? null;
}

export default async function DashboardPage() {
  let drivers: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructors: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let nextRace: RaceScheduleEntry | null = null;
  let loadError = false;

  try {
    const [driverStandings, constructorStandings, schedule] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
      getSeasonSchedule(),
    ]);
    drivers = driverStandings;
    constructors = constructorStandings;
    nextRace = findNextRace(schedule);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar os dados do campeonato agora. Tente novamente em instantes.</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="border-b-2 border-accent pb-5">
        {/* Five dots, lit red — a still frame of F1's own start-lights sequence,
            standing in for "the next session is on its way". */}
        <div className="mb-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-accent" />
          ))}
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Painel do Campeonato</h1>
        {nextRace ? (
          <p className="mt-2 text-muted">
            Próxima corrida: <strong className="text-foreground">{nextRace.raceName}</strong> em{" "}
            <span className="tabular-nums">
              {new Date(nextRace.sessions.race).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-muted">Nenhuma corrida futura agendada nesta temporada.</p>
        )}
      </section>

      <section>
        <h2 className="section-label mb-3">Top 5 — Pilotos</h2>
        <ol className="flex flex-col gap-1">
          {drivers.slice(0, 5).map((standing) => (
            <li
              key={standing.driver.id}
              className="flex items-center justify-between gap-3 border-l-4 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-raised"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span className="flex items-baseline gap-3">
                <span className="tabular-nums text-muted">{standing.position}</span>
                <span className="font-semibold">
                  {standing.driver.givenName} {standing.driver.familyName}
                </span>
              </span>
              <span className="tabular-nums font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="section-label mb-3">Top 5 — Construtores</h2>
        <ol className="flex flex-col gap-1">
          {constructors.slice(0, 5).map((standing) => (
            <li
              key={standing.constructorId}
              className="flex items-center justify-between gap-3 border-l-4 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-raised"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span className="flex items-baseline gap-3">
                <span className="tabular-nums text-muted">{standing.position}</span>
                <span className="font-semibold">{standing.name}</span>
              </span>
              <span className="tabular-nums font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
