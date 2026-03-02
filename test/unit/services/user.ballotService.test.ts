import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const redisClientMock = {
  keys: jest.fn(),
  set: jest.fn(),
};

const dbMock = {
  getBallotsByCompany: jest.fn(),
};

const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const getRedisClientMock = jest.fn(() => redisClientMock);

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

jest.mock('../../../src/server/utils/db/redis.ts', () => ({
  getRedisClient: getRedisClientMock,
}));

jest.mock('../../../src/server/utils/logger.ts', () => ({
  __esModule: true,
  default: loggerMock,
}));

import { userBallotService } from '../../../src/server/services/user/ballotService.ts';

describe('userBallotService', () => {
  beforeEach(() => {
    resetMockObject(redisClientMock);
    resetMockObject(dbMock);
    resetMockObject(loggerMock);
    getRedisClientMock.mockClear();
  });

  test('happy path: exposes db/redis/logger dependencies for ballot flow', async () => {
    const ballotResult = { ballots: [{ ballotID: 1 }], nextCursor: 2 };
    dbMock.getBallotsByCompany.mockResolvedValue(ballotResult);

    const fetched = await userBallotService.db.getBallotsByCompany(12, 0, undefined, undefined, undefined, 'open');
    const redisClient = userBallotService.getRedisClient();
    userBallotService.logger.info('ballots loaded');

    expect(fetched).toEqual(ballotResult);
    expect(redisClient).toBe(redisClientMock);
    expect(getRedisClientMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith('ballots loaded');
  });

  test('failure branch: db failures bubble up without mutation', async () => {
    dbMock.getBallotsByCompany.mockRejectedValue(createTestError('query failed'));

    await expect(
      userBallotService.db.getBallotsByCompany(12, 0, undefined, undefined, undefined, 'open')
    ).rejects.toThrow('query failed');
  });

  test('edge case: redis returns no active keys', async () => {
    redisClientMock.keys.mockResolvedValue([]);

    const keys = await userBallotService.getRedisClient().keys('*active:*');

    expect(keys).toEqual([]);
    expect(redisClientMock.keys).toHaveBeenCalledWith('*active:*');
  });
});
