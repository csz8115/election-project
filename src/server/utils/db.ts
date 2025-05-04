import prisma from '../../../client.ts';
import { User } from '../types/user.ts';
import { Company } from '../types/company.ts';
import { Ballot } from '../types/ballot.ts';
import { Candidate } from '../types/candidate.ts';
import { Vote } from '../types/vote.ts';
import { ResponseVote } from '../types/response.ts';
import { BallotPositions } from '../types/ballotPositions.ts';
import { BallotInitiatives } from '../types/ballotInitiatives.ts';

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

async function getCandidate(candidateID: number): Promise<Candidate> {
    try {
        const fetchCandidate = await prisma.candidate.findUnique({
            where: {
                candidateID: candidateID,
            },
        });
        if (!fetchCandidate) {
            throw new Error("Candidate not found");
        }
        return fetchCandidate;
    } catch (error) {
        throw new Error("Unknown error during candidate retrieval");
    }
}

async function deleteCandidate(candidateID: number): Promise<boolean> {
    try {
        const deletedCandidate = await prisma.candidate.delete({
            where: {
                candidateID: candidateID,
            },
        });
        return !!deletedCandidate;
    } catch (error) {
        throw new Error("Unknown error during candidate deletion");
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


async function createCandidate(positionID: number, fName: string, lName: string, titles: string, description: string, picture: string): Promise<any> {
    try {
        // Start a transaction to ensure both candidate creation and linking are successful
        const result = await prisma.$transaction(async (tx) => {
            // Insert into the candidates table
            const newCandidate = await tx.candidate.create({
                data: {
                    fName: fName,
                    lName: lName,
                    titles: titles,
                    description: description,
                    picture: picture ? picture : "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk"
                }
            });

            // Link the candidate to the position
            await tx.ballotCandidates.create({
                data: {
                    candidate: {
                        connect: { candidateID: newCandidate.candidateID },
                    },
                    position: {
                        connect: { positionID: positionID },
                    },
                },
            });

            return newCandidate;
        });

        return result;
    } catch (error) {
        throw new Error("Unknown error during candidate creation and linking");
    }
}

async function createWriteInCandidate(fName: string, lName: string) {
    try {
        const candidate = await prisma.candidate.create({
            data: {
                fName: fName,
                lName: lName,
                titles: "",
                description: "",
                picture: "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                writeIn: true
            }

        });
        // return the created candidate id 
        return candidate.candidateID;
    } catch (error) {
        throw new Error("Unknown error during write-in candidate creation");
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

async function updateUser(userID: number, user: User): Promise<User> {
    try {
        const fetchUser = await prisma.user.update({
            where: {
                userID: userID,
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

async function getCompanyStats(companyID: number): Promise<any> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyID: companyID,
            },
            include: {
                ballots: {
                    include: {
                        _count: {
                            select: {
                                votes: true,
                                initiativeVotes: true,
                            },
                        },
                    }
                },
                _count: {
                    select: {
                        users: true,
                    }
                }
            }
        });

        if (!company) {
            throw new Error("Company not found");
        }
        if (!company.ballots) {
            throw new Error("No ballots found for this company");
        }

        const inactiveBallots = company.ballots.filter(ballot => {
            const now = new Date();
            return ballot.startDate < now;
        });
        const activeBallots = company.ballots.filter(ballot => {
            const now = new Date();
            return ballot.startDate <= now && ballot.endDate >= now;
        });
        const avg_votes_per_ballot = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.votes;
        }, 0) / company.ballots.length;
        const avg_initiative_votes_per_ballot = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.initiativeVotes;
        }, 0) / company.ballots.length;
        const total_votes = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.votes;
        }, 0);
        const total_initiative_votes = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.initiativeVotes;
        }, 0);

        const companyStats = {
            inactive_ballots: {
                count: inactiveBallots.length,
                ballots: inactiveBallots.map(ballot => ({
                    ballotID: ballot.ballotID,
                    ballotName: ballot.ballotName,
                    startDate: ballot.startDate,
                    endDate: ballot.endDate,
                }))
            },
            active_ballots: {
                count: activeBallots.length,
                ballots: activeBallots.map(ballot => ({
                    ballotID: ballot.ballotID,
                    ballotName: ballot.ballotName,
                    startDate: ballot.startDate,
                    endDate: ballot.endDate,
                }))
            },
            total_members: company._count.users,
            avg_votes_per_ballot: avg_votes_per_ballot,
            avg_initiative_votes_per_ballot: avg_initiative_votes_per_ballot,
            total_votes: total_votes,
            total_initiative_votes: total_initiative_votes,
        }
        return companyStats;
    } catch (error) {
        throw new Error("Unknown error during company stats retrieval");
    }
}

