import prisma from '../utils/db/prisma.ts';
import { User } from '../types/user.ts';
import { Company } from '../types/company.ts';
import { Ballot } from '../types/ballot.ts';
import { Prisma, candidate } from '@prisma/client';
import { Vote } from '../types/vote.ts';
import { ResponseVote } from '../types/response.ts';
import { BallotPositions } from '../types/ballotPositions.ts';
import { BallotInitiatives } from '../types/ballotInitiatives.ts';
import dbLogger from '../../../prisma/dbLogger.ts';

const EXPECTED_PRISMA_ERROR_CODES = new Set(['P2002', 'P2003', 'P2025']);
const IS_TEST_ENV = process.env.NODE_ENV === 'test';

type RepoErrorLogPayload = {
    message: string;
    error?: unknown;
    [key: string]: unknown;
};

function getPrismaKnownRequestError(error: unknown): Prisma.PrismaClientKnownRequestError | null {
    return error instanceof Prisma.PrismaClientKnownRequestError ? error : null;
}

function isExpectedPrismaError(error: unknown): boolean {
    const prismaError = getPrismaKnownRequestError(error);
    return prismaError ? EXPECTED_PRISMA_ERROR_CODES.has(prismaError.code) : false;
}

function normalizeRepositoryErrorMessage(message: string): string {
    const prefix = 'Unknown error during ';
    if (!message.startsWith(prefix)) {
        return message;
    }
    const operation = message.slice(prefix.length);
    return `${operation.charAt(0).toUpperCase()}${operation.slice(1)} failed`;
}

function logRepositoryError(payload: RepoErrorLogPayload): void {
    const { message, error, ...context } = payload;
    const normalizedMessage = normalizeRepositoryErrorMessage(message);
    const prismaError = getPrismaKnownRequestError(error);

    if (IS_TEST_ENV && isExpectedPrismaError(error)) {
        return;
    }

    if (prismaError) {
        dbLogger.error({
            message: normalizedMessage,
            ...context,
            prismaCode: prismaError.code,
            prismaMeta: prismaError.meta,
            error: prismaError.message,
        });
        return;
    }

    dbLogger.error({
        message: normalizedMessage,
        ...context,
        error: error instanceof Error ? error.message : String(error),
    });
}

async function getUser(userID: number): Promise<User | string> {
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
        logRepositoryError({
            message: "Unknown error during user retrieval",
            userID: userID,
            error,
        });
    }
}

async function getUserByUsername(username: string): Promise<User | null> {
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
                password: true,
                company: {
                    select: {
                        companyName: true,
                    }
                },
                // password field is omitted
            },
        });

        return fetchUser;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during user retrieval by username",
            username: username,
            error,
        });
        return null; // Return null if user not found or error occurs
    }
}

async function checkUsername(username: string): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username.trim(),
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
        return user; // Returns user object if exists, null otherwise
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during username check",
            username: username,
            error,
        });
        return false; // Return false if an error occurs
    }
}

async function deleteUser(userID: number): Promise<boolean> {
    try {
        const deletedUser = await prisma.user.delete({
            where: {
                userID: userID,
            },
        });
        return !!deletedUser;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during user deletion",
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during users retrieval by company",
            companyID: companyID,
            error,
        });
    }
}

async function getAllUsers(): Promise<User[]> {
    try {
        const fetchUsers = await prisma.user.findMany({
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
        logRepositoryError({
            message: "Unknown error during all users retrieval",
            error,
        });
    }
}

async function getCandidate(candidateID: number): Promise<candidate | undefined> {
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
        logRepositoryError({
            message: "Unknown error during candidate retrieval",
            candidateID: candidateID,
            error,
        });
    }
}

async function updateCandidate(candidateID: number, candidateData: Partial<candidate>): Promise<candidate | undefined> {
    try {
        const updatedCandidate = await prisma.candidate.update({
            where: {
                candidateID: candidateID,
            },
            data: {
                fName: candidateData.fName,
                lName: candidateData.lName,
                titles: candidateData.titles,
                description: candidateData.description,
                picture: candidateData.picture,
            },
        });
        return updatedCandidate;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during candidate update",
            candidateID: candidateID,
            candidateData: candidateData,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during candidate deletion",
            candidateID: candidateID,
            error,
        });
    }
}

