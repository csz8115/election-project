import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { requireRole } from '../../middlewares/requireRole.ts';
import logger from '../../utils/logger.ts';
import { userAuthService } from '../../services/user/authService.ts';

const router = express.Router();
const { db, createSession } = userAuthService;

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
// User login route
router.post('/login', async (req, res): Promise<any> => {
    try {
        const { username, password } = req.body;
        // throw an error if the username or password is not provided
        if (!username || !password) {
            throw new Error('Invalid request');
        }

        // Validate the input data
        usernameSchema.parse(username);
        passwordSchema.parse(password);

        // Check if the user has a session and if the session is valid
        // const existingSession = await req.cookies.user_session;
        // logger.info('Existing session:', existingSession);
        // if (existingSession) {
        //     const decryptedSession = await decrypt(existingSession);
        //     if (decryptedSession) {
        //         throw new Error('User already logged in');
        //     }
        // }
        console.log("Attempting login for username:", username);
        const user = await db.getUserByUsername(username);
        console.log(user);
        if (!user) {
            throw new Error('Invalid username or password');
        }

        // Check if the password is correct using the bcrypt compare function
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Create a session
        const session = await createSession(username, user.accountType);

        // Set the cookie settings based on environment
        const isProduction = process.env.NODE_ENV === 'production';

        // Set the session as a cookie
        res.cookie("user_session", session, {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            secure: false, // Only require HTTPS in production
            httpOnly: true,
            sameSite: "lax", // Using strict for non-production instead of none
            path: "/", // Set the cookie for all routes
        });
        delete user.password;
        // Return the success message
        return res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        logger.error(error);
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle user already logged in error
        else if (error.message === 'User already logged in') {
            return res.status(401).json({ error: 'User already logged in' });
        }
        // Handle invalid password error
        else if (error.message === 'Invalid password') {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // Handle invalid username error
        else if (error.message === 'Invalid username or password') {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        return res.status(500).json({ error: 'Failed to login' });
    }
});

// User logout route
router.post('/logout', async (req, res): Promise<any> => {
    try {
        // Check if the user has a session
        const session = await req.cookies.user_session;
        if (!session) {
            throw new Error('User not logged in');
        }
        // Clear the session cookie
        res.clearCookie('user_session', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        // Handle user not logged in error
        if (error.message === 'User not logged in') {
            return res.status(401).json({ error: 'User not logged in' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to logout' });
    }
});

// Get user route
router.get('/getUser', async (req, res): Promise<any> => {
    try {
        const { username } = req.query;

        if (!username) {
            throw new Error('Invalid request');
        }

        // Validate the username
        usernameSchema.parse(username);

        const user = await db.getUserByUsername(username as string);

        if (!user) {
            throw new Error('User not found');
        }

        return res.status(200).json(user);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle user not found error
        else if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get user' });
    }
});

router.get(`/getEmployeeCompany`, requireRole('Admin', 'Member', 'Officer', 'Employee'), async (req, res): Promise<any> => {
    try {
        const { userID } = req.query;

        if (!userID) {
            throw new Error('Invalid request');
        }

        // Validate userID
        const userIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'User ID must be a positive number'
        });
        userIDSchema.parse(userID);

        const company = await db.getEmpAssignedCompanies(Number(userID));

        if (!company) {
            throw new Error('User not found');
        }

        return res.status(200).json(company);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle user not found error
        else if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get company information' });
    }
});

export default router;
