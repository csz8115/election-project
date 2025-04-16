import { z } from 'zod';


export const BallotPositionsSchema = z.object({
    ballotID: z.number(),
    positionID: z.number(),
    positionName: z.string(),
    allowedVotes: z.number(),
    writeIn: z.boolean(),
    candidates: z.array(z.object({
        candidateID: z.number(),
        fName: z.string(),
        lName: z.string(),
        titles: z.string(),
        description: z.string(),
        picture: z.string().optional(),
    })),
});

export type BallotPositions = z.infer<typeof BallotPositionsSchema>;