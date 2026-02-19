import { createSession } from '../../utils/session.ts';
import { db } from '../dbService.ts';

export const userAuthService = {
  createSession,
  db,
};
