import express from 'express';
import { createSession } from '../utils/session.ts';
import db from '../utils/db.ts';
import { decrypt } from '../utils/session.ts';
import bcrypt from 'bcrypt';
import { Ballot, BallotSchema } from '../types/ballot.ts';
import { z } from 'zod';
import { getRedisClient } from '../utils/redis.ts';

const router = express.Router();

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
// username validation
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
        const existingSession = await req.cookies.user_session;
        if (existingSession) {
            const decryptedSession = await decrypt(existingSession);
            if (decryptedSession) {
                throw new Error('User already logged in');
            }
        }
        const data = await db.checkUsername(username);

        if (data === null) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check if the password is correct using the bcrypt compare function
        const isValid = await bcrypt.compare(password, data.password);

        if (!isValid) {
            throw new Error('Invalid password');
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
        delete data.password;
        // Return the success message
        return res.status(200).json({ message: 'Login successful', data });
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            console.log(error.errors);
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
        // Handle other errors
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

router.get(`/getEmployeeCompany`, async (req, res): Promise<any> => {
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

        const company = await db.getEmployeeCompany(Number(userID));

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

// Get ballot route
router.get('/tallyBallot', async (req, res): Promise<any> => {
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

router.get(`/getBallot`, async (req, res): Promise<any> => {
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

        const ballot = await db.getBallot(Number(ballotID));

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
})

router.get(`/getActiveUserBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getActiveUserBallots(Number(userID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'No active ballots found for this user') {
            return res.status(404).json({ error: 'No active ballots found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});

router.get(`/getInactiveUserBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getInactiveUserBallots(Number(userID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'No active ballots found for this user') {
            return res.status(404).json({ error: 'No active ballots found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});

router.get(`/getUserBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getUserBallots(Number(userID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'No active ballots found for this user') {
            return res.status(404).json({ error: 'No active ballots found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});



// Submit ballot route
router.post(`/submitBallot`, async (req, res): Promise<any> => {
    try {
        const { ballot } = req.body as { ballot: Ballot };

        if (!ballot) {
            throw new Error('Invalid request');
        }

        // Validate the ballot data
        BallotSchema.parse(ballot);

        // Check if the ballot exists
        const existingBallot = await db.getBallot(ballot.ballotID);
        if (!existingBallot) {
            throw new Error('Ballot not found');
        }

        // Check if the ballot is active
        const currentDate = new Date();
        const startDate = new Date(existingBallot.startDate);
        const endDate = new Date(existingBallot.endDate);
        if (currentDate < startDate || currentDate > endDate) {
            throw new Error('Ballot is not active');
        }

        // Check if the user exixts and is part of the company
        const user = await db.getUser(ballot.userID);
        if (!user) {
            throw new Error('User not found');
        }
        const company = await db.getEmployeeCompany(ballot.userID);
        if (!company) {
            throw new Error('Company not found');
        }
        if (company.companyID !== existingBallot.companyID) {
            throw new Error('User is not part of the company');
        }
        // Check if the user has already submitted the ballot
        const didUserSubmit = await db.checkBallotVoter(ballot.ballotID, ballot.userID);

        // Check if the ballot is already submitted
        if (didUserSubmit) {
            throw new Error('Ballot already submitted');
        }

        let votes: any[] = [];
        let responseVotes: any[] = [];
        let candidate;

        for (const position of ballot.positions) {
            // Check if the position exists
            const existingPosition = await db.getBallotPosition(position.positionID);
            if (!existingPosition) {
                throw new Error(`Position ${position.positionID} not found`);
            }
            // Check if the candidate exists if the position is not a write-in
            if (position.candidateID && !position.writeIn) {
                const existingCandidate = await db.getCandidate(position.candidateID);
                if (!existingCandidate) {
                    throw new Error(`Candidate ${position.candidateID} not found`);
                }
            }
            // Check if the write-in name is valid
            if (position.writeIn && (!position.fName || !position.lName)) {
                throw new Error(`Write-in name is required for position ${position.positionID}`);
            }
            // Process the write-in name if provided
            if (position.writeIn) {
                candidate = await db.createWriteInCandidate(position.fName, position.lName);
            }
            // append the vote to the votes array
            votes.push({
                ballotID: ballot.ballotID,
                userID: ballot.userID,
                positionID: position.positionID,
                candidateID: position.candidateID ? position.candidateID : candidate,
            });
            // Check if the ballot is already submitted
        }
        for (const initiative of ballot.initiatives) {
            // Check if the initiative exists
            const existingInitiative = await db.getInitiative(initiative.initiativeID);
            if (!existingInitiative) {
                throw new Error(`Initiative ${initiative.initiativeID} not found`);
            }
            // Check if the response is valid
            if (initiative.responseID) {
                const existingResponse = await db.getResponse(initiative.responseID);
                if (!existingResponse) {
                    throw new Error(`Response ${initiative.responseID} not found`);
                }
            }
            // append the response to the responseVotes array
            responseVotes.push({
                ballotID: ballot.ballotID,
                userID: ballot.userID,
                initiativeID: initiative.initiativeID,
                responseID: initiative.responseID,
            });
        }
        // Submit the ballot
        const submittedBallot = await db.submitBallot(votes, responseVotes);
        if (!submittedBallot) {
            throw new Error('Failed to submit ballot');
        }
        // Return the success message
        return res.status(201).json({ message: 'Ballot submitted successfully' });
    } catch (error: any) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to submit ballot' });
    }
});

router.get(`/getCompanyBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getCompanyBallots(Number(companyID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'Ballots not found') {
            return res.status(404).json({ error: 'Ballots not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});

router.get(`/getActiveCompanyBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getActiveCompanyBallots(Number(companyID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'Ballots not found') {
            return res.status(404).json({ error: 'Ballots not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});

router.get(`/getInactiveCompanyBallots`, async (req, res): Promise<any> => {
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
        const ballots = await db.getInactiveCompanyBallots(Number(companyID));
        if (!ballots) {
            throw new Error('Ballots not found');
        }
        return res.status(200).json(ballots);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle ballots not found error
        else if (error.message === 'Ballots not found') {
            return res.status(404).json({ error: 'Ballots not found' });
        }
        // Handle other errors
        return res.status(500).json({ error: 'Failed to get ballots' });
    }
});

router.get(`/ping`, async (req, res): Promise<any> => {
    try {
        const { username } = req.query;
        const expSeconds = 120;
        if (!username) {
            throw new Error('Invalid request');
        }
        // Validate username
        const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
        usernameSchema.parse(username);
        const user = await db.getUserByUsername(username as string);
        if (!user) {
            throw new Error('User not found');
        }
        // ping
        console.log('Pinging user:', username);
        getRedisClient().set(`active:${username}`, Date.now().toString(), {EX: expSeconds});
        // return the success message
        return res.status(200).json({ message: 'Ping successful' });
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
        return res.status(500).json({ error: 'Failed to ping' });
    }
});

router.get(`/getUserByUsername`, async (req, res): Promise<any> => {
    try {
        const { username } = req.query;
        if (!username) {
            throw new Error('Invalid request');
        }
        // Validate username
        const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
        usernameSchema.parse(username);
        const user = await db.getUserByUsername(username as string);
        if (!user) {
            throw new Error('User not found');
        }
        // return the user
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

export default router;