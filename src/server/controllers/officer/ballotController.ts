import express from 'express';
import { z } from 'zod';
import { requireRole } from '../../middlewares/requireRole.ts';
import { officerService } from '../../services/officer/officerService.ts';

const router = express.Router();
const { db } = officerService;

const ID_SCHEMA = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Ballot ID must be a positive number'
});
router.get(`/getBallotStatus`, requireRole('Officer', 'Employee', 'Admin'), async (req, res): Promise<any> => {
    try {
        const { ballotID } = req.query;
        if (!ballotID) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }
        // Validate the ballotID using Zod
        ID_SCHEMA.parse(ballotID);
        const ballotStatus = await db.getBallotStatus(Number(ballotID));
        if (!ballotStatus) {
            return res.status(404).json({ error: 'Ballot not found' });
        }
        return res.status(200).json(ballotStatus);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            console.log(error.errors);
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // if ballotId is not provided
        if (error instanceof TypeError) {
            return res.status(400).json({ error: 'Ballot ID is required' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get ballot route
router.get('/viewBallotResults', requireRole('Officer', 'Employee', 'Admin', 'Member'), async (req, res): Promise<any> => {
    try {
        const { ballotID } = req.query;

        if (!ballotID) {
            throw new Error('Invalid request');
        }

        // Validate ballotID
        const ballotIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Ballot ID must be a positive number'
        });
        ballotIDSchema.parse(ballotID);

        const ballot = await db.tallyBallot(Number(ballotID));

        if (!ballot) {
            throw new Error('Ballot not found');
        }

        return res.status(200).json(ballot);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballot not found error
        else if (error.message === 'Ballot not found') {
            return res.status(404).json({ error: 'Ballot not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballot' });
    }
});


export default router;
