import express from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { employeeCandidateService } from '../../services/employee/candidateService.ts';
import {
    BallotNotFoundError,
    BallotStructureLockedError,
    assertBallotEditableByBallotID,
    assertBallotEditableByCandidateID,
    assertBallotEditableByPositionID,
} from '../../utils/ballotEditGuard.ts';

const router = express.Router();
const { db } = employeeCandidateService;
router.put('/editCandidate', async (req, res): Promise<any> => {
    try {
        const { candidateID, fName, lName, titles, description, picture } = req.body;

        if (!candidateID) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        const candidateIDNum = Number(candidateID);
        if (isNaN(candidateIDNum) || candidateIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Candidate ID' });
        }

        const candidate = await db.getCandidate(candidateIDNum);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate does not exist' });
        }

        await assertBallotEditableByCandidateID(db, candidateIDNum);

        const updatedCandidate = {
            candidateID: candidateIDNum,
            fName: fName ?? candidate.fName,
            lName: lName ?? candidate.lName,
            titles: titles ?? candidate.titles,
            description: description ?? candidate.description,
            picture: picture ?? candidate.picture,
        };

        await db.updateCandidate(candidateIDNum, updatedCandidate);

        return res.status(200).json({ message: 'Candidate updated successfully' });
    } catch (error) {
        console.error('Error updating candidate:', error);
        if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to update candidate' });
    }
});

router.get('/getCandidate', async (req, res): Promise<any> => {
    try {
        const { candidateID } = req.query;

        if (!candidateID) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        const candidateIDNum = Number(candidateID);
        if (isNaN(candidateIDNum) || candidateIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Candidate ID' });
        }

        const candidate = await db.getCandidate(candidateIDNum);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate does not exist' });
        }

        return res.status(200).json(candidate);
    } catch (error) {
        console.error('Error retrieving candidate:', error);
        return res.status(500).json({ error: 'Failed to retrieve candidate' });
    }
});

router.post(`/addCandidate`, async (req, res): Promise<any> => {
    try {
        const { positionID, fName, lName, titles, description, picture } = req.body;

        if (!positionID || !fName || !lName) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        const positionIDNum = Number(positionID);
        if (isNaN(positionIDNum) || positionIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Position ID' });
        }

        const candidateSchema = z.object({
            positionID: z.number().int().positive(),
            fName: z.string().trim().min(1, 'First name is required').max(100),
            lName: z.string().trim().min(1, 'Last name is required').max(100),
            titles: z.string().trim().max(255).optional().default(''),
            description: z.string().trim().max(2000).optional().default(''),
            picture: z.string().trim().max(2048).optional().default(''),
        });

        const candidateData = candidateSchema.parse({
            positionID: positionIDNum,
            fName,
            lName,
            titles,
            description,
            picture,
        });

        await assertBallotEditableByPositionID(db, positionIDNum);

        const createdCandidate = await db.addCandidate(candidateData);

        return res.status(201).json({
            message: 'Candidate added successfully',
            candidateID: createdCandidate.candidateID,
        });

    } catch (error: any) {
        console.error('Error adding candidate:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        } else if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to add candidate' });
    }
});

router.delete(`/deleteCandidate`, async (req, res): Promise<any> => {
    try {
        const { candidateID } = req.query;

        if (!candidateID) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        const candidateIDNum = Number(candidateID);
        if (isNaN(candidateIDNum) || candidateIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Candidate ID' });
        }

        await assertBallotEditableByCandidateID(db, candidateIDNum);

        await db.deleteCandidate(candidateIDNum);
        return res.status(200).json({ message: 'Candidate deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting candidate:', error);
        if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to delete candidate' });
    }
});

router.delete(`/deletePosition`, async (req, res): Promise<any> => {
    try {
        const { positionID } = req.query;

        if (!positionID) {
            return res.status(400).json({ error: 'Position ID is required' });
        }

        const positionIDNum = Number(positionID);
        if (isNaN(positionIDNum) || positionIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Position ID' });
        }

        await assertBallotEditableByPositionID(db, positionIDNum);

        await db.deleteBallotPosition(positionIDNum);
        return res.status(200).json({ message: 'Position deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting position:', error);
        if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: error.code, details: error.meta ?? error.message });
        }
        return res.status(500).json({ error: 'Failed to delete position' });
    }
});


router.post(`/addPosition`, async (req, res): Promise<any> => {
    try {
        const { positionName, allowedVotes, writeIn, ballotID } = req.body;

        if (!positionName || !ballotID) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const ballotIDNum = Number(ballotID);
        if (isNaN(ballotIDNum) || ballotIDNum <= 0) {
            return res.status(400).json({ error: 'Invalid Ballot ID' });
        }

        const positionData = {
            positionName,
            allowedVotes: allowedVotes !== undefined ? Number(allowedVotes) : undefined,
            writeIn: writeIn === true,
            ballotID: ballotIDNum,
        };

        const requiredFields: (keyof typeof positionData)[] = ['positionName', 'ballotID'];
        const missingFields = requiredFields.filter((field) => {
            const value = positionData[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
        }

        await assertBallotEditableByBallotID(db, ballotIDNum);

        const createdPosition = await db.addPosition(positionData);

        return res.status(201).json({
            message: 'Position added successfully',
            positionID: createdPosition.positionID,
        });

    } catch (error: any) {
        console.error('Error adding position:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        } else if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        } else if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        } else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        return res.status(500).json({ error: 'Failed to add position' });
    }
});

router.post(`/addInitiative`, async (req, res): Promise<any> => {
    try {
        const { ballotID, initiativeName, description, responses } = req.body;

        const ballotIDNum = Number(ballotID);
        if (!Number.isFinite(ballotIDNum) || ballotIDNum <= 0 || !initiativeName) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const initiativeSchema = z.object({
            ballotID: z.number().int().positive(),
            initiativeName: z.string().trim().min(1, 'Initiative name is required').max(255),
            description: z.string().trim().max(2000).optional().default(''),
            responses: z
                .array(
                    z.object({
                        response: z.string().trim().min(1, 'Response text is required').max(255),
                    }),
                )
                .min(1, 'At least one response is required'),
        });

        const initiativeData = initiativeSchema.parse({
            ballotID: ballotIDNum,
            initiativeName,
            description,
            responses,
        });

        const ballot = await db.getBallot(ballotIDNum);
        if (!ballot) {
            return res.status(404).json({ error: 'Ballot does not exist' });
        }

        await assertBallotEditableByBallotID(db, ballotIDNum);

        const createdInitiative = await db.createInitiative({
            ballotID: initiativeData.ballotID,
            initiativeID: 0,
            initiativeName: initiativeData.initiativeName,
            description: initiativeData.description,
            picture: '',
            responses: initiativeData.responses.map((item) => ({
                responseID: 0,
                response: item.response,
                votes: 0,
            })),
        });

        return res.status(201).json({
            message: 'Initiative added successfully',
            initiativeID: createdInitiative?.initiativeID,
        });
    } catch (error: any) {
        console.error('Error adding initiative:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map((e) => e.message) });
        }
        if (error instanceof BallotNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof BallotStructureLockedError) {
            return res.status(403).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to add initiative' });
    }
});

export default router;
