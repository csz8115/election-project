import { PrismaClient } from '@prisma/client'
import logger from './prisma/dbLogger.ts'

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    errorFormat: 'pretty',
})

prisma.$use(async (params, next) => {
    const start = Date.now()
    const result = await next(params)
    const duration = Date.now() - start
    logger.info({
        query: params,
        duration: `${duration}ms`,
    })
    return result
})

export default prisma