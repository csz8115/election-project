import express from 'express';
import { createSession } from '../utils/session.ts';
import db from '../utils/db.ts';
import bcrypt from 'bcrypt';
import { User } from '../types/user.ts';
import { Company } from '../types/company.ts';


const router = express.Router();

// User login route
router.post('/login', async (req, res): Promise<any> => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const data = await db.checkUsername(username);

    if (data === null) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if the password is correct using the bcrypt compare function
    const isValid = await bcrypt.compare(password, data.password);

    if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
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

    return res.status(200).json({ message: 'Login successful', data});
});

// User logout route
router.post('/logout', async (req, res): Promise<any> => {
    try {
        // Clear the session cookie
        res.clearCookie('user_session', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({ error: 'Failed to logout properly' });
    }
});

// User register route
router.post('/register', async (req, res): Promise<any> => {
    const { accountType,
        username,
        fName,
        lName,
        password,
        companyID,
     } = req.body;

    if (!username || !password || !fName || !lName || !companyID || !accountType) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const user = await db.getUserByUsername(username);

    if (user) {
        return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
        accountType,
        username,
        fName,
        lName,
        password: hashedPassword,
        companyID,
    };

    const status = await db.createUser(newUser);

    if (!status) {
        return res.status(500).json({ error: 'Failed to create user' });
    }

    return res.status(201).json({ message: 'User created', status });
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

router.get(`/getEmployeeCompany`, async (req, res): Promise<any> => {
    const { userID } = (req.query);

    if (!userID) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const company = await db.getEmployeeCompany(Number(userID));

    if (!company) {
        return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(company);
});

// Get ballot route
router.get('/tallyBallot', async (req, res): Promise<any> => {
    try {
        const { ballotID } = req.query;

        if (!ballotID) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const ballot = await db.tallyBallot(Number(ballotID));

        if (!ballot) {
            return res.status(404).json({ error: 'Ballot not found' });
        }

        return res.status(200).json(ballot);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get ballot' });
    }
});

export default router;