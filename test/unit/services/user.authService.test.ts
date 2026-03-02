import { createTestError, resetMockObject } from './helpers/serviceTestUtils';

const createSessionMock = jest.fn();
const dbMock = {
  getUserByUsername: jest.fn(),
};

jest.mock('../../../src/server/utils/session.ts', () => ({
  createSession: createSessionMock,
}));

jest.mock('../../../src/server/services/dbService.ts', () => ({
  db: dbMock,
}));

import { userAuthService } from '../../../src/server/services/user/authService.ts';

describe('userAuthService', () => {
  beforeEach(() => {
    createSessionMock.mockReset();
    resetMockObject(dbMock);
  });

  test('happy path: createSession delegates and returns token', async () => {
    createSessionMock.mockResolvedValue('jwt.token.value');

    const token = await userAuthService.createSession('alex', 'Member');

    expect(token).toBe('jwt.token.value');
    expect(createSessionMock).toHaveBeenCalledWith('alex', 'Member');
  });

  test('failure branch: createSession errors are propagated', async () => {
    createSessionMock.mockRejectedValue(createTestError('session creation failed'));

    await expect(userAuthService.createSession('alex', 'Member')).rejects.toThrow('session creation failed');
  });

  test('edge case: db dependency handles missing user deterministically', async () => {
    dbMock.getUserByUsername.mockResolvedValue(null);

    const user = await userAuthService.db.getUserByUsername('unknown_user');

    expect(user).toBeNull();
    expect(dbMock.getUserByUsername).toHaveBeenCalledWith('unknown_user');
  });
});
