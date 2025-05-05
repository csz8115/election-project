import fs from 'fs';
import path from 'path';
// read log files and generate system stats

export async function getHttpStats() {
    const logFilePath = path.resolve('/_RIT/rit/432/electionProj/election-project-frontrow/log/http.log'); // Using absolute path
    const stats = {
        totalRequests: 0,
        totalErrors: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
    };

    try {
        const data = await fs.promises.readFile(logFilePath, 'utf-8');
        const lines = data.split('\n');

        for (const line of lines) {
            if (line) {
                const logEntry = JSON.parse(line);
                stats.totalRequests += 1;
                stats.totalResponseTime += logEntry.responseTime || 0;
                stats.maxResponseTime = logEntry.responseTime > stats.maxResponseTime ? logEntry.responseTime : stats.maxResponseTime;

                if (logEntry.res && logEntry.res.statusCode && (logEntry.res.statusCode < 200 || logEntry.res.statusCode >= 300)) {
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
        throw new Error('Failed to get HTTP stats');
    }
}

export async function getDbStats() {
    const logFilePath = path.resolve('/_RIT/rit/432/electionProj/election-project-frontrow/log/db.log'); // Using absolute path
    const stats = {
        totalQueries: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
    };

    try {
        const data = await fs.promises.readFile(logFilePath, 'utf-8');
        const lines = data.split('\n');

        for (const line of lines) {
            if (line) {
                const logEntry = JSON.parse(line);
                // take ms off duration and convert to number
                if (logEntry.duration) {
                    logEntry.duration = Number(logEntry.duration.replace('ms', ''));
                }
                stats.totalQueries += 1;
                stats.totalResponseTime += logEntry.duration || 0;
                stats.maxResponseTime = logEntry.duration > stats.maxResponseTime ? logEntry.duration : stats.maxResponseTime;
                stats.avgResponseTime = logEntry.duration > stats.avgResponseTime ? logEntry.duration : stats.avgResponseTime;
            }
        }

        if (stats.totalQueries > 0) {
            stats.avgResponseTime = stats.totalResponseTime / stats.totalQueries;
        }

        return stats;
    } catch (error) {
        console.error('Error reading log file:', error);
        throw new Error('Failed to get DB stats');
    }
}