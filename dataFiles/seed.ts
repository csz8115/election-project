import fs from 'fs';
import db from '../src/server/utils/db.ts';
import prisma from '../client.ts';

async function main() {
    const candidates = JSON.parse(fs.readFileSync('dataFiles/candidates.json', 'utf8'));
    const votes = JSON.parse(fs.readFileSync('dataFiles/votes.json', 'utf8'));
    const users = JSON.parse(fs.readFileSync('dataFiles/users.json', 'utf8'));
    const companies = JSON.parse(fs.readFileSync('dataFiles/companies.json', 'utf8'));
    const ballots = JSON.parse(fs.readFileSync('dataFiles/ballots.json', 'utf8'));
    const initiatives = JSON.parse(fs.readFileSync('dataFiles/initiatives.json', 'utf8'));
    const initiativeVotes = JSON.parse(fs.readFileSync('dataFiles/initiativesVotes.json', 'utf8'));
    const responses = JSON.parse(fs.readFileSync('dataFiles/responses.json', 'utf8'));

    // Seed the database with the data from the JSON files
    for (const company of companies) {
        // insert the company into the database
        const companyInsert = {
            companyName: company.companyName,
            abbreviation: company.abbreviation,
            category: company.category,
        }
        await db.createCompany(companyInsert);
    }
    // insert the ballots into the database
    for (const ballot of ballots) {
        const ballotInsert = {
            ballotName: ballot.ballotName,
            description: ballot.description ? ballot.description : "No Description",
            startDate: ballot.startDate,
            endDate: ballot.endDate,
            companyID: Number(ballot.companyID),

        }
        await db.createBallot(ballotInsert, [], []);
    }

    // insert candidates into the db
    for (const candidate of candidates) {
        const candidateInsert = {
            fName: candidate.fName,
            lName: candidate.lName,
            titles: candidate.titles,
            description: candidate.description,
            picture: candidate.picture ? candidate.picture : "https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk"
        }
        // check if the candidate position exists in the db if not create it
        const pos = await prisma.ballotPositions.findUnique({
            where: {
                positionID: Number(candidate.positionID)
            }
        });
        // if the position does not exist create it
        if (!pos) {
            await prisma.ballotPositions.create({
                data: {
                    positionName: candidate.positionName,
                    allowedVotes: Number(candidate.allowedVotes),
                    writeIn: false,
                    ballot: {
                        connect: {
                            ballotID: Number(candidate.ballotID)
                        }
                    }
                }
            });
        }
        // insert into the candidates table
        await prisma.candidate.create({
            data: candidateInsert
        })

        // insert into Ballot Candidates Table
        await prisma.ballotCandidates.create({
            data: {
                candidate: {
                    connect: {
                        candidateID: Number(candidate.candidateID)
                    }
                },
                position: {
                    connect: {
                        positionID: Number(candidate.positionID)
                    }
                }
            }
        });
    }
    // insert users into the db
    for (const user of users) {
        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: {
            username: user.username
            }
        });

        if (!existingUser) {
            await prisma.user.create({
            data: {
                fName: user.fName,
                lName: user.lName,
                username: user.username,
                accountType: user.accountType,
                password: user.password || 'Ac7#9pK2xZ!5qYr', // 15-char random password,
                company: {
                connect: {
                    companyID: Number(user.companyID)
                }
                },
            }
            });
        } else {
            console.log(`Skipping duplicate username: ${user.username}`);
        }
    }

    // insert votes into the db
    for (const vote of votes) {
        try {
            await db.createVote(vote.userID, vote.ballotID, vote.positionID, vote.candidateID);
        } catch (error) {
            console.log(`Skipping vote: User ${vote.userID}, Ballot ${vote.ballotID}, Position ${vote.positionID}, Candidate ${vote.candidateID}`);
        }
    }
    // insert initiatives into the db 
    for (const initiative of initiatives) {
        await prisma.ballotInitiatives.create({
            data: {
                initiativeName: initiative.title,
                description: initiative.description,
                ballot: {
                    connect: {
                        ballotID: Number(initiative.ballotID)
                    }
                }
            }
        });
    }
    // insert responses into the db
    for (const response of responses) {
        await prisma.initiativeResponses.create({
            data: {
                response: response.response,
                initiative: {
                    connect: {
                        initiativeID: Number(response.initiativeID)
                    }
                },
            }
        });
    }

    // insert initiative votes into the db
    for (const initiativeVote of initiativeVotes) {
        db.createInitiativeVote(initiativeVote.userID, initiativeVote.ballotID, initiativeVote.initiativeID, initiativeVote.responseID);
    }

    // create a company for American Dream Employees
    const company = await prisma.company.create({
        data: {
            companyName: "American Dream",
            abbreviation: "AD",
            category: "Employee"
        }
    });

}

main().catch(e => console.error(e));