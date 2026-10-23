const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

const isDevOrLocal = (req) => {
  if (process.env.NODE_ENV === 'development') return true;
  const ip = req.ip || req.connection?.remoteAddress || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) return true;
  return false;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    return isDevOrLocal(req);
  },
  handler: (req, res) => {
    return sendError(res, 'Too many login/registration attempts. Please try again later.', [], 429);
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    if (isDevOrLocal(req)) return true;
    return req.path.includes('/uploads') || req.path.startsWith('/uploads') || req.path === '/health';
  },
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP. Please slow down.', [], 429);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
