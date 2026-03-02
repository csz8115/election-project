import { PrismaClient } from '@prisma/client'
import logger from '../../../../prisma/dbLogger.ts'

const isTestEnv = process.env.NODE_ENV === 'test';

const prisma = new PrismaClient({
    log: isTestEnv ? [] : ['info', 'warn', 'error'],
    errorFormat: isTestEnv ? 'minimal' : 'pretty',
})

prisma.$extends({
    name: 'dbLogger',
    query: {
        $allOperations: async ({ model, operation, args, query }) => {
            const start = Date.now()
            const result = await query(args)
            const duration = Date.now() - start
            if (!isTestEnv) {
                logger.info({
                    message: `Query ${model}.${operation} took ${duration}ms`,
                    model,
                    operation,
                    args,
                })
            }
            return result
        }
    }
})

export default prisma
