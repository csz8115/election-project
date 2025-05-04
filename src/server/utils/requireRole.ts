import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = res.locals.accountType;

    if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({ error: 'Access denied: insufficient role' });
        return
    }

    next();
  };
}