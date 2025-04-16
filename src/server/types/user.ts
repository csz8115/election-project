import { z } from 'zod';

export const UserSchema = z.object({
    userID: z.number(),
    accountType: z.enum(["Member", "Admin", "Moderator"]),
    username: z.string().min(4).max(30),
    fName: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/, "First name must contain only letters"),
    lName: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/, "Last name must contain only letters"),
    password: z.string()
        .min(8).max(100)
        .regex(/\d/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
        .optional(),
    companyID: z.number(),
});

export type User = z.infer<typeof UserSchema>;