import { db } from '../dbService.ts';
import { getRedisClient } from '../../utils/db/redis.ts';
import { getHttpStats, getDbStats } from '../../utils/systemStats.ts';

export const adminReportService = {
  db,
  getRedisClient,
  getHttpStats,
  getDbStats,
};
