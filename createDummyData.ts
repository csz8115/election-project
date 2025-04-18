import prisma from './client.ts';
import db from './src/server/utils/db.ts';
import bcrypt from 'bcrypt';
import { User } from './src/server/types/user.ts';
import { Ballot } from './src/server/types/ballot.ts';


let password = 'password123';
let accountType = 'user';
let username = 'user1';
let fName = 'John';
let lName = 'Doe';
let companyID = 1;

// run file with npx ts-node createDummyData.ts

const createUser = async () => {
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
}



const createBallot = async () => {
  const dummyBallot1: Ballot = {
    ballotName: "Election 2023",
    description: "Annual company election",
    startDate: "2023-11-01",
    endDate: "2023-11-07",
    companyID: 1,
  };

  const dummyBallot2: Ballot = {
    ballotName: "Election 2024",
    description: "Annual company election",
    startDate: "2024-11-01",
    endDate: "2024-11-07",
    companyID: 1,
  };

  const dummyBallot3: Ballot = {
    ballotName: "Mid-Year Elections 2025",
    description: "Mid-Year company election",
    startDate: "2025-3-01",
    endDate: "2025-6-07",
    companyID: 1,
  };

  try {
    //const createdBallot1 = await db.createBallot(dummyBallot1);
    //const createdBallot2 = await db.createBallot(dummyBallot2);
    //const createdBallot3 = await db.createBallot(dummyBallot3);
    const createdBallot3 = await db.createBallot(dummyBallot3);


    console.log('Ballot created:', createdBallot3);
  } catch (error) {
    console.error('Error creating ballot:', error);
  }
}

createBallot();