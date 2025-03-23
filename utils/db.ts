import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUser(userID: number): Promise<any> {
    return prisma.user.findUnique({
        where: {
            userID: userID,
        },
    });
}

async function getUserByUsername(username: string): Promise<any> {
    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });
    if (!user) {
        return null;
    }
    return user;
}

async function getUsersByCompany(companyID: number): Promise<any> {
    return prisma.user.findMany({
        where: {
            companyID: companyID,
        },
    });
}

async function createUser(accountType: any, username: string, fName: string, lName: string, password: string, companyID: number): Promise<any> {
    const user = prisma.user.create({
        data: {
            accountType: accountType,
            username: username,
            fName: fName,
            lName: lName,
            password: password,
            company: {
                connect: {
                    companyID: Number(companyID),
                },
            }
        },
    });
    return user;
}

async function checkUsername(username: string): Promise<any> {
    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });

    return user;
}

async function updateUser(userID: number, accountType: any, username: string, fName: string, mName: string, lName) {
    return prisma.user.update({
        where: {
            userID: userID,
        },
        data: {
            accountType: accountType,
            username: username,
            fName: fName,
            lName: lName,
        },
    });
}

async function removeUser(userID: number) {
    return prisma.user.delete({
        where: {
            userID: userID,
        },
    });
}

async function getCompany(companyID: number): Promise<any> {
    return prisma.company.findUnique({
        where: {
            companyID: companyID,
        },
    });
}

async function getCompanies(): Promise<any> {
    return prisma.company.findMany();
}

async function getEmployeeCompany(userID: number): Promise<any> {
    const user = await prisma.user.findUnique({
        where: {
            userID: userID,
        },
    });

    if (!user) {
        return null;
    }

    return prisma.company.findUnique({
        where: {
            companyID: user.companyID,
        },
    });
}

async function removeCompany(companyID: number) {
    return prisma.company.delete({
        where: {
            companyID: companyID,
        },
    });
}

// async function createVote(userID: number, ballotID: number, voteID: number, initiativeVotes: any, positionsVotes: any) {
//     // start transaction
//     await prisma.$transaction([
//         // insert into votes table
//         prisma.votes.create({
//             data: {
//                 userID: userID,
//                 ballotID: ballotID,
//                 voteID: voteID,
//             },
//         }),
//         // loop through initiativeVotes and insert into initiative_votes table
//         ...initiativeVotes.map((initVote: any) =>
//             prisma.initiativeVotes.create({
//                 data: {
//                     voteID: voteID,
//                     initiativeID: initVote.initiativeID,
//                     responseID: initVote.responseID,
//                     vote: initVote.vote,
//                     initiative: initVote.initiative,
//                     response: initVote.response,
//                 },
//             })
//         ),
//         // loop through positionsVotes and insert into positions_votes table
//         ...positionsVotes.map((posVote: any) => {
//             // Check if it's a write-in candidate
//             if (posVote.name !== null) {
//                 // Check if name does not already exists
//                 if (posVote.nameID === null) {
//                     // Insert into names table
//                     prisma.writeInNames.create({
//                         data: {
//                             fName: posVote.name.fName,
//                             lName: posVote.name.lName,
//                         },
//                     });

//                 }
//                 prisma.positionVotes.create({
//                     data: {
//                         voteID: voteID,
//                         positionID: posVote.positionID,
//                         voteNum: posVote.voteNum,
//                         candidateID: posVote.candidateID,
//                         nameID: posVote.nameID,
//                         vote: posVote.vote,
//                         position: posVote.position,
//                         candidate: posVote.candidate,
//                         name: posVote.name,
//                     },
//                 });
//                 // Proceed to insert into positions_votes table normally
//             } else {
//                 prisma.positionVotes.create({
//                     data: {
//                         voteID: voteID,
//                         positionID: posVote.positionID,
//                         voteNum: posVote.voteNum,
//                         candidateID: posVote.candidateID,
//                         vote: posVote.vote,
//                         position: posVote.position,
//                         candidate: posVote.candidate,
//                     },
//                 });
//             }
//         }),
//     ]);
//     // end transaction

// }

// async function getBallot(ballotID: number): Promise<any> {
//     return prisma.ballots.findUnique({
//         where: {
//             ballotID: ballotID,
//         },
//     });
// }

