import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbMock = {
  createBallot: jest.fn(),
  changeBallotDates: jest.fn(),
};

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

import { employeeBallotService } from '../../../src/server/services/employee/ballotService.ts';

describe('employeeBallotService', () => {
  beforeEach(() => {
    resetMockObject(dbMock);
  });

  test('happy path: createBallot returns created ballot payload', async () => {
    const created = { ballotID: 88 };
    dbMock.createBallot.mockResolvedValue(created);

    const result = await employeeBallotService.db.createBallot({ ballotName: 'Q1 Vote' }, [], []);

    expect(result).toEqual(created);
    expect(dbMock.createBallot).toHaveBeenCalledWith({ ballotName: 'Q1 Vote' }, [], []);
  });

  test('failure branch: createBallot failures propagate', async () => {
    dbMock.createBallot.mockRejectedValue(createTestError('write failed'));

    await expect(employeeBallotService.db.createBallot({}, [], [])).rejects.toThrow('write failed');
  });

  test('edge case: allows undefined date updates to pass through unchanged', async () => {
    dbMock.changeBallotDates.mockResolvedValue({ updated: true });

    const result = await employeeBallotService.db.changeBallotDates(12, undefined, undefined);

    expect(result).toEqual({ updated: true });
    expect(dbMock.changeBallotDates).toHaveBeenCalledWith(12, undefined, undefined);
  });
});
