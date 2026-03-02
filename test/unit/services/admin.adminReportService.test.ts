import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbMock = {
  getActiveBallots: jest.fn(),
};

const redisClientMock = {
  keys: jest.fn(),
};

const getRedisClientMock = jest.fn(() => redisClientMock);
const getHttpStatsMock = jest.fn();
const getDbStatsMock = jest.fn();

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

jest.mock('../../../src/server/utils/db/redis.ts', () => ({
  getRedisClient: getRedisClientMock,
}));

jest.mock('../../../src/server/utils/systemStats.ts', () => ({
  getHttpStats: getHttpStatsMock,
  getDbStats: getDbStatsMock,
}));

import { adminReportService } from '../../../src/server/services/admin/adminReportService.ts';

describe('adminReportService', () => {
  beforeEach(() => {
    resetMockObject(dbMock);
    resetMockObject(redisClientMock);
    getRedisClientMock.mockClear();
    getHttpStatsMock.mockReset();
    getDbStatsMock.mockReset();
  });

  test('happy path: composes report dependencies deterministically', async () => {
    dbMock.getActiveBallots.mockResolvedValue([{ ballotID: 1 }]);
    redisClientMock.keys.mockResolvedValue(['active:u1']);
    getHttpStatsMock.mockResolvedValue({ totalRequests: 10, totalErrors: 0 });
    getDbStatsMock.mockResolvedValue({ totalQueries: 9, avgResponseTime: 1.2 });

    const activeBallots = await adminReportService.db.getActiveBallots();
    const activeKeys = await adminReportService.getRedisClient().keys('*active:*');
    const httpStats = await adminReportService.getHttpStats();
    const dbStats = await adminReportService.getDbStats();

    expect(activeBallots).toEqual([{ ballotID: 1 }]);
    expect(activeKeys).toEqual(['active:u1']);
    expect(httpStats).toEqual({ totalRequests: 10, totalErrors: 0 });
    expect(dbStats).toEqual({ totalQueries: 9, avgResponseTime: 1.2 });
  });

  test('failure branch: system stats failures are propagated', async () => {
    getDbStatsMock.mockRejectedValue(createTestError('stats unavailable'));

    await expect(adminReportService.getDbStats()).rejects.toThrow('stats unavailable');
  });

  test('edge case: zero activity still returns stable values', async () => {
    dbMock.getActiveBallots.mockResolvedValue([]);
    redisClientMock.keys.mockResolvedValue([]);
    getHttpStatsMock.mockResolvedValue({ totalRequests: 0, totalErrors: 0 });

    const activeBallots = await adminReportService.db.getActiveBallots();
    const activeUsers = await adminReportService.getRedisClient().keys('*active:*');
    const httpStats = await adminReportService.getHttpStats();

    expect(activeBallots).toEqual([]);
    expect(activeUsers).toEqual([]);
    expect(httpStats).toEqual({ totalRequests: 0, totalErrors: 0 });
  });
});
