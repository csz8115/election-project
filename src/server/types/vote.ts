import { z } from 'zod';

export const VoteSchema = z.object({
    positionID: z.number().min(1),
    userID: z.number().min(1),
    ballotID: z.number().min(1),
    candidateID: z.number().min(1),
});

export type Vote = z.infer<typeof VoteSchema>;