/**
 * Jolpica gives every session time as a UTC instant (`2026-09-06T13:00:00Z`).
 * Formatting one without naming a zone uses the *runtime's* zone — which, for a
 * Server Component, is the server's: UTC in production. That's how the Monza
 * race showed up as 13:00 for a viewer in São Paulo who watched it at 10:00.
 *
 * So none of the formatters here fall back to the ambient zone: the caller
 * always passes one, and the caller that matters passes the viewer's own.
 */

const LOCALE = "pt-BR";

/** Zone used while rendering on the server, before the viewer's is known. */
export const FALLBACK_TIME_ZONE = "UTC";

/** The viewer's IANA zone (`America/Sao_Paulo`). Only meaningful in a browser. */
export function resolveTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

/** e.g. `6 de setembro de 2026 às 10:00` in `America/Sao_Paulo`. */
export function formatSessionDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeStyle: "short", timeZone }).format(new Date(iso));
}

/**
 * Short name of `timeZone` at that instant — `BRT`, `UTC`, or `GMT-3` for zones
 * with no abbreviation. It takes the instant because the answer moves with DST.
 * `timeZoneName` can't be combined with `dateStyle`/`timeStyle` (Intl rejects
 * the mix), hence a second formatter rather than one option bag.
 */
export function formatTimeZoneName(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(LOCALE, { timeZoneName: "short", timeZone }).formatToParts(new Date(iso));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}
