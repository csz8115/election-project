import { PrismaClient } from '@prisma/client'
import logger from '../../../../prisma/dbLogger.ts'
import { recordQueryStat } from './queryStats.ts';

const isTestEnv = process.env.NODE_ENV === 'test';

const basePrisma = new PrismaClient({
    log: isTestEnv ? [] : ['info', 'warn', 'error'],
    errorFormat: isTestEnv ? 'minimal' : 'pretty',
})

const prisma = basePrisma.$extends({
  name: 'dbLogger',
  query: {
    $allOperations: async ({ model, operation, args, query }) => {
      const start = Date.now();
      try {
        const result = await query(args);
        const durationMs = Date.now() - start;
        recordQueryStat({
          model: model ?? undefined,
          action: operation,
          durationMs,
          success: true,
        });

        if (!isTestEnv) {
          logger.info({
            message: `Query ${model ?? 'raw'}.${operation} took ${durationMs}ms`,
            model: model ?? 'raw',
            operation,
            durationMs,
            success: true,
          });
        }
        return result;
      } catch (error) {
        const durationMs = Date.now() - start;
        recordQueryStat({
          model: model ?? undefined,
          action: operation,
          durationMs,
          success: false,
        });

        if (!isTestEnv) {
          logger.error({
            message: `Query ${model ?? 'raw'}.${operation} failed after ${durationMs}ms`,
            model: model ?? 'raw',
            operation,
            durationMs,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        throw error;
      }
    },
  },
});

export default prisma
