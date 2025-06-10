import fs from 'fs';
import prisma from '../client.ts';
import { AccountType } from '@prisma/client';
import path from 'path';

async function main() {
    try {
        console.log('Starting bulk seeding process...');

        // Load all JSON data files
        const companies = JSON.parse(fs.readFileSync(path.join(__dirname, 'companies.json'), 'utf8'));
        const ballots = JSON.parse(fs.readFileSync(path.join(__dirname, 'ballots.json'), 'utf8'));
        const candidates = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidates.json'), 'utf8'));
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
        const votes = JSON.parse(fs.readFileSync(path.join(__dirname, 'votes.json'), 'utf8'));
        const initiatives = JSON.parse(fs.readFileSync(path.join(__dirname, 'initiatives.json'), 'utf8'));
        const responses = JSON.parse(fs.readFileSync(path.join(__dirname, 'responses.json'), 'utf8'));
        const initiativeVotes = JSON.parse(fs.readFileSync(path.join(__dirname, 'initiativesVotes.json'), 'utf8'));

        // Insert companies using createMany
        console.log('Inserting companies...');
        try {
            await prisma.company.createMany({
                data: companies.map(company => ({
                    companyName: company.companyName,
                    abbreviation: company.abbreviation,
                    category: company.category,
                    // If your companies.json has companyID, uncomment the next line
                    // companyID: company.companyID,
                })),
            });
        } catch (error) {
            console.error('Error inserting companies:', error);
        }

        // Insert ballots using createMany
        console.log('Inserting ballots...');
        try {
            await prisma.ballots.createMany({
                data: ballots.map(ballot => ({
                    ballotName: ballot.ballotName,
                    description: ballot.description ?? "No Description",
                    startDate: new Date(ballot.startDate),
                    endDate: new Date(ballot.endDate),
                    companyID: Number(ballot.companyID),
                })),
            });
        }
        catch (error) {
            console.error('Error inserting ballots:', error);
        }

        // Insert candidates using createMany
        console.log('Inserting candidates...');
        try {
            await prisma.candidate.createMany({
                data: candidates.map(candidate => ({
                    candidateID: Number(candidate.candidateID),
                    fName: candidate.fName,
                    lName: candidate.lName,
                    titles: candidate.titles,
                    description: candidate.description,
                    picture: candidate.picture ?? "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                    writeIn: candidate.writeIn ?? false,
                })),
            });
        } catch (error) {
            console.error('Error inserting candidates:', error);
        }

        // Insert ballot positions
        console.log('Inserting ballot positions...');
        try {
            const positionsData = candidates.reduce((positions, candidate) => {
                // Skip if this position is already added
                if (!positions.some(pos => pos.positionID === Number(candidate.positionID))) {
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
            await prisma.ballotPositions.createMany({
                data: positionsData,
            });
        }
        catch (error) {
            console.error('Error inserting ballot positions:', error);
        }

        // Insert ballot candidates (linking table)
        console.log('Inserting ballot candidates...');
        try {
            await prisma.ballotCandidates.createMany({
                data: candidates.map(candidate => ({
                    candidateID: Number(candidate.candidateID),
                    positionID: Number(candidate.positionID),
                })),
            });
        } catch (error) {
            console.error('Error inserting ballot candidates:', error);
        }

        // Insert users using createMany
        console.log('Inserting users...');
        try {
            // Ensure all users have a default password if not specified
            await prisma.user.createMany({
                data: users.map(user => ({
                    // userID can be added if in your JSON
                    fName: user.fName,
                    lName: user.lName,
                    username: user.username,
                    accountType: AccountType.Member,
                    password: user.password ?? 'Ac7#9pK2xZ!5qYr', // Default password
                    companyID: Number(user.companyID),
                })),
                skipDuplicates: true, // Skip duplicates based on unique constraints
            });
        } catch (error) {
            console.error('Error inserting users:', error);
        }

        // Insert votes in bulk using a proper approach with connections
        console.log('Inserting votes...');
        try {
            await prisma.votes.createMany({
                data: votes.map(vote => ({
                    userID: Number(vote.userID),
                    ballotID: Number(vote.ballotID), // Default to ballot 1 if not specified
                }))
            });
            console.log(`Successfully inserted ${votes.length} votes with position connections`);
        } catch (error) {
            console.error('Error inserting votes:', error);
            // Continue with other operations
        }

        // Insert into position votes using the index of the vote as the voteID
        console.log('Inserting position votes...');
        try {
            const allCandidates = await prisma.candidate.findMany({ select: { candidateID: true } });
            const validCandidateIDs = new Set(allCandidates.map(c => c.candidateID));

            const rawPositionVotes = votes.map((vote, index) => ({
                candidateID: Number(vote.candidateID), // ❗ make sure this exists
                positionID: Number(vote.positionID),
                voteID: index + 1,
            }));

            const filtered = rawPositionVotes.filter(v => validCandidateIDs.has(v.candidateID));

            console.log(`Filtered position votes: ${filtered.length} / ${rawPositionVotes.length}`);

            await prisma.positionVotes.createMany({ data: filtered });
        } catch (error) {
            console.error('Error inserting position votes:', error);
        }

        // Insert initiatives with proper ballot connections
        console.log('Inserting initiatives...');
        try {
            for (const initiative of initiatives) {
                await prisma.ballotInitiatives.create({
                    data: {
                        initiativeName: initiative.title,
                        description: initiative.description,
                        ballotID: Number(initiative.ballotID) || 1, // Default to ballot 1 if not specified
                    }
                });
            }
            console.log(`Successfully inserted ${initiatives.length} initiatives`);
        } catch (error) {
            console.error('Error inserting initiatives:', error);
            // Continue with other operations
        }

        // Insert initiative responses with proper initiative connections
        console.log('Inserting initiative responses...');
        try {
            for (const response of responses) {
                await prisma.initiativeResponses.create({
                    data: {
                        response: response.response,
                        initiativeID: Number(response.initiativeID),
                    }
                });
            }
            console.log(`Successfully inserted ${responses.length} initiative responses`);
        } catch (error) {
            console.error('Error inserting initiative responses:', error);
            // Continue with other operations
        }

        // Improved initiative votes handling using your db.createInitiativeVote pattern
        console.log('Inserting initiative votes...');
        try {
            for (const vote of initiativeVotes) {
                await prisma.initiativeVotes.create({
                    data: {
                        userID: Number(vote.userID),
                        initiativeID: Number(vote.initiativeID),
                        responseID: Number(vote.responseID),
                        ballotID: Number(vote.ballotID) || 1, // Default to ballot 1 if not specified
                    }
                });
            }
            console.log(`Successfully inserted ${initiativeVotes.length} initiative votes`);
        } catch (error) {
            console.error('Error inserting initiative votes:', error);
            // Continue with other operations
        }

        // Create a company for American Dream Employees if it doesn't exist
        try {
            const existingCompany = await prisma.company.findFirst({
                where: { companyName: "American Dream" }
            });

            if (!existingCompany) {
                await prisma.company.create({
                    data: {
                        companyName: "American Dream",
                        abbreviation: "AD",
                        category: "Employee"
                    }
                });
                console.log('Created American Dream company successfully.');
            } else {
                console.log('American Dream company already exists.');
            }
        }
        catch (error) {
            console.error('Error creating American Dream company:', error);
        }
        // Seeding complete
        console.log('Bulk seeding completed successfully!');
    } catch (error) {
        console.error('Error during bulk seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => console.log('Seeding complete'))
    .catch(e => {
        console.error('Error during seeding:', e);
        process.exit(1);
    });