async function createBallotPosition(position: BallotPositions): Promise<BallotPositions> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create the ballot position
            const newPosition = await tx.ballotPositions.create({
                data: {
                    positionName: position.positionName,
                    allowedVotes: position.allowedVotes,
                    writeIn: position.writeIn,
                    ballot: {
                        connect: { ballotID: position.ballotID },
                    },
                },
            });

            // Create candidates for the position
            if (position.candidates && position.candidates.length > 0) {
                for (const candidate of position.candidates) {
                    const createdCandidate = await tx.candidate.create({
                        data: {
                            fName: candidate.fName,
                            lName: candidate.lName,
                            titles: candidate.titles ?? "",
                            description: candidate.description ?? "",
                            picture: candidate.picture ?? "",
                        },
                    });

                    // Link the candidate to the position
                    await tx.ballotCandidates.create({
                        data: {
                            position: {
                                connect: { positionID: newPosition.positionID },
                            },
                            candidate: {
                                connect: { candidateID: createdCandidate.candidateID },
                            },
                        },
                    });
                }
            }

            return newPosition;
        });

        return result;
    } catch (error) {
        throw new Error("Unknown error during ballot position creation");
    }
}



async function deleteBallotPosition(positionID: number): Promise<boolean> {
    try {
        const deletedPosition = await prisma.ballotPositions.delete({
            where: {
                positionID: positionID,
            },
        });
        return !!deletedPosition;
    } catch (error) {
        throw new Error("Unknown error during ballot position deletion");
    }
}

async function getBallotPosition(positionID: number): Promise<any> {
    try {
        const ballotPosition = await prisma.ballotPositions.findUnique({
            where: {
                positionID: positionID,
            },
        });
        if (!ballotPosition) {
            throw new Error("Ballot position not found");
        }
        if (ballotPosition) {
            return true;
        }
        return false;
    } catch (error) {
        throw new Error("Unknown error during ballot position retrieval");
    }
}

async function updateBallotPosition(positionID: number, positionData: Partial<BallotPositions>): Promise<BallotPositions> {
    try {
        const updatedPosition = await prisma.ballotPositions.update({
            where: {
                positionID: positionID,
            },
            data: {
                positionName: positionData.positionName,
                allowedVotes: positionData.allowedVotes,
                writeIn: positionData.writeIn,
            },
        });
        return updatedPosition;
    } catch (error) {
        throw new Error("Unknown error during ballot position update");
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
                    include: {
                        candidates: {
                            include: {
                                candidate: true,
                            },
                        },
                    },
                },
                initiatives: {
                    include: {
                        responses: true,
                    },
                },
            }
        });

        return ballot;
    } catch (error) {
        throw new Error("Unknown error during ballot retrieval");
    }
}

