import express from 'express';
import { createSession, encrypt, decrypt } from '../../../utils/session.ts';
import db from '../../../utils/db.ts'


const router = express.Router();

// User login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    const data = await db.checkUsername(username, password);

    if (data === null) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
    }

    // Create a session
    const session = await createSession(username, data.accountType);

    // Set the cookie settings based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set the session as a cookie
    res.cookie("user_session", session, {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: isProduction, // Only require HTTPS in production
        httpOnly: true,
        sameSite: isProduction ? "lax" : "strict", // Using strict for non-production instead of none
        path: "/", // Set the cookie for all routes
    });

    // Set the username and account type in the response

    res.status(200).json({ message: 'Login successful', data});
});

// User logout route
router.post('/logout', async (req, res) => {
    try {
        // Clear the session cookie
        res.clearCookie('user_session', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Failed to logout properly' });
    }
});

// User register route
router.post('/register', async (req, res) => {
    const { accountType,
        username,
        fName,
        mName,
        lName,
        password,
        companyID,
     } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Invalid request' });
    }

    const user = await db.getUserByUsername(username);

    if (user) {
        res.status(409).json({ error: 'Username already exists' });
    }

    const status = await db.createUser(accountType, username, fName, mName, lName, password, companyID);

    if (!status) {
        res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({ message: 'User created' });
});

// Get user route
router.get('/getUser', async (req, res): Promise<any> => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const user = await db.getUserByUsername(username as string);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
});

export default router;