// async function getBallots(): Promise<any> {
//     return prisma.ballots.findMany();
// }

// async function getBallotsByCompany(companyID: number): Promise<any> {
//     return prisma.ballots.findMany({
//         where: {
//             companyID: companyID,
//         },
//     });
// }

// async function getActiveBallots(): Promise<any> {
//     const now = new Date();
//     return prisma.ballots.findMany({
//         where: {
//             startDate: {
//                 lte: now
//             },
//             endDate: {
//                 gte: now
//             }
//         },
//     });
// }

// async function getInactiveBallots(): Promise<any> {
//     const now = new Date();
//     return prisma.ballots.findMany({
//         where: {
//             startDate: {
//                 gt: now
//             }
//         },
//     });
// }

// async function getFinishedBallots(): Promise<any> {
//     const now = new Date();
//     return prisma.ballots.findMany({
//         where: {
//             endDate: {
//                 lt: now
//             }
//         },
//     });
// }

// async function createBallot(companyID: number, startDate: Date, endDate: Date, ballotName: string, ballotDescription: string, positions: any, initiatives: any) {
//     await prisma.$transaction([
//         // insert into ballots table
//         prisma.ballots.create({
//             data: {
//                 companyID: companyID,
//                 startDate: startDate,
//                 endDate: endDate,
//                 ballotName: ballotName,
//                 description: ballotDescription,
//             },
//         }),
//         // loop through positions and insert into positions table
//         ...positions.map((pos: any) => {
//             prisma.ballotPositions.create({
//                 data: {
//                     positionName: pos.positionName,
//                     voteNum: pos.voteNum,
//                     writeIn: pos.writeIn,
//                     ballotID: pos.ballotID,
//                     ballot: pos.ballot,
//                     candidates: pos.candidates,
//                     positionVotes: pos.positionVotes,

//                 },
//             });
//             // loop through candidates and insert into candidates table
//             pos.candidates.map((candidate: any) => {
//                 prisma.candidate.create({
//                     data: {
//                         fName: candidate.fName,
//                         lName: candidate.lName,
//                         titles: candidate.titles,
//                         positions: candidate.positions,
//                         description: candidate.description,
//                         picture: candidate.picture,
//                     },
//                 });
//                 // insert into ballot_candidates table
//                 prisma.ballotCandidates.create({
//                     data: {
//                         positionID: pos.positionID,
//                         candidateID: candidate.candidateID,
//                     },
//                 });
//             });
//         }),
//         // loop through initiatives and insert into initiatives table
//         ...initiatives.map((init: any) => {
//             prisma.ballotInitiatives.create({
//                 data: {
//                     initiativeName: init.initiativeName,
//                     description: init.description,
//                     ballotID: init.ballotID,
//                     ballot: init.ballot,
//                     initiativeVotes: init.initiativeVotes,
//                     responses: init.responses,
//                 },
//             });
//             // loop through responses and insert into responses table
//             init.responses.map((response: any) => {
//                 prisma.initiativeResponses.create({
//                     data: {
//                         response: response.response,
//                         initiativeID: init.initiativeID,
//                     },
//                 });
//             });
//         }),

//     ]);
//     // END OF TRANSACTION
// }

// async function updateBallot(ballotID: number, startDate: Date, endDate: Date, ballotName: string, companyID: number, ballotDescription: string, positions: any, initiatives: any) {
//     await prisma.$transaction([
//         // check if ballot is not active or finished before updating
//         prisma.ballots.update({
//             where: {
//                 ballotID: ballotID,
//             },
//             data: {
//                 startDate: startDate,
//                 endDate: endDate,
//                 ballotName: ballotName,
//                 companyID: companyID,
//                 description: ballotDescription,
//             },
//         }),
//         // delete all positions and initiatives associated with the ballot
//         prisma.ballotPositions.deleteMany({
//             where: {
//                 ballotID: ballotID,
//             },
//         }),
//         prisma.ballotInitiatives.deleteMany({
//             where: {
//                 ballotID: ballotID,
//             },
//         }),
//         // loop through positions and insert into positions table 
//         ...positions.map((pos: any) => {
//             prisma.ballotPositions.create({
//                 data: {
//                     positionName: pos.positionName,
//                     voteNum: pos.voteNum,
//                     writeIn: pos.writeIn,
//                     ballotID: pos.ballotID,
//                     ballot: pos.ballot,
//                     candidates: pos.candidates,
//                     positionVotes: pos.positionVotes,

