import { z } from 'zod';

export const CandidateSchema = z.object({
    candidateID: z.number(),
    candidateName: z.string(),
    description: z.string(),
    ballotID: z.number(),
});
export type Candidate = z.infer<typeof CandidateSchema>;