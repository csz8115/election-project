import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.ts';

type LogScalar = string | number;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getFirstScalar = (
  source: Record<string, unknown> | undefined,
  keys: string[],
): LogScalar | undefined => {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
  }

  return undefined;
};

const getContextId = (req: Request, res: Response, keys: string[]): LogScalar | undefined => {
  const reqWithContext = req as Request & {
    user?: unknown;
    auth?: unknown;
    company?: unknown;
  };

  const sources: Array<Record<string, unknown> | undefined> = [
    isObject(res.locals) ? res.locals : undefined,
    isObject(reqWithContext.user) ? reqWithContext.user : undefined,
    isObject(reqWithContext.auth) ? reqWithContext.auth : undefined,
    isObject(reqWithContext.company) ? reqWithContext.company : undefined,
  ];

  for (const source of sources) {
    const value = getFirstScalar(source, keys);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1_000_000));
    const userID = getContextId(req, res, ['userID', 'userId', 'id']);
    const companyID = getContextId(req, res, ['companyID', 'companyId']);

    const requestLog: {
      method: string;
      url: string;
      statusCode: number;
      durationMs: number;
      userID?: LogScalar;
      companyID?: LogScalar;
    } = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    };

    if (userID !== undefined) {
      requestLog.userID = userID;
    }

    if (companyID !== undefined) {
      requestLog.companyID = companyID;
    }

    if (res.statusCode >= 500) {
      logger.error(requestLog, 'HTTP request completed');
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(requestLog, 'HTTP request completed');
      return;
    }

    logger.info(requestLog, 'HTTP request completed');
  });

  next();
}

export default requestLogger;
