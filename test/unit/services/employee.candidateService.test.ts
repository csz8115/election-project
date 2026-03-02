import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbMock = {
  addCandidate: jest.fn(),
  deleteCandidate: jest.fn(),
};

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

import { employeeCandidateService } from '../../../src/server/services/employee/candidateService.ts';

describe('employeeCandidateService', () => {
  beforeEach(() => {
    resetMockObject(dbMock);
  });

  test('happy path: addCandidate returns new candidate ID', async () => {
    const createdCandidate = { candidateID: 5 };
    dbMock.addCandidate.mockResolvedValue(createdCandidate);

    const result = await employeeCandidateService.db.addCandidate({
      positionID: 3,
      fName: 'A',
      lName: 'B',
    });

    expect(result).toEqual(createdCandidate);
    expect(dbMock.addCandidate).toHaveBeenCalledWith({ positionID: 3, fName: 'A', lName: 'B' });
  });

  test('failure branch: addCandidate errors propagate', async () => {
    dbMock.addCandidate.mockRejectedValue(createTestError('candidate insert failed'));

    await expect(employeeCandidateService.db.addCandidate({ positionID: 3 })).rejects.toThrow('candidate insert failed');
  });

  test('edge case: deleting non-existent candidate returns falsy value consistently', async () => {
    dbMock.deleteCandidate.mockResolvedValue(false);

    const deleted = await employeeCandidateService.db.deleteCandidate(9999);

    expect(deleted).toBe(false);
    expect(dbMock.deleteCandidate).toHaveBeenCalledWith(9999);
  });
});
