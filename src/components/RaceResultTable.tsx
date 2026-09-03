import Link from "next/link";
import type { RaceResultEntry } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

/**
 * Renders a race-style result table (Pos./Piloto/Equipe/Grid/+/-/Status/Pontos).
 * Shared by the race result and sprint result sections on the results page —
 * Jolpica returns the same entry shape for both.
 */
export function RaceResultTable({ title, results }: { title: string; results: RaceResultEntry[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="section-label">{title}</h2>
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
          {results.map((entry) => {
            // grid 0 means a pit lane start (no real grid slot); null means
            // Jolpica omitted the field entirely — neither has a meaningful delta.
            const positionChange = entry.grid !== null && entry.grid > 0 ? entry.grid - entry.position : null;

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
                      title="Volta mais rápida"
                    >
                      VR
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted">
                  <Link href={`/construtores/${entry.constructorId}`} className="hover:text-accent">
                    {entry.constructorName}
                  </Link>
                </td>
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
  );
}