async function createUser(user: User, assignedCompanies: number[] = []): Promise<User> {
    try {
        // Start a transaction to ensure both user creation and linking are successful
        const newUser = await prisma.$transaction(async (tx) => {
            // Check if the user is of type Employee or Admin
            if (user.accountType === "Employee" || user.accountType === "Admin") {
                // Get ID of American Dream Company
                const company = await tx.company.findUnique({
                    where: {
                        companyName: "American Dream",
                    },
                    select: {
                        companyID: true,
                    },
                });

                if (!company) {
                    throw new Error("Company does not exist");
                }

                // Create the user
                const createdUser = await tx.user.create({
                    data: {
                        fName: user.fName,
                        lName: user.lName,
                        username: user.username,
                        password: user.password,
                        accountType: user.accountType,
                        companyID: company.companyID,
                    },
                    select: {
                        userID: true,
                        accountType: true,
                        username: true,
                        fName: true,
                        lName: true,
                        companyID: true,
                        company: true,
                    },
                });

                // If the user is of type Employee, create the assigned companies entries
                if (user.accountType === "Employee") {
                    for (const companyID of assignedCompanies) {
                        await tx.employeeSocietyAssignment.create({
                            data: {
                                user: {
                                    connect: { userID: createdUser.userID },
                                },
                                company: {
                                    connect: { companyID: companyID },
                                },
                            },
                        });
                    }
                }

                return createdUser;
            } else {
                // Otherwise, create the user without assigned companies
                const createdUser = await tx.user.create({
                    data: {
                        fName: user.fName,
                        lName: user.lName,
                        username: user.username,
                        password: user.password,
                        accountType: user.accountType,
                        companyID: user.companyID,
                    },
                    select: {
                        userID: true,
                        accountType: true,
                        username: true,
                        fName: true,
                        lName: true,
                        companyID: true,
                        company: true,
                    },
                });

                return createdUser;
            }
        });

        return newUser; // Return the created user object
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during user creation",
            user: user,
            error,
        });
    }
}


async function createCandidate(positionID: number, fName: string, lName: string, titles: string, description: string, picture: string): Promise<candidate | undefined> {
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
        logRepositoryError({
            message: "Unknown error during candidate creation",
            positionID: positionID,
            fName: fName,
            lName: lName,
            titles: titles,
            description: description,
            picture: picture,
            error,
        });
    }
}

async function createWriteInCandidate(fName: string, lName: string): Promise<number> {
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
        logRepositoryError({
            message: "Unknown error during user update",
            userID: userID,
            user: user,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during user deletion",
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during company retrieval",
            companyID: companyID,
            error,
        });
    }
}

async function getCompanies(): Promise<Company[]> {
    try {
        const companies = await prisma.company.findMany();
        return companies;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during companies retrieval",
            error,
        });
    }
}

async function removeCompany(companyID: number): Promise<boolean> {
    try {
        const company = await prisma.company.delete({
            where: {
                companyID: companyID,
            },
        });
        if (company) {
            return true;
        }
        return false;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during company deletion",
            companyID: companyID,
            error,
        });
    }
}

async function createCompany(company: Company): Promise<Company | undefined> {
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
        logRepositoryError({
            message: "Unknown error during company creation",
            company: company,
            error,
        });
    }
}

async function getCompanyIDByName(companyName: string): Promise<number | null> {
    try {
        const company = await prisma.company.findUnique({
            where: {
                companyName: companyName,
            },
        });
        if (!company) {
            return null; // Return null if company not found
        }
        return company.companyID;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during company ID retrieval by name",
            companyName: companyName,
            error,
        });
    }
}

