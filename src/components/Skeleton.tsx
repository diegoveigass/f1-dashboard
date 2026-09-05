/**
 * Building blocks for per-route loading.tsx skeleton screens (see
 * docs/superpowers/specs/2026-09-05-loading-skeletons-design.md). Server
 * Components like any other piece of a page — no client JS needed. The pulse
 * animation already respects prefers-reduced-motion via the global rule in
 * globals.css, so nothing extra is needed here for that.
 */

export function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

/** <tr>/<td> rows matching the padding of the app's real data tables. */
export function SkeletonTableRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-l-4 border-line bg-surface">
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col} className="px-3 py-2.5">
              <SkeletonBlock className="h-4 w-24" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** List items matching the Circuitos/Calendário card frame. `as` picks the wrapper tag
 *  so callers can drop this inside a <ul>/<ol> (li) or a <dl> (div). */
export function SkeletonCards({ count, as: Tag = "li" }: { count: number; as?: "li" | "div" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Tag key={index} className="border-l-4 border-line bg-surface p-4">
          <SkeletonBlock className="h-5 w-2/3" />
          <SkeletonBlock className="mt-2 h-4 w-1/3" />
        </Tag>
      ))}
    </>
  );
}

/** List items matching the compact "position — name — value" rows on the home page. */
export function SkeletonListRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex items-center justify-between gap-3 border-l-4 border-line bg-surface px-3 py-2.5"
        >
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-4 w-12" />
        </li>
      ))}
    </>
  );
}

/** Eyebrow + title placeholder for a profile page header — the real text only exists
 *  after the fetch. `extraLines` adds detail-line placeholders below the title for
 *  headers that also show e.g. a nationality line or a stat chip row. */
export function SkeletonProfileHeader({ extraLines = 0 }: { extraLines?: number }) {
  return (
    <section className="border-b-2 border-line pb-5">
      <SkeletonBlock className="h-3 w-28" />
      <SkeletonBlock className="mt-2 h-8 w-72 max-w-full" />
      {Array.from({ length: extraLines }).map((_, index) => (
        <SkeletonBlock key={index} className="mt-2 h-4 w-40" />
      ))}
    </section>
  );
}
