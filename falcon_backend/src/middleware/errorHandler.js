const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled Error: %o', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => e.message);
    return sendError(res, 'Database validation error', errors, 400);
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return sendError(res, err.message || 'Unauthorized', [], 401);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  return sendError(res, message, [], statusCode);
};

module.exports = errorHandler;