async function getCompanyStats(companyID: number): Promise<any> {
    try {
        const now = new Date();
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

        const activeBallots = company.ballots.filter((ballot) => {
            return ballot.startDate <= now && ballot.endDate >= now;
        });
        const inactiveBallots = company.ballots.filter((ballot) => {
            return ballot.endDate < now;
        });

        const totalBallots = company.ballots.length;
        const avg_votes_per_ballot = totalBallots > 0 ? company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.votes;
        }, 0) / totalBallots : 0;
        const avg_initiative_votes_per_ballot = totalBallots > 0 ? company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.initiativeVotes;
        }, 0) / totalBallots : 0;
        const total_votes = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.votes;
        }, 0);
        const total_initiative_votes = company.ballots.reduce((acc, ballot) => {
            return acc + ballot._count.initiativeVotes;
        }, 0);

        const toBallotCardStats = (ballot: any) => ({
            ballotID: ballot.ballotID,
            ballotName: ballot.ballotName,
            description: ballot.description,
            startDate: ballot.startDate,
            endDate: ballot.endDate,
            voteCount: ballot._count.votes,
            initiativeVoteCount: ballot._count.initiativeVotes,
            status: ballot.endDate < now ? "closed" : "active",
        });

        const allBallots = company.ballots.map(toBallotCardStats);
        const ballot_vote_ranking = [...allBallots].sort((a, b) => b.voteCount - a.voteCount);

        const voteTrendMap = new Map<string, number>();
        for (const ballot of allBallots) {
            // NOTE: votes table has no vote timestamp; bucket by ballot startDate.
            const bucket = new Date(ballot.startDate).toISOString().slice(0, 10);
            voteTrendMap.set(bucket, (voteTrendMap.get(bucket) ?? 0) + ballot.voteCount);
        }
        const vote_trend = Array.from(voteTrendMap.entries())
            .map(([date, totalVotes]) => ({ date, totalVotes }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const companyStats = {
            inactive_ballots: {
                count: inactiveBallots.length,
                ballots: inactiveBallots.map(toBallotCardStats),
            },
            active_ballots: {
                count: activeBallots.length,
                ballots: activeBallots.map(toBallotCardStats),
            },
            total_members: company._count.users,
            avg_votes_per_ballot: avg_votes_per_ballot,
            avg_initiative_votes_per_ballot: avg_initiative_votes_per_ballot,
            total_votes: total_votes,
            total_initiative_votes: total_initiative_votes,
            ballot_vote_ranking,
            vote_trend,
        }
        return companyStats;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during company stats retrieval",
            companyID: companyID,
            error,
        });
    }
}

