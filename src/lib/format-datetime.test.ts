import { describe, it, expect } from "vitest";
import {
  FALLBACK_TIME_ZONE,
  formatSessionDateTime,
  formatTimeZoneName,
  resolveTimeZone,
} from "./format-datetime";

// 2026 Italian GP: Jolpica reports it at 13:00Z, which is 10:00 in São Paulo.
const MONZA_RACE = "2026-09-06T13:00:00Z";

describe("formatSessionDateTime", () => {
  it("shifts a UTC instant into the given zone", () => {
    expect(formatSessionDateTime(MONZA_RACE, "America/Sao_Paulo")).toBe("6 de setembro de 2026 às 10:00");
  });

  it("leaves the clock reading alone in UTC", () => {
    expect(formatSessionDateTime(MONZA_RACE, FALLBACK_TIME_ZONE)).toBe("6 de setembro de 2026 às 13:00");
  });

  it("rolls the date over when the zone offset crosses midnight", () => {
    // 04:00Z on the 6th is still 22:00 on the 5th in São Paulo (UTC-3).
    expect(formatSessionDateTime("2026-09-06T01:00:00Z", "America/Sao_Paulo")).toBe(
      "5 de setembro de 2026 às 22:00"
    );
    // ...and already 10:00 on the 6th in Tokyo (UTC+9).
    expect(formatSessionDateTime("2026-09-06T01:00:00Z", "Asia/Tokyo")).toBe("6 de setembro de 2026 às 10:00");
  });
});

describe("formatTimeZoneName", () => {
  it("uses the zone's abbreviation where it has one", () => {
    expect(formatTimeZoneName(MONZA_RACE, "America/Sao_Paulo")).toBe("BRT");
    expect(formatTimeZoneName(MONZA_RACE, FALLBACK_TIME_ZONE)).toBe("UTC");
  });

  it("follows DST, so the name depends on the instant", () => {
    expect(formatTimeZoneName("2026-01-15T13:00:00Z", "America/New_York")).toBe("GMT-5");
    expect(formatTimeZoneName("2026-07-15T13:00:00Z", "America/New_York")).toBe("GMT-4");
  });
});

describe("resolveTimeZone", () => {
  it("returns a zone that the formatters accept", () => {
    const timeZone = resolveTimeZone();
    expect(timeZone).not.toBe("");
    expect(() => formatSessionDateTime(MONZA_RACE, timeZone)).not.toThrow();
  });
});
