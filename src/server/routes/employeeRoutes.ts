import { db } from '../utils/db/db.ts';
import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { requireRole } from '../utils/requireRole.ts';
import logger from '../utils/logger.ts';
import { Prisma } from '@prisma/client';


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

router.delete('/deleteBallot', async (req, res): Promise<any> => {
    try {
        const { ballotID } = req.query;

        if (!ballotID) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }

        const ballotIDNum = Number(ballotID);
        if (isNaN(ballotIDNum) || ballotIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        await db.deleteBallot(ballotIDNum);
        return res.status(200).json({ message: 'Ballot deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting ballot:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to delete ballot' });
    }
});

router.get('/getBallot', async (req, res): Promise<any> => {
    try {
        const { ballotID } = req.query;

        if (!ballotID) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }

        const ballotIDNum = Number(ballotID);
        if (isNaN(ballotIDNum) || ballotIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        const ballot = await db.useBallot(ballotIDNum);
        if (!ballot) {
            return res.status(404).json({ error: 'Ballot does not exist' });
        }
        return res.status(200).json({ ballot });
    } catch (error) {
        console.error('Error retrieving ballot:', error);
        return res.status(500).json({ error: "Failed to retrieve ballot." });
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

router.post('/getBallotIDs', async (req, res): Promise<any> => {
    try {
        const query = req.body.q as string | undefined;
        const sortBy = req.body.sortBy as string | undefined;
        const sortDir = req.body.sortDir as "asc" | "desc" | undefined;
        const status = req.body.status as "open" | "closed" | "all" | undefined;
        const companies = req.body.companies as (number[] | Set<number>) | undefined;

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
        const ballots = await db.getBallotIDs(sanitizedQuery, sortBy, sortDir, status, companies);
        // Prepare the response
        const response = {
            ballots: ballots
        };
        logger.info(`Retrieved ${ballots.length} ballots successfully`);
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
router.post("/createBallot", requireRole("Employee", "Admin"), async (req, res): Promise<any> => {
    try {
        const {
            ballotName,
            description,
            startDate,
            endDate,
            companyID,
            positions,
            initiatives,
        } = req.body;

        // ✅ Validate arrays properly
        if (
            !ballotName ||
            !description ||
            !startDate ||
            !endDate ||
            !companyID ||
            !Array.isArray(positions) ||
            positions.length === 0
        ) {
            return res.status(400).json({ error: "Invalid request" });
        }

        // initiatives can be optional, normalize to []
        const safeInitiatives = Array.isArray(initiatives) ? initiatives : [];

        // check company exists
        const company = await db.getCompany(Number(companyID));
        if (!company) return res.status(404).json({ error: "Company does not exist" });

        const ballotPositions = positions.map((position: any) => ({
            positionName: position.positionName,
            allowedVotes: position.allowedVotes,
            writeIn: position.writeIn,
            candidates: Array.isArray(position.candidates) ? position.candidates.map((candidate: any) => ({
                fName: candidate.fName,
                lName: candidate.lName,
                titles: candidate.titles ?? "",
                description: candidate.description ?? "",
                picture: candidate.picture ?? "",
            })) : [],
        }));

        const ballotInitiatives = safeInitiatives.map((initiative: any) => ({
            initiativeName: initiative.initiativeName,
            description: initiative.description ?? "",
            picture: initiative.picture ?? "",
            responses: Array.isArray(initiative.responses) ? initiative.responses.map((response: any) => ({
                response: response.response,
                votes: 0,
            })) : [],
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

        const created = await db.createBallot(ballot, ballotPositions, ballotInitiatives);

        return res.status(201).json({ message: "Ballot created successfully", ballotID: created.ballotID });
    } catch (err: any) {
        // debugging info dev logs
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: err.code, details: err.meta ?? err.message });
        }
        return res.status(500).json({ error: err?.message ?? "Failed to create ballot" });
    }
});


// Update ballot route
router.put(`/editBallot`, async (req, res): Promise<any> => {
    try {
        const { ballotID, ballotName, startDate, endDate, description } = req.body;

        if (!ballotID) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }

        const ballotIDNum = Number(ballotID);
        if (Number.isNaN(ballotIDNum) || ballotIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        const ballot = await db.getBallot(ballotIDNum);
        if (!ballot) {
            return res.status(404).json({ error: 'Ballot does not exist' });
        }

        const ballotNameCheck = 
        (() => {
            if (ballotName === undefined || ballotName === null || ballotName === '') {
                return ballot.ballotName;
            }
            return z
                .string()
                .trim()
                .min(5, 'Ballot name must be at least 5 characters long')
                .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Ballot name contains invalid characters')
                .parse(ballotName);
        })()

        const updatedBallot = {
            ballotID: ballotIDNum,
            ballotName: ballotNameCheck,
            startDate: startDate ?? ballot.startDate,
            endDate: endDate ?? ballot.endDate,
            description: description ?? ballot.description,
        };

        await db.updateBallot(ballotIDNum, updatedBallot);

        return res.status(200).json({ message: 'Ballot updated successfully' });
    } catch (error) {
        console.error('Error updating ballot:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to update ballot' });
    }
});

router.delete('/deleteBallot', async (req, res): Promise<any> => {
    try {
        const candidateInputs = [
            req.query.ballotID,
            req.query.ballotIDs,
            req.body?.ballotID,
            req.body?.ballotIDs,
        ].filter((value) => value !== undefined);

        if (candidateInputs.length === 0) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }

        const normalizeIDs = (input: unknown): number[] => {
            if (Array.isArray(input)) {
                return input.flatMap(normalizeIDs);
            }
            if (typeof input === 'string') {
                return input
                    .split(',')
                    .map((part) => Number(part.trim()))
                    .filter((num) => !Number.isNaN(num));
            }
            if (typeof input === 'number') {
                return [input];
            }
            return [];
        };

        const ballotIDs = Array.from(
            new Set(candidateInputs.flatMap(normalizeIDs))
        );

        if (ballotIDs.length === 0 || ballotIDs.some((id) => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        for (const id of ballotIDs) {
            await db.deleteBallot(id);
        }

        return res.status(200).json({
            message: `Deleted ${ballotIDs.length} ballot${ballotIDs.length > 1 ? 's' : ''} successfully`,
            deletedIDs: ballotIDs,
        });
    } catch (error) {
        console.error('Error deleting ballot:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to delete ballot' });
    }
});

router.put('/changeDate', async (req, res): Promise<any> => {
    try {
        const { ballotID, newStartDate, newEndDate } = req.body;

        if (!ballotID || (!newStartDate && !newEndDate)) {
            return res.status(400).json({ error: 'Ballot ID and at least one of new start date or new end date are required' });
        }

        const ballotIDNum = Number(ballotID);
        if (Number.isNaN(ballotIDNum) || ballotIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        const ballot = await db.getBallot(ballotIDNum);
        if (!ballot) {
            throw new Error('Ballot does not exist');
        }

        const parseDate = (value?: string | Date) => {
            if (value === undefined || value === null || value === '') {
                return undefined;
            }
            const parsed = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                throw new TypeError('Invalid date value');
            }
            return parsed;
        };

        const providedStart = parseDate(newStartDate);
        const providedEnd = parseDate(newEndDate);

        const effectiveStartDate = providedStart ?? new Date(ballot.startDate);
        const newEndDateObj = providedEnd ?? new Date(ballot.endDate);

        if (effectiveStartDate >= newEndDateObj) {
            throw new RangeError('Start date must be before end date');
        }

        await db.changeBallotDates(ballotIDNum, effectiveStartDate, newEndDateObj);

        return res.status(200).json({ message: 'Ballot dates updated successfully' });
    } catch (error: any) {
        console.log('Error updating ballot end date:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error.message === 'Ballot does not exist') {
            return res.status(404).json({ error: 'Ballot does not exist' });
        } else if (error instanceof RangeError || error instanceof TypeError || error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to update ballot end date' });
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

router.put('/editCandidate', async (req, res): Promise<any> => {
    try {
        const { candidateID, fName, lName, titles, description, picture } = req.body;

        if (!candidateID) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        const candidateIDNum = Number(candidateID);
        if (isNaN(candidateIDNum) || candidateIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Candidate ID' });
        }

        const candidate = await db.getCandidate(candidateIDNum);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate does not exist' });
        }

        const updatedCandidate = {
            candidateID: candidateIDNum,
            fName: fName ?? candidate.fName,
            lName: lName ?? candidate.lName,
            titles: titles ?? candidate.titles,
            description: description ?? candidate.description,
            picture: picture ?? candidate.picture,
        };

        await db.updateCandidate(candidateIDNum, updatedCandidate);

        return res.status(200).json({ message: 'Candidate updated successfully' });
    } catch (error) {
        console.error('Error updating candidate:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to update candidate' });
    }
});

router.get('/getCandidate', async (req, res): Promise<any> => {
    try {
        const { candidateID } = req.query;

        if (!candidateID) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        const candidateIDNum = Number(candidateID);
        if (isNaN(candidateIDNum) || candidateIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Candidate ID' });
        }

        const candidate = await db.getCandidate(candidateIDNum);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate does not exist' });
        }

        return res.status(200).json(candidate);
    } catch (error) {
        console.error('Error retrieving candidate:', error);
        return res.status(500).json({ error: 'Failed to retrieve candidate' });
    }
});

export default router;