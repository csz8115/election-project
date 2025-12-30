import fs from "fs";
import prisma from "../src/server/utils/db/prisma.ts";
import { AccountType } from "@prisma/client";
import path from "path";
import bcrypt from 'bcrypt';

/**
 * Run a seed step.
 * - Logs the step name once
 * - If it fails, throws with the step name added to the error message
 * - DOES NOT console.error here (so you only see one error at the bottom)
 */
async function step(name: string, fn: () => Promise<void>) {
    console.log(name);
    try {
        await fn();
    } catch (e: any) {
        throw new Error(`Error during step "${name}": ${e?.message ?? String(e)}`);
    }
}

async function main() {
    console.log("Starting bulk seeding process...");

    // Load all JSON data files
    const companies = JSON.parse(
        fs.readFileSync(path.join(__dirname, "companies.json"), "utf8")
    );
    const ballots = JSON.parse(
        fs.readFileSync(path.join(__dirname, "ballots.json"), "utf8")
    );
    const candidates = JSON.parse(
        fs.readFileSync(path.join(__dirname, "candidates.json"), "utf8")
    );
    const users = JSON.parse(
        fs.readFileSync(path.join(__dirname, "users.json"), "utf8")
    );
    const votes = JSON.parse(
        fs.readFileSync(path.join(__dirname, "votes.json"), "utf8")
    );
    const initiatives = JSON.parse(
        fs.readFileSync(path.join(__dirname, "initiatives.json"), "utf8")
    );
    const responses = JSON.parse(
        fs.readFileSync(path.join(__dirname, "responses.json"), "utf8")
    );
    const initiativeVotes = JSON.parse(
        fs.readFileSync(path.join(__dirname, "initiativesVotes.json"), "utf8")
    );

    await step("Inserting companies...", async () => {
        await prisma.company.createMany({
            data: companies.map((company: any) => ({
                companyName: company.companyName,
                abbreviation: company.abbreviation,
                category: company.category,
            })),
        });
    });

    await step("Inserting ballots...", async () => {
        await prisma.ballots.createMany({
            data: ballots.map((ballot: any) => ({
                ballotName: ballot.ballotName,
                description: ballot.description ?? "No Description",
                startDate: new Date(ballot.startDate),
                endDate: new Date(ballot.endDate),
                companyID: Number(ballot.companyID),
            })),
        });
    });

    await step("Inserting candidates...", async () => {
        await prisma.candidate.createMany({
            data: candidates.map((candidate: any) => ({
                candidateID: Number(candidate.candidateID),
                fName: candidate.fName,
                lName: candidate.lName,
                titles: candidate.titles,
                description: candidate.description,
                picture:
                    candidate.picture ?? "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                writeIn: candidate.writeIn ?? false,
            })),
        });
    });

    await step("Inserting ballot positions...", async () => {
        const positionsData = candidates.reduce((positions: any[], candidate: any) => {
            if (!positions.some((pos) => pos.positionID === Number(candidate.positionID))) {
                positions.push({
                    positionID: Number(candidate.positionID),
                    positionName: candidate.positionName,
                    allowedVotes: Number(candidate.allowedVotes),
                    writeIn: false,
                    ballotID: Number(candidate.ballotID),
                });
            }
            return positions;
        }, []);

        await prisma.ballotPositions.createMany({ data: positionsData });
    });

    await step("Inserting ballot candidates...", async () => {
        await prisma.ballotCandidates.createMany({
            data: candidates.map((candidate: any) => ({
                candidateID: Number(candidate.candidateID),
                positionID: Number(candidate.positionID),
            })),
        });
    });

    await step("Inserting users...", async () => {
        await prisma.user.createMany({
            data: users.map((user: any) => ({
                fName: user.fName,
                lName: user.lName,
                username: user.username,
                accountType: AccountType.Member,
                password: user.password ?? "Ac7#9pK2xZ!5qYr",
                companyID: Number(user.companyID),
            })),
            skipDuplicates: true,
        });
    });

    const userIds = new Set(
        (
            await prisma.user.findMany({
                select: { userID: true },
            })
        ).map((user) => user.userID)
    );

    const sanitizedVotes = votes
        .map((vote: any, index: number) => ({
            ballotID: Number(vote.ballotID),
            userID: Number(vote.userID),
            voteID: Number(index + 1), // Assuming vote IDs are sequential starting from 1
        }))
        .filter((vote) => {
            const valid = userIds.has(vote.userID);
            return valid;
        });
    console.log('Filtered votes count:', sanitizedVotes.length);

    // NOTE: If votes still FK-fail, it’s because votes.userID doesn’t match DB user ids.
    await step("Inserting votes...", async () => {
        await prisma.votes.createMany({ data: sanitizedVotes });
    });

    await step("Inserting position votes...", async () => {
        const allCandidates = await prisma.candidate.findMany({ select: { candidateID: true } });
        const validCandidateIDs = new Set(allCandidates.map((c) => c.candidateID));
        const validVoteIDs = new Set(sanitizedVotes.map((vote) => vote.voteID));

        // Build positionVotes from RAW votes so you still have candidateID/positionID
        const positionVotesData = votes
            .map((vote: any, index: number) => ({
                voteID: Number(index + 1),
                positionID: Number(vote.positionID),
                candidateID: Number(vote.candidateID),
            }))
            .filter((pv) => validVoteIDs.has(pv.voteID)) // only if vote exists
            .filter((pv) => validCandidateIDs.has(pv.candidateID)); // only valid candidates

        const res = await prisma.positionVotes.createMany({ data: positionVotesData });
        console.log("positionVotes count:", res.count);
    });

    await step("Inserting initiatives...", async () => {
        for (const initiative of initiatives) {
            await prisma.ballotInitiatives.create({
                data: {
                    initiativeName: initiative.title,
                    description: initiative.description,
                    ballotID: Number(initiative.ballotID) || 1,
                },
            });
        }
        console.log(`Initiatives count: ${initiatives.length}`);
    });

    await step("Inserting initiative responses...", async () => {
        for (const response of responses) {
            await prisma.initiativeResponses.create({
                data: {
                    response: response.response,
                    initiativeID: Number(response.initiativeID),
                },
            });
        }
        console.log(`Initiative responses count: ${responses.length}`);
    });

    await step("Inserting initiative votes...", async () => {
        for (const vote of initiativeVotes) {
            await prisma.initiativeVotes.create({
                data: {
                    userID: Number(vote.userID),
                    initiativeID: Number(vote.initiativeID),
                    responseID: Number(vote.responseID),
                    ballotID: Number(vote.ballotID) || 1,
                },
            });
        }
        console.log(`Initiative votes count: ${initiativeVotes.length}`);
    });

    await step("Ensuring American Dream company exists...", async () => {
        const existingCompany = await prisma.company.findFirst({
            where: { companyName: "American Dream" },
        });

        if (!existingCompany) {
            await prisma.company.create({
                data: {
                    companyName: "American Dream",
                    abbreviation: "AD",
                    category: "Employee",
                },
            });
        }
    });
    await step("Creating test users...", async () => {
        const testUsers = [
            {
                fName: "Admin",
                lName: "User",
                username: "ADminUser",
                password: await bcrypt.hash("Adminpassword123!", 10),
                accountType: AccountType.Admin,
                companyID: 81,
            },
            {
                fName: "Member",
                lName: "User",
                username: "memberuser",
                password: await bcrypt.hash("Memberpassword123!", 10),
                accountType: AccountType.Member,
                companyID: 1,
            },
            {
                fName: "Officer",
                lName: "User",
                username: "officeruser",
                password: await bcrypt.hash("Officerpassword123!", 10),
                accountType: AccountType.Officer,
                companyID: 1,
            },
            {
                fName: "Employee",
                lName: "User",
                username: "ADEmployeeJoe",
                password: await bcrypt.hash("Employeepassword123!", 10),
                accountType: AccountType.Employee,
                companyID: 81,
            }
        ];

        // Insert ADEmployeeJoe's assigned companies if not already present

        for (const user of testUsers) {
            await prisma.user.create({
                data: user,
            });
        }
                const existingEmployee = await prisma.user.findFirst({
            where: { accountType: AccountType.Employee },
        });
        const assignedCompanies = [
            { userID: existingEmployee.userID, companyID: 1 },
            { userID: existingEmployee.userID, companyID: 2 },
            { userID: existingEmployee.userID, companyID: 3 },
        ];

        for (const assignment of assignedCompanies) {
            await prisma.employeeSocietyAssignment.create({
                data: assignment,
            });
        }
    });
}


// Execute the main function
main()
    .then(() => {
        console.log("...");
    })
    .catch((e) => {
        console.error(e?.message ?? String(e)); // <- one line
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });