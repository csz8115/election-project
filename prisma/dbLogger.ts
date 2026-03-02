import pino from 'pino';
import * as fs from "node:fs";
import * as path from "node:path";

const isTestEnv = process.env.NODE_ENV === 'test';

// Create log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'log');
if (!isTestEnv && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Correctly configure Pino logger
const logger = pino({
    level: isTestEnv ? 'silent' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: !isTestEnv && process.env.NODE_ENV === 'development'
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
isTestEnv ? undefined : pino.destination({ dest: path.join(logDir, 'db.log'), sync: true })
);

export default logger;
