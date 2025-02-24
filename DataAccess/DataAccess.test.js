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