async function getSystemStats(): Promise<any> {
    try {
        const now = new Date();

        const [totalCompanies, totalUsers, ballots] = await prisma.$transaction([
            prisma.company.count(),
            prisma.user.count(),
            prisma.ballots.findMany({
                include: {
                    company: {
                        select: {
                            companyID: true,
                            companyName: true,
                        },
                    },
                    _count: {
                        select: {
                            votes: true,
                            initiativeVotes: true,
                        },
                    },
                },
            }),
        ]);

        const activeBallots = ballots.filter((ballot) => {
            return ballot.startDate <= now && ballot.endDate >= now;
        });
        const inactiveBallots = ballots.filter((ballot) => {
            return ballot.endDate < now;
        });

        const toBallotCardStats = (ballot: any) => ({
            ballotID: ballot.ballotID,
            ballotName: ballot.ballotName,
            description: ballot.description,
            companyID: ballot.companyID,
            companyName: ballot.company?.companyName ?? `Company #${ballot.companyID}`,
            startDate: ballot.startDate,
            endDate: ballot.endDate,
            voteCount: ballot._count.votes,
            initiativeVoteCount: ballot._count.initiativeVotes,
            status: ballot.endDate < now ? "closed" : "active",
        });

        const allBallots = ballots.map(toBallotCardStats);
        const totalBallots = allBallots.length;
        const total_votes = allBallots.reduce((acc, ballot) => acc + ballot.voteCount, 0);
        const total_initiative_votes = allBallots.reduce((acc, ballot) => acc + ballot.initiativeVoteCount, 0);
        const avg_votes_per_ballot = totalBallots > 0 ? total_votes / totalBallots : 0;
        const avg_initiative_votes_per_ballot = totalBallots > 0 ? total_initiative_votes / totalBallots : 0;

        const ballot_vote_ranking = [...allBallots].sort((a, b) => b.voteCount - a.voteCount);

        const voteTrendMap = new Map<string, number>();
        for (const ballot of allBallots) {
            // NOTE: votes table has no vote timestamp; bucket by ballot startDate.
            const bucket = new Date(ballot.startDate).toISOString().slice(0, 10);
            voteTrendMap.set(bucket, (voteTrendMap.get(bucket) ?? 0) + ballot.voteCount);
        }
        const vote_trend = Array.from(voteTrendMap.entries())
            .map(([date, totalVotes]) => ({ date, totalVotes }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            total_companies: totalCompanies,
            total_users: totalUsers,
            total_ballots: totalBallots,
            active_ballots: {
                count: activeBallots.length,
                ballots: activeBallots.map(toBallotCardStats),
            },
            inactive_ballots: {
                count: inactiveBallots.length,
                ballots: inactiveBallots.map(toBallotCardStats),
            },
            total_votes,
            total_initiative_votes,
            avg_votes_per_ballot,
            avg_initiative_votes_per_ballot,
            ballot_vote_ranking,
            vote_trend,
        };
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during system stats retrieval",
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot position creation",
            position: position,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot position deletion",
            positionID: positionID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot position retrieval",
            positionID: positionID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot position update",
            positionID: positionID,
            positionData: positionData,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during vote creation",
            userID: userID,
            ballotID: ballotID,
            positionID: positionID,
            candidateID: candidateID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during initiative vote creation",
            userID: userID,
            ballotID: ballotID,
            initiativeID: initiativeID,
            responseID: responseID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot retrieval",
            ballotID: ballotID,
            error,
        });
    }
}

async function useBallot(ballotID: number): Promise<any> {
    try {
        const ballot = await getBallot(ballotID);
        return ballot;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during useBallot",
            ballotID: ballotID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during initiative creation",
            initiative: initiative,
            error,
        });
    }
}

function buildBallotOrderBy(sortBy?: string, sortDir?: "asc" | "desc") {
    if (sortBy === "votes") {
        return { votes: { _count: sortDir || "desc" } };
    }
    return { [sortBy || "endDate"]: sortDir || "desc" };
}

function buildSearchWhereClause(search?: string) {
    if (!search) return undefined;
    return {
        OR: [
            { ballotName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
        ],
    };
}

function filterBallotsByStatus(ballots: any[], status?: "open" | "closed" | "all") {
    if (status === "open") {
        const now = new Date();
        return ballots.filter(ballot => ballot.startDate <= now && ballot.endDate >= now);
    }
    if (status === "closed") {
        const now = new Date();
        return ballots.filter(ballot => ballot.endDate < now);
    }
    return ballots;
}

function normalizeCompanyIds(companies?: number[] | Set<number>) {
    if (!companies) return [];
    const arr = companies instanceof Set ? Array.from(companies) : companies;
    return arr
        .map((x) => (typeof x === "string" ? Number(x) : x))
        .filter((x): x is number => Number.isFinite(x));
}

function buildCombinedWhere(
    search?: string,
    status: "open" | "closed" | "all" = "all",
    companies?: number[] | Set<number>
) {
    const companyIds = normalizeCompanyIds(companies);
    const now = new Date();

    const searchWhere = buildSearchWhereClause(search); // your existing function

    const statusWhere =
        status === "open"
            ? { endDate: { gte: now } }
            : status === "closed"
                ? { endDate: { lt: now } }
                : undefined;

    const companyWhere =
        companyIds.length > 0 ? { companyID: { in: companyIds } } : undefined;

    return {
        AND: [
            // keep your existing OR search clause
            searchWhere ?? {},
            statusWhere ?? {},
            companyWhere ?? {},
        ],
    };
}

async function getBallotIDs(
    search?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "asc",
    status: "open" | "closed" | "all" = "all",
    companies?: number[] | Set<number>
): Promise<number[]> {
    try {
        const where = buildCombinedWhere(search, status, companies);
        const ballots = await prisma.ballots.findMany({
            where,
            orderBy: buildBallotOrderBy(sortBy, sortDir),
            select: {
                ballotID: true,
            },
        });
        return ballots.map(ballot => ballot.ballotID);
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballot IDs retrieval",
            search: search,
            sortBy: sortBy,
            sortDir: sortDir,
            status: status,
            companies: companies,
            error,
        });
        return [];
    }
}

