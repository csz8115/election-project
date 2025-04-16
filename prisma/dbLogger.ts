import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Create log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Correctly configure Pino logger
const logger = pino({
    level: 'info', // Configurable log level
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
    formatters: {
        level: (label) => {
            return { level: label };
        },
        // Add custom fields to all logs
        bindings: (bindings) => {
            return {
                pid: bindings.pid,
                hostname: bindings.hostname,
                app: 'election-project',
            };
        },
    },
    // Redact sensitive information
    redact: ['password', 'secret', 'authorization'],
},
process.env.NODE_ENV === 'test' ? undefined : pino.destination({ dest: './log/db.log', sync: true })
);

export default logger;