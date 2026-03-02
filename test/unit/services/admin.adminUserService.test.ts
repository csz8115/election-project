import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const dbMock = {
  createUser: jest.fn(),
  checkUsername: jest.fn(),
};

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

import { adminUserService } from '../../../src/server/services/admin/adminUserService.ts';

describe('adminUserService', () => {
  beforeEach(() => {
    resetMockObject(dbMock);
  });

  test('happy path: createUser returns newly created admin/member user', async () => {
    const createdUser = { userID: 7, username: 'new_admin', accountType: 'Admin' as const };
    dbMock.createUser.mockResolvedValue(createdUser);

    const result = await adminUserService.db.createUser(createdUser);

    expect(result).toEqual(createdUser);
    expect(dbMock.createUser).toHaveBeenCalledWith(createdUser);
  });

  test('failure branch: createUser errors are propagated', async () => {
    dbMock.createUser.mockRejectedValue(createTestError('create failed'));

    await expect(adminUserService.db.createUser({ username: 'bad' })).rejects.toThrow('create failed');
  });

  test('edge case: checkUsername returning null indicates unique username', async () => {
    dbMock.checkUsername.mockResolvedValue(null);

    const existing = await adminUserService.db.checkUsername('unique_name');

    expect(existing).toBeNull();
    expect(dbMock.checkUsername).toHaveBeenCalledWith('unique_name');
  });
});