async function createInitiative(initiative: BallotInitiatives): Promise<BallotInitiatives> {
    try {
        if (!initiative.ballotID) {
            throw new Error("ballotID is required to create an initiative");
        }
        const newInitiative = await prisma.ballotInitiatives.create({
            data: {
                initiativeName: initiative.initiativeName,
                description: initiative.description,
                ballot: {
                    connect: { ballotID: initiative.ballotID },
                },
            },
        });

        // Create responses for the initiative
        for (const response of initiative.responses) {
            await prisma.initiativeResponses.create({
                data: {
                    response: response.response,
                    initiative: {
                        connect: { initiativeID: newInitiative.initiativeID },
                    },
                },
            });
        }

        return newInitiative;
    } catch (error) {
        throw new Error("Unknown error during initiative creation");
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
    try {
        const now = new Date();
        return prisma.ballots.findMany({
            where: {
                startDate: {
                    lte: now,
                },
                endDate: {
                    gte: now,
                },
            },
        });
    } catch (error) {
        throw new Error("Unknown error during active ballot retrieval");
    }
}

async function getInactiveBallots(): Promise<any> {
    try {
        const now = new Date();
        return prisma.ballots.findMany({
            where: {
                endDate: {
                    lt: now,
                },
            },
        });
    } catch (error) {
        throw new Error("Unknown error during inactive ballot retrieval");
    }
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

async function getActiveUserBallots(userID: number): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            include: {
                company: {
                    include: {
                        ballots: {
                            where: {
                                startDate: {
                                    lte: new Date(),
                                },
                                endDate: {
                                    gte: new Date(),
                                },
                            },
                            include: {
                                votes: {
                                    where: {
                                        userID: userID
                                    }
                                }
                            }
                        },
                    },
                },
            },
        });
        // Transform the results to include a hasVoted field
        if (user?.company?.ballots) {
            user.company.ballots = user.company.ballots.map(ballot => ({
                ...ballot,
                hasVoted: ballot.votes.length > 0
            }));
        }
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.company) {
            throw new Error("Company not found");
        }
        if (user.company.ballots.length === 0) {
            throw new Error("No active ballots found for this user");
        }
        return user.company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during user ballot retrieval");
    }
}

async function getInactiveUserBallots(userID: number): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            include: {
                company: {
                    include: {
                        ballots: {
                            where: {
                                endDate: {
                                    lte: new Date(),
                                },
                            },
                            include: {
                                votes: {
                                    where: {
                                        userID: userID
                                    }
                                }
                            }
                        },
                    },
                },
            },
        });
        // Transform the results to include a hasVoted field
        if (user?.company?.ballots) {
            user.company.ballots = user.company.ballots.map(ballot => ({
                ...ballot,
                hasVoted: ballot.votes.length > 0
            }));
        }
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.company) {
            throw new Error("Company not found");
        }
        if (user.company.ballots.length === 0) {
            throw new Error("No active ballots found for this user");
        }
        return user.company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during user ballot retrieval");
    }
}

async function getUserBallots(userID: number): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            include: {
                company: {
                    include: {
                        ballots: {
                            include: {
                                votes: {
                                    where: {
                                        userID: userID
                                    }
                                }
                            }
                        },
                    },
                },
            },
        });
        // Transform the results to include a hasVoted field
        if (user?.company?.ballots) {
            user.company.ballots = user.company.ballots.map(ballot => ({
                ...ballot,
                hasVoted: ballot.votes.length > 0
            }));
        }
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.company) {
            throw new Error("Company not found");
        }
        if (user.company.ballots.length === 0) {
            throw new Error("No active ballots found for this user");
        }
        return user.company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during user ballot retrieval");
    }
}

async function getCompanyBallots(companyID: number): Promise<any> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyID: companyID,
            },
            include: {
                ballots: {
                },
            },
        });
        if (!company) {
            throw new Error("Company not found");
        }
        if (!company.ballots) {
            throw new Error("No ballots found for this company");
        }
        return company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during company ballot retrieval");
    }
}

async function getActiveCompanyBallots(companyID: number): Promise<any> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyID: companyID,
            },
            include: {
                ballots: {
                    where: {
                        startDate: {
                            lte: new Date(),
                        },
                        endDate: {
                            gte: new Date(),
                        },
                    },
                },
            },
        });
        if (!company) {
            throw new Error("Company not found");
        }
        if (!company.ballots) {
            throw new Error("No ballots found for this company");
        }
        return company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during company ballot retrieval");
    }
}

async function getInactiveCompanyBallots(companyID: number): Promise<any> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyID: companyID,
            },
            include: {
                ballots: {
                    where: {
                        endDate: {
                            lte: new Date(),
                        },
                    },
                },
            },
        });
        if (!company) {
            throw new Error("Company not found");
        }
        if (!company.ballots) {
            throw new Error("No ballots found for this company");
        }
        return company.ballots;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during company ballot retrieval");
    }
}

