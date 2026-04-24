import express from 'express';
import { z } from 'zod';
import { requireRole } from '../../middlewares/requireRole.ts';
import { adminReportService } from '../../services/admin/adminReportService.ts';

const router = express.Router();
const { db, getRedisClient, getHttpStats, getDbStats } = adminReportService;
router.get(`/getSystemReport`, requireRole('Admin', 'Employee'), async (req, res): Promise<any> => {
    try {
        const keys = await getRedisClient().keys('*active:*');
        const activeUsers = keys.length;
        const systemOverview = await db.getSystemStats();
        const activeElectionsCount = systemOverview?.active_ballots?.count ?? 0;
        const inactiveElectionsCount = systemOverview?.inactive_ballots?.count ?? 0;

        const systemStats = await getDbStats();

        // Get http stats
        const httpStats = await getHttpStats();

        // Construct the response object with all system stats
        const stats = {
            activeUsers,
            activeElectionsCount,
            inactiveElectionsCount,
            systemOverview,
            dbStats: {
                totalQueries: Number(systemStats.totalQueries ?? 0),
                averageQueryDurationMs: Number((systemStats.averageQueryDurationMs ?? 0).toFixed(2)),
                slowestQueryDurationMs: Number((systemStats.slowestQueryDurationMs ?? 0).toFixed(2)),
                queryErrors: Number(systemStats.queryErrors ?? 0),
                queriesByOperation: {
                    findMany: Number(systemStats.queriesByOperation?.findMany ?? 0),
                    findUnique: Number(systemStats.queriesByOperation?.findUnique ?? 0),
                    create: Number(systemStats.queriesByOperation?.create ?? 0),
                    update: Number(systemStats.queriesByOperation?.update ?? 0),
                    delete: Number(systemStats.queriesByOperation?.delete ?? 0),
                    raw: Number(systemStats.queriesByOperation?.raw ?? 0),
                },
                slowestOperations: Array.isArray(systemStats.slowestOperations)
                    ? systemStats.slowestOperations.map((op) => ({
                        model: op.model ?? 'raw',
                        operation: op.operation ?? 'other',
                        averageDurationMs: Number((op.averageDurationMs ?? 0).toFixed(2)),
                        count: Number(op.count ?? 0),
                    }))
                    : [],
                recentSlowQueries: Array.isArray(systemStats.recentSlowQueries)
                    ? systemStats.recentSlowQueries.map((query) => ({
                        model: query.model ?? 'raw',
                        operation: query.operation ?? 'other',
                        durationMs: Number((query.durationMs ?? 0).toFixed(2)),
                        timestamp: query.timestamp ?? new Date().toISOString(),
                    }))
                    : [],
            },
            queryStats: {
                totalCalls: Number(systemStats.totalQueries),
                totalExecTimeMs: Number(systemStats.totalResponseTime.toFixed(2)),
                avgQueryTimeMs: Number(systemStats.avgResponseTime.toFixed(2)),
                maxQueryTimeMs: Number(systemStats.maxResponseTime.toFixed(2))
            },
            httpStats: {
                totalRequests: httpStats.totalRequests,
                totalErrors: httpStats.totalErrors,
                totalResponseTime: Number(httpStats.totalResponseTime.toFixed(2)),
                avgResponseTime: Number(httpStats.avgResponseTime.toFixed(2)),
                maxResponseTime: Number(httpStats.maxResponseTime.toFixed(2))
            }
        };
        return res.status(200).json(stats);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle stats not found error
        else if (error.message === 'Stats not found') {
            return res.status(404).json({ error: 'Stats not found' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to get stats' });
    }
})

router.get(`/getSocietyReport`, requireRole('Admin'), async (req, res): Promise<any> => {
    try {
        const { companyID } = req.query;
        if (!companyID) {
            throw new Error('Invalid request');
        }
        // Validate companyID
        const companyIDSchema = z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Company ID must be a positive number'
        });
        companyIDSchema.parse(companyID);
        const stats = await db.getCompanyStats(Number(companyID));
        if (!stats) {
            throw new Error('Stats not found');
        }
        return res.status(200).json(stats);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle stats not found error
        else if (error.message === 'Stats not found') {
            return res.status(404).json({ error: 'Stats not found' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to get stats' });
    }
});

router.get(`/getAllCompanies`, requireRole('Admin'), async (req, res): Promise<any> => {
    try {

        const companies = await db.getCompanies();

        if (!companies) {
            throw new Error('Companies not found');
        }

        return res.status(200).json(companies);
    } catch (error) {
        // Handle the Zod validation error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message) });
        }
        // Handle invalid request error
        else if (error.message === 'Invalid request') {
            return res.status(400).json({ error: 'Invalid request' });
        }
        // Handle companies not found error
        else if (error.message === 'Companies not found') {
            return res.status(404).json({ error: 'Companies not found' });
        }
        // Handle other errors
        console.log(error);
        return res.status(500).json({ error: 'Failed to get companies' });
    }
});

export default router;
