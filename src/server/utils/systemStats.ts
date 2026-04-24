import fs from 'fs';
import path from 'path';
import { getQueryStatsSnapshot } from './db/queryStats.ts';
// read log files and generate system stats

export async function getHttpStats() {
    const logFilePath = path.resolve('./log/app.log'); // Using relative path
    const stats = {
        totalRequests: 0,
        totalErrors: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
    };

    try {
        if (!fs.existsSync(logFilePath)) {
            return stats;
        }

        const data = await fs.promises.readFile(logFilePath, 'utf-8');
        const lines = data.split('\n');

        for (const line of lines) {
            if (line) {
                const logEntry = JSON.parse(line);
                stats.totalRequests += 1;
                const durationMs = Number(logEntry.durationMs ?? logEntry.responseTime ?? 0);
                const statusCode = Number(logEntry.statusCode ?? logEntry?.res?.statusCode ?? 0);
                stats.totalResponseTime += Number.isFinite(durationMs) ? durationMs : 0;
                stats.maxResponseTime = durationMs > stats.maxResponseTime ? durationMs : stats.maxResponseTime;

                if (Number.isFinite(statusCode) && statusCode >= 400) {
                    stats.totalErrors += 1;
                }
            }
        }

        if (stats.totalRequests > 0) {
            stats.avgResponseTime = stats.totalResponseTime / stats.totalRequests;
        }

        return stats;
    } catch (error) {
        console.error('Error reading log file:', error);
        return stats;
    }
}

export async function getDbStats() {
    const snapshot = getQueryStatsSnapshot();
    return {
        ...snapshot,
        totalResponseTime: snapshot.totalQueries * snapshot.averageQueryDurationMs,
        avgResponseTime: snapshot.averageQueryDurationMs,
        maxResponseTime: snapshot.slowestQueryDurationMs,
    };
}