async function createBallot(ballot: Ballot, ballotPositions: BallotPositions[], ballotInitiatives: BallotInitiatives[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create the ballot
            const newBallot = await tx.ballots.create({
                data: {
                    ballotName: ballot.ballotName,
                    description: ballot.description,
                    startDate: new Date(ballot.startDate),
                    endDate: new Date(ballot.endDate),
                    company: {
                        connect: { companyID: ballot.companyID },
                    },
                },
            });

            if (!newBallot) {
                throw new Error("Ballot creation failed");
            }

            // Create the ballot positions and candidates
            for (const position of ballotPositions) {
                const newPosition = await tx.ballotPositions.create({
                    data: {
                        positionName: position.positionName,
                        allowedVotes: position.allowedVotes,
                        writeIn: position.writeIn,
                        ballot: {
                            connect: { ballotID: newBallot.ballotID },
                        },
                    },
                });

                // Create each candidate individually (NOT createMany)
                const createdCandidates = [];
                for (const candidate of position.candidates) {
                    const createdCandidate = await tx.candidate.create({
                        data: {
                            fName: candidate.fName,
                            lName: candidate.lName,
                            titles: candidate.titles ?? "",  // Safe fallback if missing
                            description: candidate.description ?? "",
                            picture: candidate.picture ?? "",
                        },
                    });
                    createdCandidates.push(createdCandidate);
                }

                // Now create the ballotCandidates linking candidates and position
                for (const createdCandidate of createdCandidates) {
                    await tx.ballotCandidates.create({
                        data: {
                            position: {
                                connect: { positionID: newPosition.positionID },
                            },
                            candidate: {
                                connect: { candidateID: createdCandidate.candidateID },
                            },
                        },
                    });
                }
            }

            // Create ballot initiatives and their responses
            for (const initiative of ballotInitiatives) {
                const newInitiative = await tx.ballotInitiatives.create({
                    data: {
                        initiativeName: initiative.initiativeName,
                        description: initiative.description,
                        ballot: {
                            connect: { ballotID: newBallot.ballotID },
                        },
                    },
                });

                for (const response of initiative.responses) {
                    await tx.initiativeResponses.create({
                        data: {
                            response: response.response,
                            initiative: {
                                connect: { initiativeID: newInitiative.initiativeID },
                            },
                        },
                    });
                }
            }

            return newBallot; // Return something useful if needed
        });

        return result; // You can return the result if you want

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error during ballot creation");
    }
}


/**
 * Updates a ballot in the database.
 * 
 * @param ballotID - The ID of the ballot to update
 * @param ballotData - The updated ballot data
 */
