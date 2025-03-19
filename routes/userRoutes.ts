import express from 'express';
import { SignJWT, jwtVerify } from "jose";
import db from '../utils/db.ts'


const router = express.Router();

// User login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Invalid request' });
    }

    const isValid = await db.checkUsername(username, password);

    if (!isValid) {
        res.status(401).json({ error: 'Invalid username or password' });
    }
    res.status(200).json({ message: 'Login successful' });
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