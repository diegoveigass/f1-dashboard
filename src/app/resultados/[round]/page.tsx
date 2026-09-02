import { getRaceResults, getQualifyingResults } from "@/lib/jolpica";
import { findRaceSessionKey, getSessionExtras } from "@/lib/openf1";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function ResultadosPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;

  let result: Awaited<ReturnType<typeof getRaceResults>> | null = null;
  let loadError = false;
  try {
    result = await getRaceResults("current", round);
  } catch {
    loadError = true;
  }

  if (loadError || !result) {
    return <p className="text-muted">Não foi possível carregar o resultado desta corrida agora.</p>;
  }

  // OpenF1 enrichment is optional — silently omitted if the session can't be found
  // or its data isn't available yet (e.g. still inside the live-only window).
  const sessionKey = await findRaceSessionKey(result.season, result.date);
  const extras = sessionKey ? await getSessionExtras(sessionKey) : null;

  // Qualifying is a separate Jolpica endpoint from the race result — best-effort,
  // same as the OpenF1 extras: an old/incomplete round just omits the section.
  let qualifying: Awaited<ReturnType<typeof getQualifyingResults>> | null = null;
  try {
    qualifying = await getQualifyingResults(result.season, result.round);
  } catch {
    qualifying = null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b-2 border-accent pb-4">
        <p className="section-label mb-1">Round {String(result.round).padStart(2, "0")}</p>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">{result.raceName}</h1>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="section-label">Resultado da corrida</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted">Grid</th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted">+/-</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Status</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((entry) => {
              // grid 0 means a pit lane start (no real grid slot); null means
              // Jolpica omitted the field entirely — neither has a meaningful delta.
              const positionChange =
                entry.grid !== null && entry.grid > 0 ? entry.grid - entry.position : null;

              return (
                <tr
                  key={entry.driver.id}
                  className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                  style={{ borderColor: getConstructorColor(entry.constructorId) }}
                >
                  <td className="px-3 py-2.5 tabular-nums text-muted">{entry.position}</td>
                  <td className="px-3 py-2.5 font-semibold">
                    {entry.driver.givenName} {entry.driver.familyName}
                    {entry.fastestLapRank === 1 && (
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-foreground"
                        style={{ backgroundColor: "var(--color-fastest)" }}
                        title="Volta mais rápida da corrida"
                      >
                        VR
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{entry.constructorName}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-muted">
                    {entry.grid === null ? "—" : entry.grid === 0 ? "PIT" : entry.grid}
                    {entry.grid === 1 && (
                      <span
                        className="ml-1.5 rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-foreground"
                        style={{ backgroundColor: "var(--color-accent)" }}
                        title="Pole position"
                      >
                        Pole
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-semibold">
                    {positionChange === null ? (
                      <span className="text-muted">—</span>
                    ) : positionChange > 0 ? (
                      <span style={{ color: "var(--color-gained)" }}>+{positionChange}</span>
                    ) : positionChange < 0 ? (
                      <span className="text-accent">{positionChange}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{entry.status}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{entry.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {qualifying && qualifying.results.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="section-label">Classificação (Qualifying)</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Q1</th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Q2</th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Q3</th>
              </tr>
            </thead>
            <tbody>
              {qualifying.results.map((entry) => (
                <tr
                  key={entry.driver.id}
                  className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                  style={{ borderColor: getConstructorColor(entry.constructorId) }}
                >
                  <td className="px-3 py-2.5 tabular-nums text-muted">{entry.position}</td>
                  <td className="px-3 py-2.5 font-semibold">
                    {entry.driver.givenName} {entry.driver.familyName}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{entry.constructorName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{entry.q1 ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{entry.q2 ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                    {entry.q3 ?? <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {extras && extras.weather.length > 0 && (
        <section className="border-l-4 border-line bg-surface p-4 text-sm">
          <h2 className="section-label mb-2">Clima na corrida</h2>
          <p className="tabular-nums text-muted">
            Ar: {extras.weather[0].airTemp}°C · Pista: {extras.weather[0].trackTemp}°C · Umidade:{" "}
            {extras.weather[0].humidity}% · Chuva: {extras.weather[0].rainfallMm}mm
          </p>
        </section>
      )}

      {extras && extras.pitStops.length > 0 && (
        <section className="border-l-4 border-line bg-surface p-4 text-sm">
          <h2 className="section-label mb-2">Pit stops</h2>
          <ul className="flex flex-col gap-1 text-muted">
            {extras.pitStops.map((stop, index) => (
              <li key={index} className="tabular-nums">
                Carro #{stop.driverNumber} — volta {stop.lapNumber} — {stop.pitDurationSeconds.toFixed(1)}s
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
