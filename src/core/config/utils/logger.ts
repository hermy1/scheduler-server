import winston from "winston";
import config from "../../config"

export const logger = winston.createLogger({
    levels: config.logging.levels,
    level: config.logging.level,
    format: winston.format.combine(winston.format.colorize(), winston.format.json(), winston.format.timestamp(), winston.format.prettyPrint()),
    transports: [
        new winston.transports.Console({format: winston.format.simple()})
    ],
    silent: config.logging.silent
})