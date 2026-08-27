import { describe, it, expect } from "vitest";
import { getLiveStatus } from "./session-status";
import type { SessionInfo } from "./openf1";

function session(overrides: Partial<SessionInfo>): SessionInfo {
  return {
    sessionKey: 1,
    meetingKey: 1,
    sessionName: "Race",
    sessionType: "Race",
    dateStart: "2026-09-06T13:00:00Z",
    dateEnd: "2026-09-06T15:00:00Z",
    location: "Monza",
    countryName: "Italy",
    ...overrides,
  };
}

describe("getLiveStatus", () => {
  it("reports active:true when now falls within a session window", () => {
    const now = new Date("2026-09-06T14:00:00Z");
    const race = session({});
    const result = getLiveStatus([race], now);
    expect(result).toEqual({ active: true, session: race });
  });

  it("reports the earliest upcoming session when nothing is active", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    const fp1 = session({ sessionKey: 2, sessionName: "Practice 1", dateStart: "2026-09-04T10:30:00Z", dateEnd: "2026-09-04T11:30:00Z" });
    const race = session({ sessionKey: 1, dateStart: "2026-09-06T13:00:00Z", dateEnd: "2026-09-06T15:00:00Z" });
    const result = getLiveStatus([race, fp1], now);
    expect(result).toEqual({ active: false, nextSession: fp1 });
  });

  it("reports nextSession: null when there are no future sessions", () => {
    const now = new Date("2026-12-01T00:00:00Z");
    const race = session({ dateStart: "2026-09-06T13:00:00Z", dateEnd: "2026-09-06T15:00:00Z" });
    const result = getLiveStatus([race], now);
    expect(result).toEqual({ active: false, nextSession: null });
  });
});