async function getBallots(
    cursor: number = 0,
    search?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "asc",
    status: "open" | "closed" | "all" = "all",
    companies?: number[] | Set<number>
): Promise<{
    ballots: any[];
    nextCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount: number;
} | undefined> {
    const entryPerPage = 40;

    try {
        const where = buildCombinedWhere(search, status, companies);

        // IMPORTANT: count uses the same filters
        const totalCount = await prisma.ballots.count({ where });

        // IMPORTANT: findMany uses the same filters
        const ballots = await prisma.ballots.findMany({
            take: entryPerPage + 1,
            skip: cursor * entryPerPage,
            orderBy: buildBallotOrderBy(sortBy, sortDir),
            where,
        });

        const hasNextPage = ballots.length > entryPerPage;
        const hasPreviousPage = cursor > 0;
        const ballotsPage = hasNextPage ? ballots.slice(0, entryPerPage) : ballots;

        return {
            ballots: ballotsPage,
            nextCursor: hasNextPage ? String(cursor + 1) : null,
            hasNextPage,
            hasPreviousPage,
            totalCount,
        };
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballots retrieval",
            error,
        });
    }
}



async function getBallotsByCompany(
    companyID: number,
    cursor: number = 0,
    search?: string,
    sortBy?: string,
    sortDir: "asc" | "desc" = "asc",
    status: "open" | "closed" | "all" = "all"): Promise<any> {
    try {
        const where = buildCombinedWhere(search, status, new Set([companyID]));

        const totalCount = await prisma.ballots.count({ where });

        const ballots = await prisma.ballots.findMany({
            take: 40 + 1,
            skip: cursor * 40,
            orderBy: buildBallotOrderBy(sortBy, sortDir),
            where,
        });

        const hasNextPage = ballots.length > 40;
        const hasPreviousPage = cursor > 0;
        const ballotsPage = hasNextPage ? ballots.slice(0, 40) : ballots;

        return {
            ballots: ballotsPage,
            nextCursor: hasNextPage ? String(cursor + 1) : null,
            hasNextPage,
            hasPreviousPage,
            totalCount,
        };
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballots retrieval by company",
            companyID: companyID,
            error,
        });
        throw new Error("failed to retrieve ballots for company: " + (error instanceof Error ? error.message : String(error)));
    }
}

async function changeBallotDates(ballotID: number | number[], newStartDate: Date | undefined, newEndDate: Date | undefined): Promise<any> {
    try {
        const ids = Array.isArray(ballotID) ? ballotID : [ballotID];
        const data: { startDate?: Date; endDate?: Date } = {};

        if (newStartDate) data.startDate = newStartDate;
        if (newEndDate) data.endDate = newEndDate;

        if (!Object.keys(data).length) {
            throw new Error("At least one of newStartDate or newEndDate must be provided");
        }

        if (Array.isArray(ballotID)) {
            await prisma.ballots.updateMany({
            where: { ballotID: { in: ids } },
            data,
            });
            return prisma.ballots.findMany({ where: { ballotID: { in: ids } } });
        }

        return prisma.ballots.update({
            where: { ballotID },
            data,
        });
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballot end date update",
            ballotID: ballotID,
            newEndDate: newEndDate,
            error,
        });
        throw new Error("failed to update ballot end date: " + (error instanceof Error ? error.message : String(error)));
    }
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
        logRepositoryError({
            message: "Unknown error during active ballot retrieval",
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during inactive ballot retrieval",
            error,
        });
    }
}

