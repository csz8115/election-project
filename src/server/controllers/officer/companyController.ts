import express from 'express';
import { z } from 'zod';
import { requireRole } from '../../middlewares/requireRole.ts';
import { officerService } from '../../services/officer/officerService.ts';

const router = express.Router();
const { db } = officerService;

const ID_SCHEMA = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Ballot ID must be a positive number'
});
router.get('/getCompanyUsers', requireRole('Officer', 'Employee', 'Admin'), async (req, res): Promise<any> => {
    try {
        const { companyID } = req.query;

        if (!companyID) {
            return res.status(400).json({ error: 'Company ID is required' });
        }
        // Validate the companyID using Zod
        ID_SCHEMA.parse(companyID);
        const users = await db.getUsersByCompany(Number(companyID));

        return res.status(200).json(users);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            console.log(error.errors);
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // if companyId is not provided
        if (error instanceof TypeError) {
            return res.status(400).json({ error: 'Company ID is required' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get(`/getCompanyStats`, requireRole('Officer', 'Employee', 'Admin'), async (req, res): Promise<any> => {
    try {
        const { companyID } = req.query;
        if (!companyID) {
            throw new Error('Invalid request');
        }
        // Validate companyID
        const companyIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Company ID must be a positive number'
        });
        companyIDSchema.parse(companyID);
        const stats = await db.getCompanyStats(Number(companyID));
        if (!stats) {
            throw new Error('Stats not found');
        }
        return res.status(200).json(stats);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle stats not found error
        else if (error.message === 'Stats not found') {
            return res.status(404).json({ error: 'Stats not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get stats' });
    }
})

export default router;
