import { SignJWT, jwtVerify } from "jose";

export interface Session {
    username: string;
    accountType: string;
    expiresAt: Date;
}

const secretKey = process.env.JWT_SECRET || "09544eb430e6c53715a890991033837cc4fe603b8c7588741cee9b1bf31ccb7dc9df481ee4dcf2a56de38d0fbeaa1581e8fbfe18b0202d4ac4a621f001cd918e";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(username: string, accountType: string) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day
    const session = await encrypt(username, accountType, expiresAt);

    return session;
}

export async function encrypt(username: string, accountType: string, expiresAt: Date): Promise<string> {
    const jwt = new SignJWT({ username, accountType, expiresAt })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(encodedKey);

    return jwt;
}

export async function decrypt(jwt: string): Promise<any> {
    const { payload} = await jwtVerify(jwt, encodedKey, { algorithms: ["HS256"] });
    
    return payload;
}

export default { createSession, encrypt, decrypt };