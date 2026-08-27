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

import { getSessionExtras, findRaceSessionKey } from "./openf1";

describe("getSessionExtras", () => {
  it("maps laps, pit stops, and weather for a session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { driver_number: 1, lap_number: 1, lap_duration: 84.57, is_pit_out_lap: false },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { driver_number: 1, lap_number: 2, pit_duration: 22.4, stop_duration: 2.3 },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { air_temperature: 18.7, track_temperature: 32.9, humidity: 56.2, rainfall: 0, date: "2026-08-23T12:07:04Z" },
        ],
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSessionExtras(11353);

    expect(result).toEqual({
      laps: [{ driverNumber: 1, lapNumber: 1, lapDurationSeconds: 84.57, isPitOutLap: false }],
      pitStops: [{ driverNumber: 1, lapNumber: 2, pitDurationSeconds: 2.3 }],
      weather: [{ airTemp: 18.7, trackTemp: 32.9, humidity: 56.2, rainfallMm: 0, date: "2026-08-23T12:07:04Z" }],
    });
  });

  it("returns null instead of throwing when any upstream call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => undefined }));
    const result = await getSessionExtras(11353);
    expect(result).toBeNull();
  });
});

describe("findRaceSessionKey", () => {
  it("finds the Race session whose date_start matches the given date", async () => {
    mockFetchOnce([
      {
        session_key: 11353,
        meeting_key: 1292,
        session_name: "Race",
        session_type: "Race",
        date_start: "2026-08-23T13:00:00+00:00",
        date_end: "2026-08-23T15:00:00+00:00",
        location: "Zandvoort",
        country_name: "Netherlands",
      },
    ]);

    const result = await findRaceSessionKey("2026", "2026-08-23");
    expect(result).toBe(11353);
  });

  it("returns null when no session matches or the request fails", async () => {
    mockFetchOnce([]);
    expect(await findRaceSessionKey("2026", "2026-01-01")).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await findRaceSessionKey("2026", "2026-08-23")).toBeNull();
  });
});
