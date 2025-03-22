const { getUser, getUserWithID, createUser, checkUsername } = require('/DataAccess.js');
const { Pool } = require('pg');

jest.mock('pg', () => {
    const mClient = {
        query: jest.fn(),
        release: jest.fn(),
    };
    return { Pool: jest.fn(() => mClient) };
});

const mockPool = new Pool();

describe("User Data Functions", () => {

    beforeEach(() => {
        jest.clearAllMocks(); 
    });

    test("getUser should return user for valid ID", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [{ userID: 1, username: "testUser" }] });
        const user = await getUser(1);
        expect(user).toEqual({ userID: 1, username: "testUser" });
        expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });

    test("getUser should return user for a valid given username", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [{ userID: 2, username: "validUsername" }] });
        const user = await getUser("validUsername");
        expect(user).toEqual({ userID: 2, username: "validUsername" });
        expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), ["validUsername"]);
    });

    test("getUserWithID should throw error for non-existent user", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        await expect(getUserWithID(999)).rejects.toThrow("no user with that ID");
    });

    test("createUser should return true when user is inserted successfully", async () => {
        mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
        const result = await createUser({ username: "newUser", accountType: "member", password: "securePass" });
        expect(result).toBe(true);
        expect(mockPool.query).toHaveBeenCalled();
    });

    test("checkUsername should return true when username is available", async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        const result = await checkUsername("availableUsername");
        expect(result).toBe(true);
    });

});
