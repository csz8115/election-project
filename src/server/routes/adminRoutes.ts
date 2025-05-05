import db from '../utils/db.ts';
import express from 'express';
import { z } from 'zod';
import { User } from '../types/user.ts';
import { getRedisClient } from '../utils/redis.ts';
import { getHttpStats, getDbStats } from '../utils/systemStats.ts';
import { BallotPositions, BallotPositionsSchema } from '../types/ballotPositions.ts';
import { BallotInitiatives, BallotInitiativeSchema } from '../types/ballotInitiatives.ts';
import bcrypt from 'bcrypt';
import { BallotSchema } from '../types/ballot.ts';
import { requireRole } from '../utils/requireRole.ts';


const router = express.Router();

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
// username validation
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
// accountType validation
const accountTypeSchema = z.enum(['Admin', 'Member', 'Officer', 'Employee']);
// fName validation
const fNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);
// lName validation
const lNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);

// User register route
router.post('/createUser', requireRole('Admin'), async (req, res): Promise<any> => {
    try {
        const { accountType,
            username,
            fName,
            lName,
            password,
            companyID,
        } = req.body;
        if (!username || !password || !fName || !lName || !companyID || !accountType) {
            throw new Error('Invalid request');
        }
        // Validate the input data
        usernameSchema.parse(username);
        passwordSchema.parse(password);
        accountTypeSchema.parse(accountType);
        fNameSchema.parse(fName);
        lNameSchema.parse(lName);
        // Check if the username already exists
        const existingUser = await db.checkUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }
        // Check if the company exists
        const company = await db.getCompany(Number(companyID));
        if (!company) {
            throw new Error('Company does not exist');
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create the user
        const newUser: User = await db.createUser({
            accountType,
            username,
            fName,
            lName,
            password: hashedPassword,
            companyID,
        });
        if (!newUser) {
            throw new Error('Failed to create user');
        }
        // return the success message
        return res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle username already exists error
        else if (error.message === 'Username already exists') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        // Handle company does not exist error
        else if (error.message === 'Company does not exist') {
            return res.status(404).json({ error: 'Company does not exist' });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to register user' })
    }
});

router.get(`/getSystemReport`, requireRole('Admin'), async (req, res): Promise<any> => {
    try {
        const keys = await getRedisClient().keys('*active:*');
        const activeUsers = keys.length;
        const activeElections = await db.getActiveBallots();
        const inactiveElections = await db.getInactiveBallots();

        const activeElectionsCount = activeElections.length;
        const inactiveElectionsCount = inactiveElections.length;

        const systemStats = await getDbStats();

        // Get http stats
        const httpStats = await getHttpStats();

        // Construct the response object with all system stats
        const stats = {
            activeUsers,
            activeElectionsCount,
            inactiveElectionsCount,
            queryStats: {
                totalCalls: Number(systemStats.totalQueries),
                totalExecTimeMs: Number(systemStats.totalResponseTime.toFixed(2)),
                avgQueryTimeMs: Number(systemStats.avgResponseTime.toFixed(2)),
                maxQueryTimeMs: Number(systemStats.maxResponseTime.toFixed(2))
            },
            httpStats: {
                totalRequests: httpStats.totalRequests,
                totalErrors: httpStats.totalErrors,
                totalResponseTime: Number(httpStats.totalResponseTime.toFixed(2)),
                avgResponseTime: Number(httpStats.avgResponseTime.toFixed(2)),
                maxResponseTime: Number(httpStats.maxResponseTime.toFixed(2))
            }
        };
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
        console.log(error);
        return res.status(500).json({ error: 'Failed to get stats' });
    }
})

router.get(`/getSocietyReport`, requireRole('Admin'), async (req, res): Promise<any> => {
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
        console.log(error);
        return res.status(500).json({ error: 'Failed to get stats' });
    }
});

router.get(`/getAllCompanies`, requireRole('Admin'), async (req, res): Promise<any> => {
    try {

        // Validate userID
        const userIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'User ID must be a positive number'
        });

        const companies = await db.getCompanies();

        if (!companies) {
            throw new Error('Companies not found');
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
        // Handle companies not found error
        else if (error.message === 'Companies not found') {
            return res.status(404).json({ error: 'Companies not found' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to get companies' });
    }
});



export default router;