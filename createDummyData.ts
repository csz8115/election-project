import prisma from './client.ts';
import db from './src/server/utils/db.ts';
import bcrypt from 'bcrypt';
import { User } from './src/server/types/user.ts';
import { Ballot } from './src/server/types/ballot.ts';
import { Candidate } from './src/server/types/candidate.ts';
import { BallotPositions } from './src/server/types/ballotPositions.ts';
import { BallotInitiatives } from './src/server/types/ballotInitiatives.ts';


let companyID = 1;

// run file with npx ts-node createDummyData.ts

const createUser = async () => {

    const password = "DummyPassword123!";

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      accountType: "Member",
      username: "testuser123",
      fName: "John",
      lName: "Doe",
      password: hashedPassword,
      companyID: Number(1),
    };

    const status = await db.createUser(newUser);
    console.log('User created:', status);
}

const createBallot = async () => {

  const dummyBallot3: Ballot = {
    ballotID: 3,
    userID: 1,
    ballotName: "Mid-Year Elections 2025",
    description: "Mid-Year company election",
    startDate: "2025-03-01",
    endDate: "2025-06-07",
    companyID: 1,
  }

  const dummyCandidates = [
    {
      candidateID: 1,
      fName: "Alice",
      lName: "Smith",
      titles: "",
      description: "Experienced leader with a vision for the future.",
      picture: "https://i.pravatar.cc/250?u=alice.smith@example.com",
      ballotID: 3,
    },
    {
      candidateID: 2,
      fName: "Bob",
      lName: "Johnson",
      titles: "",
      description: "Financial expert with a focus on growth.",
      picture: "https://i.pravatar.cc/250?u=bob.johnson@example.com",
      ballotID: 3,
    },
    {
      candidateID: 3,
      fName: "Charlie",
      lName: "Brown",
      titles: "",
      description: "Dedicated to financial transparency.",
      picture: "https://i.pravatar.cc/250?u=charlie.brown@example.com",
      ballotID: 3,
    },
  ];

  for (const candidate of dummyCandidates) {
    await db.createCandidate(candidate.fName, candidate.lName, candidate.titles, candidate.description, candidate.picture || '');
  } 
  const dummyBallotPositions: BallotPositions[] = [
    {
      ballotID: 3,
      positionID: 1,
      positionName: "President",
      allowedVotes: 1,
      writeIn: true,
      candidates: [
        {
          candidateID: 1,
          fName: "Alice",
          lName: "Smith",
          titles: "CEO",
          description: "Experienced leader with a vision for the future.",
          picture: "alice-smith.jpg",
        },
        {
          candidateID: 2,
          fName: "Bob",
          lName: "Johnson",
          titles: "CFO",
          description: "Financial expert with a focus on growth.",
          picture: "",
        },
      ],
    },
    {
      ballotID: 3,
      positionID: 2,
      positionName: "Treasurer",
      allowedVotes: 1,
      writeIn: false,
      candidates: [
        {
          candidateID: 3,
          fName: "Charlie",
          lName: "Brown",
          titles: "Accountant",
          description: "Dedicated to financial transparency.",
          picture: "charlie-brown.jpg",
        },
      ],
    },
  ];

  const dummyBallotInitiatives: BallotInitiatives[] = [
    {
      ballotID: 3,
      initiativeID: 1,
      initiativeName: "Environmental Policy",
      description: "Proposal to implement a company-wide recycling program.",
      picture: "recycling-program.jpg",
      responses: [
        {
          responseID: 1,
          response: "Approve",
          votes: 0,
        },
        {
          responseID: 2,
          response: "Reject",
          votes: 0,
        },
      ],
    },
    {
      ballotID: 3,
      initiativeID: 2,
      initiativeName: "Work From Home Policy",
      description: "Proposal to allow employees to work from home two days a week.",
      responses: [
        {
          responseID: 3,
          response: "Approve",
          votes: 0,
        },
        {
          responseID: 4,
          response: "Reject",
          votes: 0,
        },
      ],
    },
  ];


  try {

    //const createdBallot3 = await db.createBallot(dummyBallot3, dummyBallotPositions, dummyBallotInitiatives);


    //console.log('Ballot created:', createdBallot3);
  } catch (error) {
    console.error('Error creating ballot:', error);
  }
}

//createBallot();
createUser();