import fs from 'fs';
import path from 'path';
// read log files and generate system stats

export async function getHttpStats() {
    const logFilePath = path.resolve('/Users/coryz/git/election-project-frontrow/log/http.log'); // Using absolute path
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