async function updateBallot(ballotID: number, ballotData: Partial<Ballot>): Promise<Ballot> {
    console.log("Updating ballot with ID:", ballotID);
    try {
        const updatedBallot = await prisma.ballots.update({
            where: {
                ballotID: ballotID,
            },
            data: {
                ballotName: ballotData.ballotName,
                description: ballotData.description,
                startDate: ballotData.startDate ? new Date(ballotData.startDate) : undefined,
                endDate: ballotData.endDate ? new Date(ballotData.endDate) : undefined,
                company: ballotData.companyID
                    ? {
                            connect: { companyID: ballotData.companyID },
                        }
                    : undefined,
            },
        });
        return {
            ...updatedBallot,
            startDate: updatedBallot.startDate.toISOString(),
            endDate: updatedBallot.endDate.toISOString(),
        };
    } catch (error) {
        throw new Error("Unknown error during ballot update");
    }
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
                                        initiativeVotes: true
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

async function submitBallot(candidateVotes: Vote[], responsesVotes: ResponseVote[]) {
    try {
        // Using a transaction with sequentially executed operations
        const result = await prisma.$transaction(async (tx) => {
            // First insert into votes table and get the created vote
            for (const vote of candidateVotes) {

                // First insert into votes table and get the created vote
                const newVote = await tx.votes.create({
                    data: {
                        user: {
                            connect: {
                                userID: Number(vote.userID),
                            },
                        },
                        ballot: {
                            connect: {
                                ballotID: Number(vote.ballotID),
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
                                positionID: Number(vote.positionID),
                            },
                        },
                        candidate: {
                            connect: {
                                candidateID: Number(vote.candidateID),
                            },
                        },
                    },
                });
            }
            for (const responseVote of responsesVotes) {
                const newVote = await tx.initiativeVotes.create({
                    data: {
                        user: {
                            connect: {
                                userID: Number(responseVote.userID),
                            },
                        },
                        ballot: {
                            connect: {
                                ballotID: Number(responseVote.ballotID),
                            },
                        },
                        initiative: {
                            connect: {
                                initiativeID: Number(responseVote.initiativeID),
                            },
                        },
                        response: {
                            connect: {
                                responseID: Number(responseVote.responseID),
                            },
                        },
                    },
                });
            }
        });
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function checkVoterStatus(ballotID: number, userID: number): Promise<boolean> {
    try {
        const status = await prisma.$queryRaw`
        SELECT check_ballot_voter(${ballotID}::INT, ${userID}::INT) AS status`;
        // Check if the status is true or false
        if (status[0].status === true) {
            return true;
        }
        if (status[0].status === false) {
            return false;
        }
        // If status is neither true nor false, throw an error
        throw new Error("Unknown error during voter status check");
    } catch (error) {
        throw new Error("Unknown error during ballot voter check");
    }
}

/**
 * 
 * Queries the database for the ballot & votes for that ballot based on the ballot,
 * and returns the list of voters for that ballot.
 * 
 * Throws error if there is no vote with that ID. 
 * Throws error message on a database error.
 *
 * @param ballotID - The ID of the ballot to tally
 */
async function tallyBallotVoters(ballotID) {
    try {
        const ballotVoters = await prisma.$queryRaw`
        SELECT
        "fName",
        "lName",
        "username",
        "userID",
        "voted"
        FROM user_voting_status
        WHERE "ballotID" = ${ballotID}
        ORDER BY voted DESC`;
        return ballotVoters;
    } catch (error) {
        throw new Error("Unknown error during ballot voter tally");
    }
}

async function getInitiative(initiativeID: number): Promise<any> {
    try {
        const initiative = await prisma.ballotInitiatives.findUnique({
            where: {
                initiativeID: initiativeID,
            },
        });
        return initiative;
    } catch (error) {
        throw new Error("Unknown error during initiative retrieval");
    }
}

async function deleteInitiative(initiativeID: number): Promise<boolean> {
    try {
        const deletedInitiative = await prisma.ballotInitiatives.delete({
            where: {
                initiativeID: initiativeID,
            },
        });
        return !!deletedInitiative;
    } catch (error) {
        throw new Error("Unknown error during initiative deletion");
    }
}

async function getResponse(responseID: number): Promise<any> {
    try {
        const response = await prisma.initiativeResponses.findUnique({
            where: {
                responseID: responseID,
            },
        });
        return response;
    } catch (error) {
        throw new Error("Unknown error during response retrieval");
    }
}

async function deleteResponse(responseID: number): Promise<boolean> {
    try {
        const deletedResponse = await prisma.initiativeResponses.delete({
            where: {
                responseID: responseID,
            },
        });
        return !!deletedResponse;
    } catch (error) {
        throw new Error("Unknown error during response deletion");
    }
}

async function getBallotStatus(ballotID: number): Promise<any> {
    try {
        const ballotVoters = await prisma.$queryRaw`
        SELECT get_ballot_voting_status(${ballotID}::INT) AS status`;
        // Check if the ballotVoters is empty
        if (!ballotVoters) {
            throw new Error("No ballot status found");
        }
        return ballotVoters[0].status;
    } catch (error) {
        throw new Error("Unknown error during ballot status retrieval");
    }
}

export default {
    getUser,
    getCandidate,
    deleteCandidate,
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
    createCandidate,
    updateBallot,
    updateBallotPosition,
    createBallotPosition,
    deleteBallotPosition,
    getBallotPosition,
    submitBallot,
    checkVoterStatus,
    tallyBallot,
    tallyBallotVoters,
    createInitiativeVote,
    createWriteInCandidate,
    createInitiative,
    getInitiative,
    deleteInitiative,
    getResponse,
    deleteResponse,
    getActiveUserBallots,
    getInactiveUserBallots,
    getUserBallots,
    getCompanyBallots,
    getActiveCompanyBallots,
    getInactiveCompanyBallots,
    getCompanyStats,
    getBallotStatus,
};