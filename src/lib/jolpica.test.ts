import { describe, it, expect, vi, afterEach } from "vitest";
import { getDriverStandings, getConstructorStandings } from "./jolpica";

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
