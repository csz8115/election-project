import { z } from 'zod';

export const BallotInitiativeSchema = z.object({
    ballotID: z.number(),
    initiativeID: z.number(),
    initiativeName: z.string(),
    description: z.string(),
    picture: z.string().optional(),
    responses: z.array(z.object({
        responseID: z.number(),
        response: z.string(),
        votes: z.number(),
    })),
});

export type BallotInitiatives = z.infer<typeof BallotInitiativeSchema>;