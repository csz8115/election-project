import db from '../utils/db.ts';
import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt'

const router = express.Router();

// Create ballot route
router.post('/createBallot', async (req, res): Promise<any> => {
    try {
        const { ballotName, description, startDate, endDate, companyID, positions, initiatives } = req.body;

        // Validate required fields
        if (!ballotName || !description || !startDate || !endDate || !companyID || !positions) {
            throw new Error('Invalid request');
        }

        // Check company exists
        const company = await db.getCompany(Number(companyID));
        if (!company) {
            throw new Error('Company does not exist');
        }

        // Prepare data for Prisma
        const ballotPositions = positions.map((position: any) => ({
            positionName: position.positionName,
            allowedVotes: position.allowedVotes,
            writeIn: position.writeIn,
            candidates: position.candidates.map((candidate: any) => ({
                fName: candidate.fName,
                lName: candidate.lName,
                titles: candidate.titles ?? '',
                description: candidate.description ?? '',
                picture: candidate.picture ?? '',
            })),
        }));

        const ballotInitiatives = initiatives.map((initiative: any) => ({
            initiativeName: initiative.initiativeName,
            description: initiative.description ?? '',
            picture: initiative.picture ?? '',
            responses: initiative.responses.map((response: any) => ({
                response: response.response,
                votes: 0, // You might initialize votes to 0
            })),
        }));

        const ballot = {
            ballotName,
            description,
            startDate,
            endDate,
            companyID: Number(companyID),
            positions: ballotPositions,
            initiatives: ballotInitiatives,
        };

        // Create the ballot in DB
        await db.createBallot(ballot, ballotPositions, ballotInitiatives);

        return res.status(201).json({ message: 'Ballot created successfully' });

    } catch (error: any) {
        console.log('Error creating ballot:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error.message === 'Company does not exist') {
            return res.status(404).json({ error: 'Company does not exist' });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to create ballot' });
    }
});


// Update ballot route
router.put('/updateBallot', async (req, res): Promise<any> => {

    console.log('Update ballot route called');
    try {
        const { ballotID } = req.query;
        const { ballotName, description, startDate, endDate, companyID, positions, initiatives } = req.body;

        // Validate required fields
        if (!ballotID || !ballotName || !description || !startDate || !endDate || !companyID || !positions) {
            throw new Error('Invalid request');
        }

        // Check if the ballot exists
        const existingBallot = await db.getBallot(Number(ballotID));
        if (!existingBallot) {
            throw new Error('Ballot does not exist');
        }

        // Check if the company exists
        const company = await db.getCompany(Number(companyID));
        if (!company) {
            throw new Error('Company does not exist');
        }



        // Handle positions
        const originalPositions = existingBallot.positions;

        for (const originalPosition of originalPositions) {
            // Check if the position still exists in the updated positions
            const positionStillExists = positions.some((updatedPosition: any) =>
                updatedPosition.positionID === originalPosition.positionID
            );

            // If the position does not exist in the updated positions, remove it from the database
            if (!positionStillExists) {
                console.log('Removing position:', originalPosition);
                await db.deleteBallotPosition(originalPosition.positionID);
            }
        }

        for (const position of positions) {
            if (!position.positionID) {
                // Create the position if it doesn't exist
                const newPosition = await db.createBallotPosition({
                    ballotID: Number(ballotID),
                    positionName: position.positionName,
                    allowedVotes: position.allowedVotes,
                    writeIn: position.writeIn,
                });
                position.positionID = newPosition.positionID; // Assign the newly created position ID
            }
        }

        for (const originalPosition of originalPositions) {
            for (const originalCandidate of originalPosition.candidates) {
                // Check if the candidate still exists in the updated positions
                const candidateStillExists = positions.some((updatedPosition: any) =>
                    updatedPosition.candidates.some((updatedCandidate: any) =>
                        updatedCandidate.candidateID === originalCandidate.candidateID
                    )
                );

                // If the candidate does not exist in the updated positions, remove it from the database
                if (!candidateStillExists) {
                    console.log('Removing candidate:', originalCandidate);
                    await db.deleteCandidate(originalCandidate.candidateID);
                }
            }
        }

        for (const position of positions) {
            console.log('Position:', position);
            for (const candidate of position.candidates) {
                if (!candidate.candidateID) {
                    // Create the candidate if it doesn't exist
                    await db.createCandidate(
                        position.positionID,
                        candidate.fName,
                        candidate.lName,
                        candidate.titles ?? '',
                        candidate.description ?? '',
                        candidate.picture ?? ''
                    );
                }
            }
        }


        const updatedPositions = positions.map((position: any) => ({
            positionID: position.positionID,
            positionName: position.positionName,
            allowedVotes: position.allowedVotes,
            writeIn: position.writeIn,
            candidates: position.candidates.map((candidate: any) => ({
                candidateID: candidate.candidateID,
                fName: candidate.fName,
                lName: candidate.lName,
                titles: candidate.titles ?? '',
                description: candidate.description ?? '',
                picture: candidate.picture ?? '',
            })),
        }));

        // Handle initiatives
        const originalInitiatives = existingBallot.initiatives;

        for (const originalInitiative of originalInitiatives) {
            // Check if the initiative still exists in the updated initiatives
            const initiativeStillExists = initiatives.some((updatedInitiative: any) =>
                updatedInitiative.initiativeID === originalInitiative.initiativeID
            );

            // If the initiative does not exist in the updated initiatives, remove it from the database
            if (!initiativeStillExists) {
                console.log('Removing initiative:', originalInitiative);
                await db.deleteInitiative(originalInitiative.initiativeID);
            }
        }

        for (const initiative of initiatives) {
            if (!initiative.initiativeID) {
                // Create the initiative if it doesn't exist
                await db.createInitiative({
                    ballotID: Number(ballotID),
                    initiativeName: initiative.initiativeName,
                    description: initiative.description ?? '',
                    picture: initiative.picture ?? '',
                    responses: initiative.responses.map((response: any) => ({
                        response: response.response,
                        votes: response.votes ?? 0,
                    })),
                });
            }
        }

        const updatedInitiatives = initiatives.map((initiative: any) => ({
            initiativeID: initiative.initiativeID,
            initiativeName: initiative.initiativeName,
            description: initiative.description ?? '',
            picture: initiative.picture ?? '',
            responses: initiative.responses.map((response: any) => ({
                responseID: response.responseID,
                response: response.response,
                votes: response.votes ?? 0,
            })),
        }));

        const updatedBallot = {
            ballotName,
            description,
            startDate,
            endDate,
            companyID: Number(companyID),
            positions: updatedPositions,
            initiatives: updatedInitiatives,
        };

        // Update existing positions in the database
        for (const position of positions) {
            if (position.positionID) {
                await db.updateBallotPosition(
                    position.positionID,
                    {
                        positionName: position.positionName,
                        allowedVotes: position.allowedVotes,
                        writeIn: position.writeIn,
                    }
                );
            }
        }
        // Update the ballot in DB
        await db.updateBallot(Number(ballotID), updatedBallot);

        return res.status(200).json({ message: 'Ballot updated successfully' });

    } catch (error: any) {
        console.log('Error updating ballot:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error.message === 'Ballot does not exist') {
            return res.status(404).json({ error: 'Ballot does not exist' });
        } else if (error.message === 'Company does not exist') {
            return res.status(404).json({ error: 'Company does not exist' });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to update ballot' });
    }
});

export default router;