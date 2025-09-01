import { createLogger, format, transports } from "winston";

export const audit = createLogger({
  format: format.combine(format.json(), format.timestamp()),
  transports: [
    new transports.File({
      maxsize: 5120000,
      maxFiles: 5,
      filename: `./audit/logs.log`,
    }),
  ],
});
