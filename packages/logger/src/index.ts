import { config, createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "debug",
  levels: config.cli.levels,
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.colorize(),
        format.simple(),
        format.printf(({ timestamp, level, message }) => {
          return `${level}: ${message}`;
          // return `[${timestamp}] ${level}: ${message}`;
        }),
      ),
    }),
  ],
});

export default logger;
