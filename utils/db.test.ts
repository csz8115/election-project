import { prismaMock } from '../singleton.ts'
import db from './db.ts'

const user = {
    userID: 1,
    accountType: 'admin',
    username: 'testuser',
    fName: 'Test',
    lName: 'User',
    password: null,
    companyID: 1
};

const user2 = {
    userID: 1,
    accountType: 'admin',
    username: 'testuser',
    fName: 'Test',
    lName: 'User',
    password: null,
    companyID: 1,
    company: {
        companyID: 1,
        companyName: 'Test Company'
    }
}

const users = [
    {
        userID: 1,
        accountType: 'admin',
        username: 'testuser',
        fName: 'Test',
        lName: 'User',
        password: null,
        companyID: 1
    },
    {
        userID: 2,
        accountType: 'user',
        username: 'testuser2',
        fName: 'Test',
        lName: 'User',
        password: null,
        companyID: 1
    }
]

const company = {
    companyID: 1,
    companyName: 'Test Company'
}

const companies = [
    {
        companyID: 1,
        companyName: 'Test Company'
    },
    {
        companyID: 2,
        companyName: 'Test Company 2'
    }
]


// Get a user by their userID
test('getUserByID should return a user by their ID', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(db.getUser(user.userID)).resolves.toEqual(user);
});

// Get a user by their userID when the user does not exist
test('getUser should throw an error if the user does not exist', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("Unknown error during user retrieval"));

    await expect(db.getUser(user.userID)).rejects.toThrow("Unknown error during user retrieval");
});

// Get a user by their username
test('getUserByUsername should return a user by their username', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(db.getUserByUsername(user.username)).resolves.toEqual(user);
});

// Get a user by their username when the user does not exist
test('getUserByUsername should throw an error if the user does not exist', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("Unknown error during user retrieval"));

    await expect(db.getUserByUsername(user.username)).rejects.toThrow("Unknown error during user retrieval");
});

// Get users by their companyID
test('getUsersByCompanyID should return all users by their companyID', async () => {
    prismaMock.user.findMany.mockResolvedValue(users);

    await expect(db.getUsersByCompany(users[0].companyID)).resolves.toEqual(users);
});

// Get users by their companyID when no users exist
test('getUsersByCompanyID should throw an error if no users exist', async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error("Unknown error during users retrieval"));

    await expect(db.getUsersByCompany(users[0].companyID)).rejects.toThrow("Unknown error during users retrieval");
});

// Create a user if everything is correct
test('createUser should create a new user', async () => {
    prismaMock.user.create.mockResolvedValue(user);

    await expect(db.createUser(user)).resolves.toEqual(user);
});

// Create a user and then try to create a user with the same credentials
test('createUser should throw an error if the user already exists', async () => {
    prismaMock.user.create.mockResolvedValue(user);

    await db.createUser(user);

    // Mock the error that Prisma would throw for duplicate user
    prismaMock.user.create.mockRejectedValue(new Error("Unknown error during user creation"));

    await expect(db.createUser(user)).rejects.toThrow("Unknown error during user creation");
});

// Check if a user exists by their username
test('checkUsernames should return true if the username exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(db.checkUsername(user.username)).resolves.toEqual(user);
});

// Check if a user exists by their username when the user does not exist
test('checkUsernames should return false if the username does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(db.checkUsername("testuser")).resolves.toEqual(null);
});

// Check if updating a user's credentials works
test('updateUser should update a user', async () => {
    prismaMock.user.update.mockResolvedValue(user);

    await expect(db.updateUser(user)).resolves.toEqual(user);
});

// Check if updating a user's credentials works when the user does not exist
test('updateUser should throw an error if the user does not exist', async () => {
    prismaMock.user.update.mockRejectedValue(new Error("Unknown error during user update"));

    await expect(db.updateUser(user)).rejects.toThrow("Unknown error during user update");
});

// Check if remove a user works
test('removeUser should remove a user', async () => {
    prismaMock.user.delete.mockResolvedValue(user);

    await expect(db.removeUser(user.userID)).resolves.toEqual(true);
});

// Check if remove a user works when the user does not exist
test('removeUser should throw an error if the user does not exist', async () => {
    prismaMock.user.delete.mockRejectedValue(new Error("Unknown error during user deletion"));

    await expect(db.removeUser(user.userID)).rejects.toThrow("Unknown error during user deletion");
});

// Check if getting a company by their ID works
test('getCompany should return a company by their ID', async () => {
    prismaMock.company.findUnique.mockResolvedValue(company);

    await expect(db.getCompany(company.companyID)).resolves.toEqual(company);
});

// Check if getting a company by their ID works when the company does not exist
test('getCompany should throw an error if the company does not exist', async () => {
    prismaMock.company.findUnique.mockRejectedValue(new Error("Unknown error during company retrieval"));

    await expect(db.getCompany(company.companyID)).rejects.toThrow("Unknown error during company retrieval");
});

// Check if getting all companies works
test('getCompanies should return all companies', async () => {
    prismaMock.company.findMany.mockResolvedValue(companies);

    await expect(db.getCompanies()).resolves.toEqual(companies);
});

// Check if getting all companies works when no companies exist
test('getCompanies should throw an error if no companies exist', async () => {
    prismaMock.company.findMany.mockRejectedValue(new Error("Unknown error during companies retrieval"));

    await expect(db.getCompanies()).rejects.toThrow("Unknown error during companies retrieval");
});

// Check if getting an employee's company works
test('getEmployeeCompany should return an employee\'s company', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(user2);

    await expect(db.getEmployeeCompany(user.userID)).resolves.toEqual(user2.company);
});

// Check if getting an employee's company works when the company does not exist
test('getEmployeeCompany should throw an error if the company does not exist', async () => {
    prismaMock.company.findUnique.mockRejectedValue(new Error("Unknown error during company retrieval"));

    await expect(db.getEmployeeCompany(1)).rejects.toThrow("Unknown error during company retrieval");
});

// Check if removing a company works
test('removeCompany should remove a company', async () => {
    prismaMock.company.delete.mockResolvedValue(company);

    await expect(db.removeCompany(company.companyID)).resolves.toEqual(true);
});

// Check if creating a company works
test('createCompany should create a company', async () => {
    prismaMock.company.create.mockResolvedValue(company);

    await expect(db.createCompany(company.companyName)).resolves.toEqual(company);
});

// Check if creating a company works when the company already exists
test('createCompany should throw an error if the company already exists', async () => {
    prismaMock.company.create.mockResolvedValue(company);

    await db.createCompany(company.companyName);

    prismaMock.company.create.mockRejectedValue(new Error("Unknown error during company creation"));

    await expect(db.createCompany(company.companyName)).rejects.toThrow("Unknown error during company creation");
});