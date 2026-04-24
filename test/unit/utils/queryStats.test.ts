import {
  __resetQueryStatsForTests,
  getQueryStatsSnapshot,
  recordQueryStat,
} from "../../../src/server/utils/db/queryStats.ts";

describe("queryStats", () => {
  beforeEach(() => {
    __resetQueryStatsForTests();
  });

  test("aggregates counts and durations by operation", () => {
    recordQueryStat({ model: "ballots", action: "findMany", durationMs: 20, success: true });
    recordQueryStat({ model: "ballots", action: "findUnique", durationMs: 30, success: true });
    recordQueryStat({ model: "user", action: "create", durationMs: 40, success: true });
    recordQueryStat({ model: "user", action: "update", durationMs: 50, success: false });
    recordQueryStat({ model: "user", action: "delete", durationMs: 60, success: true });
    recordQueryStat({ action: "$queryRaw", durationMs: 70, success: true });

    const snapshot = getQueryStatsSnapshot();

    expect(snapshot.totalQueries).toBe(6);
    expect(snapshot.queryErrors).toBe(1);
    expect(snapshot.slowestQueryDurationMs).toBe(70);
    expect(snapshot.averageQueryDurationMs).toBeCloseTo(45, 5);
    expect(snapshot.queriesByOperation).toEqual({
      findMany: 1,
      findUnique: 1,
      create: 1,
      update: 1,
      delete: 1,
      raw: 1,
    });
  });

  test("tracks slow queries and slow operations with safe metadata only", () => {
    recordQueryStat({ model: "ballots", action: "findMany", durationMs: 300, success: true });
    recordQueryStat({ model: "ballots", action: "findMany", durationMs: 500, success: true });

    const snapshot = getQueryStatsSnapshot();

    expect(snapshot.slowestOperations.length).toBeGreaterThan(0);
    expect(snapshot.slowestOperations[0].model).toBe("ballots");
    expect(snapshot.slowestOperations[0].operation).toBe("findMany");
    expect(snapshot.slowestOperations[0].count).toBe(2);
    expect(snapshot.recentSlowQueries.length).toBe(2);
    expect(snapshot.recentSlowQueries[0]).toEqual(
      expect.objectContaining({
        model: "ballots",
        operation: "findMany",
      }),
    );
  });
});
