import { describe, it, expect, vi, afterEach } from "vitest";
import { getUpcomingSessions } from "./openf1";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getUpcomingSessions", () => {
  it("maps raw OpenF1 sessions into SessionInfo[], sorted by start time", async () => {
    mockFetchOnce([
      {
        session_key: 11361,
        meeting_key: 1293,
        session_name: "Race",
        session_type: "Race",
        date_start: "2026-09-06T13:00:00+00:00",
        date_end: "2026-09-06T15:00:00+00:00",
        location: "Monza",
        country_name: "Italy",
      },
      {
        session_key: 11354,
        meeting_key: 1293,
        session_name: "Practice 1",
        session_type: "Practice",
        date_start: "2026-09-04T10:30:00+00:00",
        date_end: "2026-09-04T11:30:00+00:00",
        location: "Monza",
        country_name: "Italy",
      },
    ]);

    const result = await getUpcomingSessions();

    expect(result).toEqual([
      {
        sessionKey: 11354,
        meetingKey: 1293,
        sessionName: "Practice 1",
        sessionType: "Practice",
        dateStart: "2026-09-04T10:30:00+00:00",
        dateEnd: "2026-09-04T11:30:00+00:00",
        location: "Monza",
        countryName: "Italy",
      },
      {
        sessionKey: 11361,
        meetingKey: 1293,
        sessionName: "Race",
        sessionType: "Race",
        dateStart: "2026-09-06T13:00:00+00:00",
        dateEnd: "2026-09-06T15:00:00+00:00",
        location: "Monza",
        countryName: "Italy",
      },
    ]);
  });

  it("throws a descriptive error when the upstream request fails", async () => {
    mockFetchOnce(undefined, false, 503);
    await expect(getUpcomingSessions()).rejects.toThrow("OpenF1 request failed: 503");
  });
});
