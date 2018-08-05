'use strict';

const winston = require('winston');

const logger = module.exports = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: `./logs/${new Date().toDateString().replace(/ /g, '-')}.log`, level: 'verbose' }),
  ],
});

logger.INFO = 'info';
logger.ERROR = 'error';
