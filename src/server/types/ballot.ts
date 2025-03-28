import { z } from 'zod';

export const BallotSchema = z.object({
    ballotID: z.number(),
    ballotName: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    companyID: z.number(),
});

export type Ballot = z.infer<typeof BallotSchema>;