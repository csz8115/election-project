import { Request, Response, NextFunction } from 'express';
import { decrypt } from '../utils/session'; // Assuming you have an encryption utility
import logger from './logger';

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userCookie = await decrypt(req.cookies.user_session);
    const userRole = userCookie?.accountType; // Assuming the decrypted cookie contains a 'role' property

    if (!userRole || !allowedRoles.includes(userRole)) {
        logger.warn(`Access denied for user with role: ${userRole}. Required roles: ${allowedRoles.join(', ')}`);
        res.status(403).json({ error: 'Access denied: insufficient role' });
        return
    }

    next();
  };
}