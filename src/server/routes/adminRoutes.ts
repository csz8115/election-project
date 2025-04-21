import db from '../utils/db.ts';
import express from 'express';
import { z } from 'zod';
import { User } from '../types/user.ts';
import { getRedisClient } from '../utils/redis.ts';
import bcrypt from 'bcrypt';

const router = express.Router();

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
// username validation
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
// companyID validation
const companyIDSchema = z.number().int().positive();
// accountType validation
const accountTypeSchema = z.enum(['admin', 'member']);
// fName validation
const fNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);
// lName validation
const lNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);

// User register route
router.post('/register', async (req, res): Promise<any> => {
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
        companyIDSchema.parse(companyID);
        accountTypeSchema.parse(accountType);
        fNameSchema.parse(fName);
        lNameSchema.parse(lName);
        // Check if the username already exists
        const existingUser = await db.checkUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }
        // Check if the company exists
        const company = await db.getCompany(companyID);
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

router.get(`/getCompanyStats`, async (req, res): Promise<any> => {
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

router.get(`/getSystemStats`, async (req, res): Promise<any> => {
    try {
        const keys = await getRedisClient().get('user:*');
        if (!keys) {
            throw new Error('Invalid request');
        }
        // Validate keys
        const keysSchema = z.array(z.string().regex(/^user:\d+$/));
        keysSchema.parse(keys);
        // turn the keys into an array
        const keysArray = keys.split(',');
        return res.status(200).json({ keys: keysArray });
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
});

export default router;