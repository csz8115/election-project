import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Create log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Customize Pino logger
const logger = pino(
    {
        level: 'info',
        // Customize timestamp
        timestamp: pino.stdTimeFunctions.isoTime,
        // Add custom fields to every log
        base: {
            app: 'election-project',
            env: process.env.NODE_ENV
        },
        // Customize which keys to include/exclude
        redact: ['password', 'secret'],
        // Format specific keys
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
            // Add custom attributes to bindings
            bindings: (bindings) => {
                return { 
                    pid: bindings.pid,
                    hostname: bindings.hostname,
                    node_version: process.version
                };
            }
        },
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    },
    process.env.NODE_ENV === 'test' ? undefined : pino.destination({ dest: './log/http.log', sync: true })
);

export default logger;