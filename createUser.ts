import prisma from './client.ts';
import db from './src/server/utils/db.ts';
import bcrypt from 'bcrypt';
import { User } from './src/server/types/user.ts';

let password = 'password123';
let accountType = 'user';
let username = 'user1';
let fName = 'John';
let lName = 'Doe';
let companyID = 1;



(async () => {
    await prisma.company.create({
        data: {
          companyID: 1, 
          companyName: "Example Company",
        },
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
        accountType,
        username,
        fName,
        lName,
        password: hashedPassword,
        companyID,
    };

    const status = await db.createUser(newUser);
    console.log('User created:', status);
})();