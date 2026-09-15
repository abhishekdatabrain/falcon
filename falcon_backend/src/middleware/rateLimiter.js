const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many login/registration attempts. Please try again later.', [], 429);
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP. Please slow down.', [], 429);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
