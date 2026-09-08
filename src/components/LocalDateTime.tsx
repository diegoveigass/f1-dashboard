"use client";

import { useSyncExternalStore } from "react";
import {
  FALLBACK_TIME_ZONE,
  formatSessionDateTime,
  formatTimeZoneName,
  resolveTimeZone,
} from "@/lib/format-datetime";

// A no-op subscribe: the viewer's zone can't change without a reload, so there
// is nothing to listen to. `useSyncExternalStore` is here for its *other* half —
// it renders `getServerSnapshot` (UTC) on the server and through hydration, then
// re-renders with `getSnapshot` once hydration is done. Reading the zone during
// render instead would make the two passes disagree, and React keeps the
// server's text on a mismatch, which is exactly the UTC time we're fixing.
const subscribe = () => () => {};

function useViewerTimeZone(): string {
  return useSyncExternalStore(subscribe, resolveTimeZone, () => FALLBACK_TIME_ZONE);
}

/**
 * A session time in the viewer's own zone, with the UTC instant kept on the
 * element for machines (and on hover for people).
 *
 * `withZone` appends the zone name — worth it for a time that stands alone,
 * repetitive across a grid of times that all share one zone (use
 * `TimeZoneNotice` there instead).
 */
export function LocalDateTime({ iso, withZone = false }: { iso: string; withZone?: boolean }) {
  const timeZone = useViewerTimeZone();

  return (
    <time dateTime={iso} title={`${formatSessionDateTime(iso, FALLBACK_TIME_ZONE)} UTC`}>
      {formatSessionDateTime(iso, timeZone)}
      {withZone && ` ${formatTimeZoneName(iso, timeZone)}`}
    </time>
  );
}

/** One-line legend naming the zone a page's times are shown in. */
export function TimeZoneNotice() {
  const timeZone = useViewerTimeZone();

  return (
    <p className="text-xs text-muted">
      Horários no seu fuso horário — <span className="font-semibold">{timeZone}</span>
    </p>
  );
}
