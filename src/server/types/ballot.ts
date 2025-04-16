import { z } from 'zod';

export const BallotSchema = z.object({
    ballotID: z.number(),
    userID: z.number(),
    ballotName: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    companyID: z.number(),
    positions: z.array(z.object({
        positionID: z.number(),
        positionName: z.string(),
        allowedVotes: z.number(),
        writeIn: z.boolean(),
        candidateID: z.number().optional(),
        fName : z.string().optional(),
        lName : z.string().optional(),
    })),
    initiatives: z.array(z.object({
        initiativeID: z.number(),
        initiativeName: z.string(),
        description: z.string(),
        picture: z.string().optional(),
        responseID: z.number().optional(),
    })),
});

export type Ballot = z.infer<typeof BallotSchema>;