async function getFinishedBallots(): Promise<any> {
    try {
        const now = new Date();
        return prisma.ballots.findMany({
            where: {
                endDate: {
                    lt: now
                }
            },
        });
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during finished ballot retrieval",
            error,
        });
    }
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
        logRepositoryError({
            message: "Unknown error during user active ballot retrieval",
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during user inactive ballot retrieval",
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during user ballot retrieval",
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during company ballot retrieval",
            companyID: companyID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during company active ballot retrieval",
            companyID: companyID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during company inactive ballot retrieval",
            companyID: companyID,
            error,
        });
    }
}

async function createBallot(
    ballot: Ballot,
    ballotPositions: BallotPositions[],
    ballotInitiatives: BallotInitiatives[]
) {
    try {
        return await prisma.$transaction(async (tx) => {
            const newBallot = await tx.ballots.create({
                data: {
                    ballotName: ballot.ballotName,
                    description: ballot.description,
                    startDate: new Date(ballot.startDate),
                    endDate: new Date(ballot.endDate),
                    company: { connect: { companyID: ballot.companyID } },
                },
            });

            for (const position of ballotPositions) {
                const newPosition = await tx.ballotPositions.create({
                    data: {
                        positionName: position.positionName,
                        allowedVotes: position.allowedVotes,
                        writeIn: position.writeIn,
                        ballot: { connect: { ballotID: newBallot.ballotID } },
                    },
                });

                for (const candidate of position.candidates ?? []) {
                    const createdCandidate = await tx.candidate.create({
                        data: {
                            fName: candidate.fName,
                            lName: candidate.lName,
                            titles: candidate.titles ?? "",
                            description: candidate.description ?? "",
                            picture: candidate.picture ?? "",
                        },
                    });

                    await tx.ballotCandidates.create({
                        data: {
                            position: { connect: { positionID: newPosition.positionID } },
                            candidate: { connect: { candidateID: createdCandidate.candidateID } },
                        },
                    });
                }
            }

            for (const initiative of ballotInitiatives ?? []) {
                const newInitiative = await tx.ballotInitiatives.create({
                    data: {
                        initiativeName: initiative.initiativeName,
                        description: initiative.description ?? "",
                        // ⚠️ If your schema has picture required, you MUST include it:
                        // picture: initiative.picture ?? "",
                        ballot: { connect: { ballotID: newBallot.ballotID } },
                    },
                });

                for (const response of initiative.responses ?? []) {
                    await tx.initiativeResponses.create({
                        data: {
                            response: response.response,
                            // ⚠️ If votes is required and has no default, you MUST include it:
                            // votes: 0,
                            initiative: { connect: { initiativeID: newInitiative.initiativeID } },
                        },
                    });
                }
            }

            return newBallot;
        });
    } catch (err) {
        // keep your logger, but ALSO throw
        logRepositoryError({
            message: "Ballot creation failed",
            error:
                err instanceof Prisma.PrismaClientKnownRequestError
                    ? { code: err.code, message: err.message, meta: err.meta }
                    : err instanceof Error
                        ? { message: err.message, stack: err.stack }
                        : String(err),
        });

        throw err; // ✅ CRITICAL
    }
}



/**
 * Updates a ballot in the database.
 * 
 * @param ballotID - The ID of the ballot to update
 * @param ballotData - The updated ballot data
 */
async function updateBallot(ballotID: number, ballotData: Partial<Ballot>): Promise<Ballot> {
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
        logRepositoryError({
            message: "Unknown error during ballot update",
            ballotID: ballotID,
            ballotData: ballotData,
            error,
        });
        return null;
    }
}

async function deleteBallot(ballotID: number): Promise<boolean> {
    try {
        const deletedBallot = await prisma.ballots.delete({
            where: {
                ballotID: ballotID,
            },
        });
        return !!deletedBallot;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballot deletion",
            ballotID: ballotID,
            error,
        });
        return false;
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
        logRepositoryError({
            message: "Unknown error during ballot tally",
            ballotID: ballotID,
            error,
        });
    }
}

type candidateData = {
    description?: string;
    positionID?: number;
    fName?: string;
    lName?: string;
    titles?: string;
    picture?: string;
}

