import pino from 'pino';
import fs from 'fs';
import pretty from "pino-pretty";
import path from 'path';
import { multistream } from 'pino';

const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
  customPrettifiers: {
    level: (label) => {
      return `\x1b[36m${label}\x1b[0m`; // Cyan color for level
    }
  },
  customLevels: {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
  }
});
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
        }
    },
    // Redact sensitive information
}, multistream([
    { stream: prettyStream },
    { stream: pino.destination({ dest: path.join(logDir, 'app.log'), sync: true }) }
]));
export default logger;
