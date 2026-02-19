import { db } from '../dbService.ts';
import { getRedisClient } from '../../utils/db/redis.ts';
import logger from '../../utils/logger.ts';

export const userBallotService = {
  db,
  getRedisClient,
  logger,
};