async function addCandidate(candidateData: candidateData) {
    try {
        const newCandidate = await prisma.$transaction(async (tx) => {
            const createdCandidate = await tx.candidate.create({
                data: {
                    description: candidateData.description || "",
                    fName: candidateData.fName || "",
                    lName: candidateData.lName || "",
                    titles: candidateData.titles || "",
                    picture: candidateData.picture || "",
                },
            });

            if (candidateData.positionID) {
                await tx.ballotCandidates.create({
                    data: {
                        position: { connect: { positionID: candidateData.positionID } },
                        candidate: { connect: { candidateID: createdCandidate.candidateID } },
                    },
                });
            }

            return createdCandidate;
        });

        return newCandidate;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during candidate addition",
            candidateData: candidateData,
            error,
        });
    }
}

// same as tallyBallot but only displays the winners and not the full results
async function tallyBallotMember(ballotID: number) {
    try {
        const ballot = await prisma.ballots.findUnique({
            where: {
                ballotID: ballotID,
            },
            include: {
                positions: {
                    include: {
                        candidates: {
                            include: {
                                candidate: true,
                            },
                            orderBy: {
                                candidate: {
                                    positionVotes: {
                                        _count: 'desc'
                                    }
                                }
                            },
                        },
                    },
                },
                initiatives: {
                    include: {
                        responses: true,
                    }
                },
            }
        });

        if (!ballot) {
            throw new Error("Ballot not found");
        }

        return ballot;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during ballot member tally",
            ballotID: ballotID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot submission",
            candidateVotes: candidateVotes,
            responsesVotes: responsesVotes,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during voter status check",
            ballotID: ballotID,
            userID: userID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot voters tally",
            ballotID: ballotID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during initiative retrieval",
            initiativeID: initiativeID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during initiative deletion",
            initiativeID: initiativeID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during response retrieval",
            responseID: responseID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during response deletion",
            responseID: responseID,
            error,
        });
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
        logRepositoryError({
            message: "Unknown error during ballot status retrieval",
            ballotID: ballotID,
            error,
        });
    }
}

async function getEmpAssignedCompanies(userID: number): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            include: {
                employeeSocieties: true,
            },
        });
        return user.employeeSocieties;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during employee assigned companies retrieval",
            userID: userID,
            error,
        });
    }
}

async function getEmployeeCompany(userID: number): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userID: userID,
            },
            include: {
                company: true,
            },
        });
        return user.company;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during employee company retrieval",
            userID: userID,
            error,
        });
    }
}

async function getCompaniesByIDs(companyIDs: number[]): Promise<Company[]> {
    try {
        const companies = await prisma.company.findMany({
            where: {
                companyID: {
                    in: companyIDs,
                },
            },
        });
        return companies;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during companies retrieval by IDs",
            companyIDs: companyIDs,
            error,
        });
    }
}

async function addPosition(positionData: {
    positionName: string;
    allowedVotes?: number;
    writeIn?: boolean;
    ballotID?: number;
}) {
    try {
        const newPosition = await prisma.ballotPositions.create({
            data: {
                positionName: positionData.positionName,
                allowedVotes: positionData.allowedVotes || 1,
                writeIn: positionData.writeIn || false,
                ballot: positionData.ballotID
                    ? {
                        connect: { ballotID: positionData.ballotID },
                    }
                    : undefined,
            },
        });
        return newPosition;
    } catch (error) {
        logRepositoryError({
            message: "Unknown error during position addition",
            positionData: positionData,
            error,
        });
    }
}

export const db = {
    addPosition,
    getUser,
    getCandidate,
    deleteCandidate,
    getUsersByCompany,
    createUser,
    getEmployeeCompany,
    updateUser,
    checkUsername,
    getUserByUsername,
    removeUser,
    getCompany,
    getCompanies,
    getEmpAssignedCompanies,
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
    deleteBallot,
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
    getSystemStats,
    getBallotStatus,
    getAllUsers,
    deleteUser,
    getCompaniesByIDs,
    tallyBallotMember,
    getCompanyIDByName,
    getBallotIDs,
    changeBallotDates,
    updateCandidate,
    useBallot,
    addCandidate
};
