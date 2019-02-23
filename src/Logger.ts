import { createLogger, format, transports } from 'winston';
const { combine, timestamp, simple, colorize } = format;
import { existsSync, mkdirSync } from 'fs';

// Set up logging
const logDir = 'logs';
// Create the log directory if it does not exist
if (!existsSync(logDir)) {
  mkdirSync(logDir);
}
// Create Logger
const Logger = createLogger({
  transports: [
    new transports.File({
      filename: `${logDir}/express.log`,
      level: 'info',
      handleExceptions: true
    })
  ]
});

if (process.env.NODE_ENV === 'development') {
  Logger.add(
    createLogger({
      format: combine(colorize(), timestamp(), simple()),
      transports: [
        new transports.Console({
          level: 'debug'
        })
      ]
    })
  );
}

export default Logger;
export const debug = Logger.debug;
