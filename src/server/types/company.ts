import { z } from 'zod';

export const CompanySchema = z.object({
    companyID: z.number(),
    companyName: z.string(),
    abbreviation: z.string(),
    category: z.string(),
});

export type Company = z.infer<typeof CompanySchema>;