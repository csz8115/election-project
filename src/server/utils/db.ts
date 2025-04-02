import prisma from '../../../client.ts';
import { User } from '../types/user.ts';
import { Company } from '../types/company.ts';
import { Ballot } from '../types/ballot.ts';

async function getUser(userID: number): Promise<User> {
    try {
        const fetchUser = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },
        });
        return fetchUser;
    } catch (error) {
        throw new Error("Unknown error during user retrieval");
    }
}

async function getUserByUsername(username: string): Promise<User> {
    try {
        const fetchUser = await prisma.user.findUnique({
            where: {
                username: username,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },

        });
        return fetchUser;
    } catch (error) {
        throw new Error("Unknown error during user retrieval");
    }
}

async function getUsersByCompany(companyID: number): Promise<User[]> {
    try {
        const fetchUsers = await prisma.user.findMany({
            where: {
                companyID: companyID,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },
        });
        return fetchUsers;
    } catch (error) {
        throw new Error("Unknown error during users retrieval");
    }
}

async function createUser(user: User): Promise<User> {
    try {
        const fetchUser = await prisma.user.create({
            data: {
                accountType: user.accountType,
                username: user.username,
                fName: user.fName,
                lName: user.lName,
                password: user.password,
                company: {
                    connect: {
                        companyID: Number(user.companyID),
                    },
                }
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },
        });
        return fetchUser;
    } catch (error) {
        throw new Error("Unknown error during user creation");
    }
}

async function checkUsername(username: string): Promise<User> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                password: true,
            },
        });
        return user;
    } catch (error) {
        throw new Error("Unknown error during username check");
    }
}

async function updateUser(user: User): Promise<User> {
    try {
        const fetchUser = await prisma.user.update({
            where: {
                userID: user.userID,
            },
            data: {
                accountType: user.accountType,
                username: user.username,
                fName: user.fName,
                lName: user.lName,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },
        });
        return fetchUser;
    } catch (error) {
        throw new Error("Unknown error during user update");
    }
}

async function removeUser(userID: number): Promise<boolean> {
    try {
        const fetchUser = await prisma.user.delete({
            where: {
                userID: userID,
            },
            select: {
                userID: true,
                accountType: true,
                username: true,
                fName: true,
                lName: true,
                companyID: true,
                company: true,
                // password field is omitted
            },
        });
        if (fetchUser) {
            return true;
        }
    } catch (error) {
        throw new Error("Unknown error during user deletion");
    }
}

async function getCompany(companyID: number): Promise<Company> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyID: companyID,
            },
        });
        return company;
    } catch (error) {
        throw new Error("Unknown error during company retrieval");
    }
}

async function getCompanies(): Promise<Company[]> {
    try {
        const companies = await prisma.company.findMany();
        return companies;
    } catch (error) {
        throw new Error("Unknown error during companies retrieval");
    }
}

async function getEmployeeCompany(userID: number): Promise<Company> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: Number(userID),
            },
            include: {
                company: true,
            },
        });
        return user.company;
    } catch (error) {
        throw new Error(`Unknown error during company retrieval for user ${userID}`);
    }
}

async function removeCompany(companyID: number) {
    try {
        const company = await prisma.company.delete({
            where: {
                companyID: companyID,
            },
        });
        if (company) {
            return true;
        }
    } catch (error) {
        throw new Error("Unknown error during company deletion");
    }
}

async function createCompany(company: Company): Promise<Company> {
    try {
        const newCompany = await prisma.company.create({
            data: {
                companyName: company.companyName,
                abbreviation: company.abbreviation,
                category: company.category,
            },
        });
        return newCompany;
    } catch (error) {
        throw new Error("Unknown error during company creation");
    }
}

