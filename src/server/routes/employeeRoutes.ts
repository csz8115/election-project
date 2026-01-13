import { db } from '../utils/db/db.ts';
import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { requireRole } from '../utils/requireRole.ts';
import logger from '../utils/logger.ts';


const router = express.Router();

router.get('/getCompanies', async (req, res): Promise<any> => {
    try {
        const companies = await db.getCompanies();
        return res.status(200).json(companies);
    } catch (error) {
        console.error('Error retrieving companies:', error);
        return res.status(500).json({ error: "Failed to retrieve companies." });
    }
});

router.post('/getBallots', async (req, res): Promise<any> => {
    try {
        const cursor = Number(req.body.page);
        const query = req.body.q as string | undefined;
        const sortBy = req.body.sortBy as string | undefined;
        const sortDir = req.body.sortDir as "asc" | "desc" | undefined;
        const status = req.body.status as "open" | "closed" | "all" | undefined;
        const companies = req.body.companies as (number[] | Set<number>) | undefined;
        // Validate cursor
        if (cursor !== undefined && isNaN(cursor)) {
            throw new Error('Invalid cursor value');
        }

        // Validate query
        if (query !== undefined && typeof query !== 'string') {
            throw new Error('Invalid query value');
        }

        // Validate and sanitize query with Zod
        const querySchema = z.string().trim().max(100).regex(/^[a-zA-Z0-9\s\-_]*$/, 'Query contains invalid characters').optional();
        const sanitizedQuery = query ? querySchema.parse(query) : undefined;

        // Validate sortBy and sortDir
        const validSortByFields = ["ballotName", "startDate", "endDate", "createdAt", "votes"];
        const validSortDirValues = ["asc", "desc"];
        const validStatusValues = ["open", "closed", "all"];

        if (sortBy && !validSortByFields.includes(sortBy)) {
            throw new Error('Invalid sortBy value');
        }

        if (sortDir && !validSortDirValues.includes(sortDir)) {
            throw new Error('Invalid sortDir value');
        }

        if (status && !validStatusValues.includes(status)) {
            throw new Error('Invalid status value');
        }

        if (companies !== undefined) {
            if (Array.isArray(companies)) {
                if (!companies.every(id => typeof id === 'number')) {
                    throw new Error('Invalid companies value: all company IDs must be numbers');
                }
            } else if (companies instanceof Set) {
                for (const id of companies) {
                    if (typeof id !== 'number') {
                        throw new Error('Invalid companies value: all company IDs must be numbers');
                    }
                }
            } else {
                throw new Error('Invalid companies value: must be an array or a set of numbers');
            }
        }

        // Fetch ballots from the database
        const ballots = await db.getBallots(cursor, sanitizedQuery, sortBy, sortDir, status, companies);
        // Prepare the response
        const response = {
            ballots: ballots.ballots,
            nextCursor: ballots.nextCursor,
            hasNextPage: ballots.hasNextPage,
            hasPreviousPage: ballots.hasPreviousPage,
            totalCount: ballots.totalCount,
        };
        logger.info(`Retrieved ${response.ballots.length} ballots successfully`);
        return res.status(200).json(response);
    } catch (error: any) {
        console.error("Error retrieving ballots:", error);

        if (error.message === 'Invalid cursor value') {
            return res.status(400).json({ error: 'Invalid cursor value' });
        } else if (error.message === 'No ballots found') {
            return res.status(404).json({ error: 'No ballots found' });
        } else if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        return res.status(500).json({ error: "Failed to retrieve ballots." });
    }
});
// Create ballot route
router.post('/createBallot', requireRole('Employee', 'Admin'), async (req, res): Promise<any> => {
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
router.put('/updateBallot', requireRole('Employee', 'Admin'), async (req, res): Promise<any> => {

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

router.get(`/getAssignedCompanies`, requireRole('Employee'), async (req, res): Promise<any> => {
    try {
        const { userID } = req.query;

        if (!userID) {
            throw new Error('Invalid request');
        }

        // Validate userID
        const userIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'User ID must be a positive number',
        });

        userIDSchema.parse(userID);

        // Fetch the list of assigned company objects
        const assignments = await db.getEmpAssignedCompanies(Number(userID));

        if (!assignments || assignments.length === 0) {
            throw new Error('No assigned companies found');
        }

        // Extract company IDs from the assignments
        const companyIDs = assignments.map((assignment) => assignment.companyID);

        // Fetch the company details using the list of IDs
        const companies = await db.getCompaniesByIDs(companyIDs);

        if (!companies || companies.length === 0) {
            throw new Error('No company details found');
        }

        return res.status(200).json(companies);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle no assigned companies found error
        else if (error.message === 'No assigned companies found') {
            return res.status(404).json({ error: 'No assigned companies found' });
        }
        // Handle no company details found error
        else if (error.message === 'No company details found') {
            return res.status(404).json({ error: 'No company details found' });
        }
        // Handle other errors
        console.error('Error in /getAssignedCompanies:', error);
        return res.status(500).json({ error: 'Failed to get assigned companies' });
    }
});

router.post('/createBallotFromList', requireRole('Employee', 'Admin'), async (req, res): Promise<any> => {
    try {
        const { ballotName, description, startDate, endDate, companyID, positions, initiatives, userID } = req.body;
        //const userID = res.locals.userID; // Extract userID from session
        console.log('User ID:', userID);

        // Validate required fields
        if (!ballotName || !description || !startDate || !endDate || !companyID || !positions) {
            throw new Error('Invalid request');
        }

        // Fetch the list of assigned companies for the employee
        const assignedCompanies = await db.getEmpAssignedCompanies(userID);
        const assignedCompanyIDs: number[] = assignedCompanies.map((assignment: { companyID: number }) => assignment.companyID);

        // Check if the provided companyID is in the list of assigned companies
        if (!assignedCompanyIDs.includes(Number(companyID))) {
            throw new Error('User is not authorized to create a ballot for this company');
        }

        // Check if the company exists
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
        } else if (error.message === 'User is not authorized to create a ballot for this company') {
            return res.status(403).json({ error: 'Unauthorized to create a ballot for this company' });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to create ballot' });
    }
});

export default router;