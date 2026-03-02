import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbMock = {
  getCompanyStats: jest.fn(),
};

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

import { officerService } from '../../../src/server/services/officer/officerService.ts';

describe('officerService', () => {
  beforeEach(() => {
    resetMockObject(dbMock);
  });

  test('happy path: getCompanyStats returns officer report data', async () => {
    const stats = { members: 100, turnout: 0.7 };
    dbMock.getCompanyStats.mockResolvedValue(stats);

    const result = await officerService.db.getCompanyStats(12);

    expect(result).toEqual(stats);
    expect(dbMock.getCompanyStats).toHaveBeenCalledWith(12);
  });

  test('failure branch: company stats errors propagate', async () => {
    dbMock.getCompanyStats.mockRejectedValue(createTestError('stats error'));

    await expect(officerService.db.getCompanyStats(12)).rejects.toThrow('stats error');
  });

  test('edge case: null stats are returned unchanged', async () => {
    dbMock.getCompanyStats.mockResolvedValue(null);

    const result = await officerService.db.getCompanyStats(404);

    expect(result).toBeNull();
    expect(dbMock.getCompanyStats).toHaveBeenCalledWith(404);
  });
});