async function createVote(userID: number, ballotID: number, positionID: number, candidateID: number) {
    // start transaction
    try {
        // Using a transaction with sequentially executed operations
        const result = await prisma.$transaction(async (tx) => {
            // First insert into votes table and get the created vote
            const newVote = await tx.votes.create({
                data: {
                    user: {
                        connect: {
                            userID: Number(userID),
                        },
                    },
                    ballot: {
                        connect: {
                            ballotID: Number(ballotID),
                        },
                    }
                },
            });

            // Then insert into position_votes table using the new vote's ID
            const positionVote = await tx.positionVotes.create({
                data: {
                    vote: {
                        connect: {
                            voteID: Number(newVote.voteID),
                        },
                    },
                    position: {
                        connect: {
                            positionID: Number(positionID),
                        },
                    },
                    candidate: {
                        connect: {
                            candidateID: Number(candidateID),
                        },
                    },
                },
            });
            return true;
        });

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function createInitiativeVote(userID: number, ballotID: number, initiativeID: number, responseID: number) {
    try {
        // First insert into initiative votes table and get the created vote
        const newVote = await prisma.initiativeVotes.create({
            data: {
                user: {
                    connect: {
                        userID: Number(userID),
                    },
                },
                ballot: {
                    connect: {
                        ballotID: Number(ballotID),
                    },
                },
                initiative: {
                    connect: {
                        initiativeID: Number(initiativeID),
                    },
                },
                response: {
                    connect: {
                        responseID: Number(responseID),
                    },
                },
            },
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getBallot(ballotID: number): Promise<any> {
    try {
        const ballot = await prisma.ballots.findUnique({
            where: {
                ballotID: ballotID,
            },
            include: {
                company: true,
                positions: {
                    // count votes at position level
                    include: {
                        _count: {
                            select: {
                                positionVotes: true
                            }
                        },
                        candidates: {
                            include: {
                                candidate: {
                                    include: {
                                        _count: {
                                            select: {
                                                positionVotes: true
                                            }
                                        }
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        positionVotes: {
                            _count: 'desc'
                        }
                    },
                },
                initiatives: {
                    include: {
                        _count: {
                            select: {
                                initiativeVotes: true
                            }
                        },
                        responses: true
                    }
                },
            }
        });

        return ballot;
    } catch (error) {
        throw new Error("Unknown error during ballot retrieval");
    }
}

async function getBallots(): Promise<any> {
    return prisma.ballots.findMany();
}

async function getBallotsByCompany(companyID: number): Promise<any> {
    return prisma.ballots.findMany({
        where: {
            companyID: companyID,
        },
    });
}

async function getActiveBallots(): Promise<any> {
    const now = new Date();
    return prisma.ballots.findMany({
        where: {
            startDate: {
                lte: now
            },
            endDate: {
                gte: now
            }
        },
    });
}

async function getInactiveBallots(): Promise<any> {
    const now = new Date();
    return prisma.ballots.findMany({
        where: {
            startDate: {
                gt: now
            }
        },
    });
}

async function getFinishedBallots(): Promise<any> {
    const now = new Date();
    return prisma.ballots.findMany({
        where: {
            endDate: {
                lt: now
            }
        },
    });
}

async function createBallot(ballot: Ballot) {
    try {
        // First insert into ballots table and get the created ballot
        const newBallot = await prisma.ballots.create({
            data: {
                ballotName: ballot.ballotName,
                description: ballot.description,
                startDate: new Date(ballot.startDate),
                endDate: new Date(ballot.endDate),
                company: {
                    connect: {
                        companyID: ballot.companyID,
                    },
                },
            },
        });
        if (!newBallot) {
            throw new Error("Ballot creation failed");
        }
        return newBallot;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during ballot creation");
    }

    // END OF TRANSACTION
}

async function updateBallot() {

}

/**
 * Queries the database for the ballot & votes for that ballot based on the ballot, 
 * calculates the vote for each position & candidate; 
 * if successful returns ballotResults.
 * 
 * Throws error if there is no ballot or any sub-tables with that ID. 
 * Throws error message on a database error.
 *
 * @param ballotID - The ID of the ballot to tally
 * @returns ballotResults - The results of the ballot
 * 
 */
async function tallyBallot(ballotID: number) {
    try {
        const ballot = await prisma.ballots.findUnique({
            where: {
                ballotID: ballotID,
            },
            include: {
                company: true,
                positions: {
                    // count votes at position level
                    include: {
                        _count: {
                            select: {
                                positionVotes: true
                            }
                        },
                        candidates: {
                            include: {
                                candidate: {
                                    include: {
                                        _count: {
                                            select: {
                                                positionVotes: true
                                            }
                                        }
                                    },
                                },
                            },
                            orderBy: {
                                candidate: {
                                    positionVotes: {
                                        _count: 'desc'
                                    }
                                }
                            }
                        },
                    },
                },
                initiatives: {
                    include: {
                        _count: {
                            select: {
                                initiativeVotes: true
                            }
                        },
                        responses: {
                            include: {
                                _count: {
                                    select: {
                                        initiativeVotes : true
                                    }
                                }
                            }
                        }
                    }
                },
            }
        });

        return ballot;
    } catch (error) {
        throw new Error("Unknown error during ballot retrieval");
    }
}

/**
 * Queries the database for all the votes & their respective user for a ballot, 
 * as well as for all the users of that company that have not yet voted, 
 * compiles a list of all users that have voted and have not voted; 
 * if successful returns ballotVoters.
 * 
 * Throws error if there is no vote with that ID. 
 * Throws error message on a database error.
 *
 * @param ballotID - The ID of the ballot to tally
 */
async function tallyBallotVoters(ballotID) {
}

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
    createCompany,
    createVote,
    getBallot,
    getBallots,
    getBallotsByCompany,
    getActiveBallots,
    getInactiveBallots,
    getFinishedBallots,
    createBallot,
    // updateBallot,
    tallyBallot,
    tallyBallotVoters,
    createInitiativeVote,
};