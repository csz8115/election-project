jest.mock("jose");
import { createSession, encrypt, decrypt } from "../src/server/utils/session";
// Create a session
test('createSession should create a new session', async () => {

    const session = {
        username: 'testuser',
        accountType: 'admin',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }

    const result = await createSession(session.username, session.accountType);

    expect(result).toBeDefined();
    expect(result).toMatch(/[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/);
});