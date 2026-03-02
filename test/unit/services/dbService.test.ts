import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbRepositoryMock = {
  getUserByUsername: jest.fn(),
};

jest.mock('../../../src/server/repositories/dbRepository.ts', () => ({
  db: dbRepositoryMock,
}));

import { db } from '../../../src/server/services/dbService.ts';

describe('dbService', () => {
  beforeEach(() => {
    resetMockObject(dbRepositoryMock);
  });

  test('happy path: re-exports repository db object and delegates calls', async () => {
    const expectedUser = { userID: 42, username: 'member_42' };
    dbRepositoryMock.getUserByUsername.mockResolvedValue(expectedUser);

    const result = await db.getUserByUsername('member_42');

    expect(result).toEqual(expectedUser);
    expect(db.getUserByUsername).toBe(dbRepositoryMock.getUserByUsername);
    expect(dbRepositoryMock.getUserByUsername).toHaveBeenCalledWith('member_42');
  });

  test('failure branch: propagates repository errors', async () => {
    const error = createTestError('repository blew up');
    dbRepositoryMock.getUserByUsername.mockRejectedValue(error);

    await expect(db.getUserByUsername('member_42')).rejects.toThrow('repository blew up');
  });

  test('edge case: returns null as-is when repository has no result', async () => {
    dbRepositoryMock.getUserByUsername.mockResolvedValue(null);

    const result = await db.getUserByUsername('');

    expect(result).toBeNull();
    expect(dbRepositoryMock.getUserByUsername).toHaveBeenCalledWith('');
  });
});
