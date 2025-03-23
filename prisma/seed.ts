import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const data = JSON.parse(fs.readFileSync('dataFiles/data.json', 'utf8'));

    // Seed the database with the data from the JSON file
    for (const company of data.companies) {
        // insert the company into the database
        await prisma.company.create({
            data: {
                companyName: company.companyName,
            }
        });
        // insert the ballots into the database
        for (const ballot of company.ballots) {
            await prisma.ballots.create({
                data: {
                    ballotName: ballot.ballotName,
                    description: ballot.description ? ballot.description : "No Description",
                    startDate: new Date(ballot.startDate),
                    endDate: new Date(ballot.endDate),
                    company: {
                        connect: {
                            companyID: company.companyID
                        }
                    }
                }
            });
            // insert BallotPositions into the database
            for (const position of ballot.positions) {
                await prisma.ballotPositions.create({
                    data: {
                        positionName: position.positionName,
                        voteNum: position.voteNum,
                        writeIn: position.writeIn ? position.writeIn : false,
                        ballot: {
                            connect: {
                                ballotID: ballot.ballotID
                            }
                        }
                    }
                });
                // insert Candidates into the database
                for (const candidate of position.candidates) {
                    await prisma.candidate.create({
                        data: {
                            fName: candidate.fName,
                            lName: candidate.lName,
                            titles: candidate.titles ? candidate.titles : null,
                            positions: candidate.positions ? candidate.positions : null,
                            description: candidate.description ? candidate.description : null,
                            picture: candidate.picture ? candidate.picture : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
                        }
                    });
                    // insert into Ballot Candidates Table
                    await prisma.ballotCandidates.create({
                        data: {
                            candidate: {
                                connect: {
                                    candidateID: candidate.candidateID
                                }
                            },
                            position: {
                                connect: {
                                    positionID: position.positionID
                                }
                            }
                        }
                    });

                }
            }
            // insert into BallotInitiatives Table
            if (ballot.initiatives) {
                for (const initiative of ballot.initiatives) {
                    await prisma.ballotInitiatives.create({
                        data: {
                            initiativeName: initiative.initiativeName,
                            description: initiative.description ? initiative.description : "No Description",
                            ballot: {
                                connect: {
                                    ballotID: ballot.ballotID
                                }
                            }
                        }
                    });
                }
            }
        }
    }
}
console.log('Seeding database complete');

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });