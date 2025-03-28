import { z } from 'zod';

export const VoteSchema = z.object({
    voteID: z.number().min(1),
    userID: z.number().min(1),
    ballotID: z.number().min(1),
    choiceID: z.number().min(1),
});

export type Vote = z.infer<typeof VoteSchema>;