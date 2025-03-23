import { prismaMock } from '../singleton.ts'
import db from './db.ts'

// Clear mock calls before each test
beforeEach(async () => {
    await prismaMock.user.deleteMany(); // Clears all users before each test
  });

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
