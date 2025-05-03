import db from '../utils/db.ts';
import express from 'express';
import { z } from 'zod';
import { User } from '../types/user.ts';
import { getRedisClient } from '../utils/redis.ts';
import { getHttpStats } from '../utils/systemStats.ts';
import { BallotPositions, BallotPositionsSchema } from '../types/ballotPositions.ts';
import { BallotInitiatives, BallotInitiativeSchema } from '../types/ballotInitiatives.ts';
import bcrypt from 'bcrypt';
import { BallotSchema } from '../types/ballot.ts';

const router = express.Router();

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[\W_]/);
// username validation
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
// accountType validation
const accountTypeSchema = z.enum(['Admin', 'Member']);
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
        const keys = await getRedisClient().keys('*active:*');
        const activeUsers = keys.length;
        const activeElections = await db.getActiveBallots();
        const inactiveElections = await db.getInactiveBallots();

        const activeElectionsCount = activeElections.length;
        const inactiveElectionsCount = inactiveElections.length;

        const queryStats = await db.getQueryStats();
        // Extract the stats object from the array
        const systemStats = queryStats[0];

        // Convert BigInt to Number for JSON serialization
        const totalQueries = Number(systemStats.total_queries);

        // Get http stats
        const httpStats = await getHttpStats();

        // Construct the response object with all system stats
        const stats = {
            activeUsers,
            activeElectionsCount,
            inactiveElectionsCount,
            queryStats: {
            totalQueries,
            totalCalls: Number(systemStats.total_calls),
            totalExecTimeMs: Number(systemStats.total_exec_time_ms.toFixed(2)),
            avgQueryTimeMs: Number(systemStats.avg_query_time_ms.toFixed(2)),
            maxAvgQueryTimeMs: Number(systemStats.max_avg_query_time_ms.toFixed(2))
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
});


// Create ballot route
router.post('/createBallot', async (req, res): Promise<any> => {
    try {
      const { ballotName, description, startDate, endDate, companyID, positions, initiatives } = req.body;
  
      // Validate required fields
      if (!ballotName || !description || !startDate || !endDate || !companyID || !positions) {
        throw new Error('Invalid request');
      }
    
      // Check company exists
      const company = await db.getCompany(Number(companyID));
      if (!company) {
        throw new Error('Company does not exist');
      }
  
      // Prepare data for Prisma
      const ballotPositions = positions.map((position: any) => ({
        positionName: position.positionName,
        allowedVotes: position.allowedVotes,
        writeIn: position.writeIn,
        candidates: position.candidates.map((candidate: any) => ({
          fName: candidate.fName,
          lName: candidate.lName,
          titles: candidate.titles ?? '',
          description: candidate.description ?? '',
          picture: candidate.picture ?? '',
        })),
      }));
  
      const ballotInitiatives = initiatives.map((initiative: any) => ({
        initiativeName: initiative.initiativeName,
        description: initiative.description ?? '',
        picture: initiative.picture ?? '',
        responses: initiative.responses.map((response: any) => ({
          response: response.response,
          votes: 0, // You might initialize votes to 0
        })),
      }));
  
      const ballot = {
        ballotName,
        description,
        startDate,
        endDate,
        companyID: Number(companyID),
        positions: ballotPositions,
        initiatives: ballotInitiatives,
      };
  
      // Create the ballot in DB
      await db.createBallot(ballot, ballotPositions, ballotInitiatives);
  
      return res.status(201).json({ message: 'Ballot created successfully' });
  
    } catch (error: any) {
      console.log('Error creating ballot:', error);
  
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors.map(e => e.message) });
      } else if (error.message === 'Company does not exist') {
        return res.status(404).json({ error: 'Company does not exist' });
      } else if (error.message === 'Invalid request') {
        return res.status(400).json({ error: 'Invalid request' });
      }
      return res.status(500).json({ error: 'Failed to create ballot' });
    }
  });


// Update ballot route
router.put('/updateBallot/:ballotID', async (req, res): Promise<any> => {

    console.log('Update ballot route called');
    try {
        const { ballotID } = req.params;
        const { ballotName, description, startDate, endDate, companyID, positions, initiatives } = req.body;

        // Validate required fields
        if (!ballotID || !ballotName || !description || !startDate || !endDate || !companyID || !positions) {
            throw new Error('Invalid request');
        }

        // Check if the ballot exists
        const existingBallot = await db.getBallot(Number(ballotID));
        if (!existingBallot) {
            throw new Error('Ballot does not exist');
        }

        // Check if the company exists
        const company = await db.getCompany(Number(companyID));
        if (!company) {
            throw new Error('Company does not exist');
        }

        // Check for candidates to remove
        const originalPositions = existingBallot.positions;


        // Check for candidates to remove
        for (const originalPosition of originalPositions) {
            for (const originalCandidate of originalPosition.candidates) {

            // Check if the candidate still exists in the updated positions
            const candidateStillExists = positions.some((updatedPosition: any) =>
                updatedPosition.candidates.some((updatedCandidate: any) =>
                updatedCandidate.candidateID === originalCandidate.candidateID
                )
            );

            //If the candidate does not exist in the updated positions, remove it from the database
            if (!candidateStillExists) {
                console.log('Removing candidate:', originalCandidate);
                await db.deleteCandidate(originalCandidate.candidateID);
            }}
        }

        // Check if candidates exist for each position
        for (const position of positions) {
            for (const candidate of position.candidates) {
            console.log('Checking candidate:', candidate);
            if (!candidate.candidateID) {
                // Create the candidate if it doesn't exist
                await db.createCandidate(candidate.fName, candidate.lName, candidate.titles ?? '', candidate.description ?? '', candidate.picture ?? '');
            }
            }
        }

        // Prepare data for update
        const updatedPositions = positions.map((position: any) => ({
            positionName: position.positionName,
            allowedVotes: position.allowedVotes,
            writeIn: position.writeIn,
            candidates: position.candidates.map((candidate: any) => ({
                fName: candidate.fName,
                lName: candidate.lName,
                titles: candidate.titles ?? '',
                description: candidate.description ?? '',
                picture: candidate.picture ?? '',
            })),
        }));



        updatedPositions.forEach((position: any) => {
            console.log('Updated candidates for position:', position.positionName, position.candidates);
        });

        const updatedInitiatives = initiatives.map((initiative: any) => ({
            initiativeName: initiative.initiativeName,
            description: initiative.description ?? '',
            picture: initiative.picture ?? '',
            responses: initiative.responses.map((response: any) => ({
                response: response.response,
                votes: response.votes ?? 0,
            })),
        }));

        const updatedBallot = {
            ballotName,
            description,
            startDate,
            endDate,
            companyID: Number(companyID),
            positions: updatedPositions,
            initiatives: updatedInitiatives,
        };

        // Update the ballot in DB
        await db.updateBallot(Number(ballotID), updatedBallot);

        return res.status(200).json({ message: 'Ballot updated successfully' });

    } catch (error: any) {
        console.log('Error updating ballot:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error.message === 'Ballot does not exist') {
            return res.status(404).json({ error: 'Ballot does not exist' });
        } else if (error.message === 'Company does not exist') {
            return res.status(404).json({ error: 'Company does not exist' });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to update ballot' });
    }
});
  

export default router;