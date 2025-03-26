import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Create log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Correctly configure Pino logger
const logger = pino(
    {
        level: 'info',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    },
    process.env.NODE_ENV === 'test' ? undefined : pino.destination({ dest: './log/http.log', sync: true }) // Use sync: true to avoid race conditions
);

export default logger;