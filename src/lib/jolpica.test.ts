import { describe, it, expect, vi, afterEach } from "vitest";
import { getDriverStandings, getConstructorStandings } from "./jolpica";
import { getSeasonSchedule } from "./jolpica";

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

describe("getDriverStandings", () => {
  it("maps raw Jolpica driver standings into DriverStanding[]", async () => {
    mockFetchOnce({
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              DriverStandings: [
                {
                  position: "1",
                  points: "242",
                  wins: "6",
                  Driver: {
                    driverId: "antonelli",
                    permanentNumber: "12",
                    code: "ANT",
                    givenName: "Andrea Kimi",
                    familyName: "Antonelli",
                    nationality: "Italian",
                  },
                  Constructors: [
                    { constructorId: "mercedes", name: "Mercedes", nationality: "German" },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getDriverStandings("2026");

    expect(result).toEqual([
      {
        position: 1,
        points: 242,
        wins: 6,
        driver: {
          id: "antonelli",
          code: "ANT",
          number: 12,
          givenName: "Andrea Kimi",
          familyName: "Antonelli",
          nationality: "Italian",
        },
        constructorId: "mercedes",
        constructorName: "Mercedes",
      },
    ]);
  });

  it("throws a descriptive error when the upstream request fails", async () => {
    mockFetchOnce(undefined, false, 503);
    await expect(getDriverStandings("2026")).rejects.toThrow("Jolpica request failed: 503");
  });
});

describe("getConstructorStandings", () => {
  it("maps raw Jolpica constructor standings into ConstructorStanding[]", async () => {
    mockFetchOnce({
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              ConstructorStandings: [
                {
                  position: "1",
                  points: "425",
                  wins: "8",
                  Constructor: { constructorId: "mercedes", name: "Mercedes", nationality: "German" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getConstructorStandings("2026");

    expect(result).toEqual([
      { position: 1, points: 425, wins: 8, constructorId: "mercedes", name: "Mercedes", nationality: "German" },
    ]);
  });
});

describe("getSeasonSchedule", () => {
  it("maps raw races into RaceScheduleEntry[], combining date+time into ISO strings", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          Races: [
            {
              season: "2026",
              round: "2",
              raceName: "Chinese Grand Prix",
              Circuit: {
                circuitName: "Shanghai International Circuit",
                Location: { locality: "Shanghai", country: "China" },
              },
              date: "2026-03-15",
              time: "07:00:00Z",
              FirstPractice: { date: "2026-03-13", time: "03:30:00Z" },
              Qualifying: { date: "2026-03-14", time: "07:00:00Z" },
              Sprint: { date: "2026-03-14", time: "03:00:00Z" },
              SprintQualifying: { date: "2026-03-13", time: "07:30:00Z" },
            },
          ],
        },
      },
    });

    const result = await getSeasonSchedule("2026");

    expect(result).toEqual([
      {
        season: "2026",
        round: 2,
        raceName: "Chinese Grand Prix",
        circuitName: "Shanghai International Circuit",
        locality: "Shanghai",
        country: "China",
        sessions: {
          fp1: "2026-03-13T03:30:00Z",
          fp2: undefined,
          fp3: undefined,
          sprintQualifying: "2026-03-13T07:30:00Z",
          sprint: "2026-03-14T03:00:00Z",
          qualifying: "2026-03-14T07:00:00Z",
          race: "2026-03-15T07:00:00Z",
        },
      },
    ]);
  });
});

import { getRaceResults, getDriverInfo, getDriverSeasonResults } from "./jolpica";

describe("getRaceResults", () => {
  it("maps raw race results into RaceResult", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          season: "2026",
          round: "1",
          Races: [
            {
              raceName: "Australian Grand Prix",
              date: "2026-03-08",
              Results: [
                {
                  position: "1",
                  points: "25",
                  status: "Finished",
                  Driver: { driverId: "russell", code: "RUS", givenName: "George", familyName: "Russell" },
                  Constructor: { constructorId: "mercedes", name: "Mercedes" },
                  Time: { time: "1:23:06.801" },
                  FastestLap: { rank: "6" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getRaceResults("2026", 1);

    expect(result).toEqual({
      season: "2026",
      round: 1,
      raceName: "Australian Grand Prix",
      date: "2026-03-08",
      results: [
        {
          position: 1,
          status: "Finished",
          points: 25,
          driver: { id: "russell", code: "RUS", givenName: "George", familyName: "Russell" },
          constructorId: "mercedes",
          constructorName: "Mercedes",
          time: "1:23:06.801",
          fastestLapRank: 6,
        },
      ],
    });
  });

  it("throws when the round has no race data", async () => {
    mockFetchOnce({ MRData: { RaceTable: { season: "2026", round: "99", Races: [] } } });
    await expect(getRaceResults("2026", 99)).rejects.toThrow("No results found for 2026 round 99");
  });
});

describe("getDriverInfo", () => {
  it("maps raw driver info into DriverInfo", async () => {
    mockFetchOnce({
      MRData: {
        DriverTable: {
          Drivers: [
            {
              driverId: "norris",
              permanentNumber: "4",
              code: "NOR",
              givenName: "Lando",
              familyName: "Norris",
              nationality: "British",
            },
          ],
        },
      },
    });

    const result = await getDriverInfo("norris");

    expect(result).toEqual({
      id: "norris",
      code: "NOR",
      number: 4,
      givenName: "Lando",
      familyName: "Norris",
      nationality: "British",
    });
  });

  it("throws when the driver id does not exist", async () => {
    mockFetchOnce({ MRData: { DriverTable: { Drivers: [] } } });
    await expect(getDriverInfo("nobody")).rejects.toThrow("Driver not found: nobody");
  });
});

describe("getDriverSeasonResults", () => {
  it("maps one result per round into DriverRaceSummary[]", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          Races: [
            {
              round: "1",
              raceName: "Australian Grand Prix",
              Results: [
                {
                  position: "5",
                  points: "10",
                  status: "Finished",
                  Constructor: { constructorId: "mclaren", name: "McLaren" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getDriverSeasonResults("2026", "norris");

    expect(result).toEqual([
      {
        round: 1,
        raceName: "Australian Grand Prix",
        position: 5,
        points: 10,
        status: "Finished",
        constructorId: "mclaren",
        constructorName: "McLaren",
      },
    ]);
  });
});
