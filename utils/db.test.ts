import { prismaMock } from '../singleton.ts'
import db from './db.ts'

// Create a user if everything is correct
test('createUser should create a new user', async () => {
    const user = {
        userID: 1,
        accountType: 'admin',
        username: 'testuser',
        fName: 'Test',
        lName: 'User',
        password: 'password',
        companyID: 1
    }
    prismaMock.user.create.mockResolvedValue(user);

    await expect(db.createUser(user.accountType, user.username, user.fName, user.lName, user.password, user.companyID)).resolves.toEqual(
        user
    );
});

// Create a user and then try to create a user with the same credentials
test('createUser should throw an error if the user already exists', async () => {
    const user = {
        userID: 1,
        accountType: 'admin',
        username: 'testuser',
        fName: 'Test',
        lName: 'User',
        password: 'password',
        companyID: 1
    }
    prismaMock.user.create.mockResolvedValue(user);

    await db.createUser(user.accountType, user.username, user.fName, user.lName, user.password, user.companyID);
    
    // Mock the error that Prisma would throw for duplicate user
    prismaMock.user.create.mockRejectedValue(new Error("Unknown error during user creation"));

    await expect(db.createUser(user.accountType, user.username, user.fName, user.lName, user.password, user.companyID)).rejects.toThrow();
});

// Sample test that will always fail to show the error message
test('Sample test that will always fail', () => {
    expect(1).toBe(2);
});

// 