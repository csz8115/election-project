import { z } from 'zod';

export const ResponseSchema = z.object({
    voteID: z.number().min(1),
    userID: z.number().min(1),
    initiativeID: z.number().min(1),
    ballotID: z.number().min(1),
    responseID: z.number().min(1),
});

export type ResponseVote = z.infer<typeof ResponseSchema>;