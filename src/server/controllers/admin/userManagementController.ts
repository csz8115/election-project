import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { User } from '../../types/user.ts';
import logger from '../../utils/logger.ts';
import { requireRole } from '../../middlewares/requireRole.ts';
import { adminUserService } from '../../services/admin/adminUserService.ts';

const router = express.Router();
const { db } = adminUserService;

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
const accountTypeSchema = z.enum(['Admin', 'Member', 'Officer', 'Employee']);
const fNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);
const lNameSchema = z.string().min(1).max(50).regex(/^[a-zA-Z]+$/);
router.post('/createUser', async (req, res): Promise<any> => {
    try {
        const {
            username,
            fName,
            lName,
            password,
            companyID,
            accountType
        } = req.body;
        if (!username || !password || !fName || !lName || !companyID || !accountType) {
            logger.error('Invalid request data:', { body: req.body });
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

router.get(`/getAllUsers`, requireRole('Admin'), async (req, res): Promise<any> => {
    try {

        const users = await db.getAllUsers();

        if (!users) {
            throw new Error('Users not found');
        }

        return res.status(200).json(users);
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
        else if (error.message === 'Users not found') {
            return res.status(404).json({ error: 'Users not found' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to get users' });
    }
});

router.delete('/deleteUser', requireRole('Admin'), async (req, res): Promise<any> => {
    try {
        const { username } = req.body;
        if (!username) {
            throw new Error('Invalid request');
        }
        // Validate the input data
        usernameSchema.parse(username);
        // Check if the user exists
        const existingUser = await db.checkUsername(username);
        if (!existingUser) {
            throw new Error('User does not exist');
        }
        // Delete the user
        const status = await db.deleteUser(username);
        if (!status) {
            throw new Error('Failed to delete user');
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle user does not exist error
        else if (error.message === 'User does not exist') {
            return res.status(404).json({ error: 'User does not exist' });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