//                 },
//             });
//             // loop through candidates and insert into candidates table
//             pos.candidates.map((candidate: any) => {
//                 prisma.candidate.create({
//                     data: {
//                         fName: candidate.fName,
//                         lName: candidate.lName,
//                         titles: candidate.titles,
//                         positions: candidate.positions,
//                         description: candidate.description,
//                         picture: candidate.picture,
//                     },
//                 });
//                 // insert into ballot_candidates table
//                 prisma.ballotCandidates.create({
//                     data: {
//                         positionID: pos.positionID,
//                         candidateID: candidate.candidateID,
//                     },
//                 });
//             });
//         }),
//         // loop through initiatives and insert into initiatives table
//         ...initiatives.map((init: any) => {
//             prisma.ballotInitiatives.create({
//                 data: {
//                     initiativeName: init.initiativeName,
//                     description: init.description,
//                     ballotID: init.ballotID,
//                     ballot: init.ballot,
//                     initiativeVotes: init.initiativeVotes,
//                     responses: init.responses,
//                 },
//             });
//             // loop through responses and insert into responses table
//             init.responses.map((response: any) => {
//                 prisma.initiativeResponses.create({
//                     data: {
//                         response: response.response,
//                         initiativeID: init.initiativeID,
//                     },
//                 });
//             });
//         }),
//     ]);
//     // END OF TRANSACTION
// }

// /**
//  * Queries the database for the ballot & votes for that ballot based on the ballot, 
//  * calculates the vote for each position & candidate; 
//  * if successful returns ballotResults.
//  * 
//  * Throws error if there is no ballot or any sub-tables with that ID. 
//  * Throws error message on a database error.
//  *
//  * @param ballotID - The ID of the ballot to tally
//  * @returns ballotResults - The results of the ballot
//  * 
//  */
// async function tallyBallot(ballotID: number) {
//     const ballot = await prisma.ballots.findUnique({
//         where: {
//             ballotID: ballotID,
//         },
//     });

//     if (!ballot) {
//         throw new Error('No ballot with that ID');
//     }

//     const positions = await prisma.ballotPositions.findMany({
//         where: {
//             ballotID: ballotID,
//         },
//     });

//     if (!positions) {
//         throw new Error('No positions with that ballot ID');
//     }

//     const initiatives = await prisma.ballotInitiatives.findMany({
//         where: {
//             ballotID: ballotID,
//         },
//     });

//     if (!initiatives) {
//         throw new Error('No initiatives with that ballot ID');
//     }

//     const votes = await prisma.votes.findMany({
//         where: {
//             ballotID: ballotID,
//         },
//     });

//     if (!votes) {
//         throw new Error('No votes with that ballot ID');
//     }

//     const ballotResults = {
//         ballot: ballot,
//         positions: positions,
//         initiatives: initiatives,
//         votes: votes,
//     };

//     return ballotResults;
// }

// /**
//  * Queries the database for all the votes & their respective user for a ballot, 
//  * as well as for all the users of that company that have not yet voted, 
//  * compiles a list of all users that have voted and have not voted; 
//  * if successful returns ballotVoters.
//  * 
//  * Throws error if there is no vote with that ID. 
//  * Throws error message on a database error.
//  *
//  * @param ballotID - The ID of the ballot to tally
//  */
// async function tallyBallotVoters(ballotID) {
// }

export default {
    getUser,
    getUserByUsername,
    getUsersByCompany,
    createUser,
    checkUsername,
    updateUser,
    removeUser,
    getCompany,
    getCompanies,
    getEmployeeCompany,
    removeCompany,
    // createVote,
    // getBallot,
    // getBallots,
    // getBallotsByCompany,
    // getActiveBallots,
    // getInactiveBallots,
    // getFinishedBallots,
    // createBallot,
    // updateBallot,
    // tallyBallot,
    // tallyBallotVoters,
};