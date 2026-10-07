const { verifyAccessToken, verifyRefreshToken, generateAccessToken, setAuthCookies } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { User, Customer, Driver, Admin } = require('../models');

const getTokensFromReq = (req) => {
  const reqRole = (req.headers['x-auth-role'] || '').toUpperCase();
  const path = req.originalUrl || req.url || '';

  let token = null;
  let refreshToken = null;
  let targetRole = null;

  if (reqRole === 'ADMIN' || path.includes('/admin')) {
    targetRole = 'ADMIN';
    token = req.cookies?.admin_access_token;
    refreshToken = req.cookies?.admin_refresh_token;
  } else if (reqRole === 'DRIVER' || path.includes('/driver')) {
    targetRole = 'DRIVER';
    token = req.cookies?.driver_access_token;
    refreshToken = req.cookies?.driver_refresh_token;
  } else if (reqRole === 'CUSTOMER' || path.includes('/customer')) {
    targetRole = 'CUSTOMER';
    token = req.cookies?.customer_access_token;
    refreshToken = req.cookies?.customer_refresh_token;
  }

  // Fallback if specific role cookie not found or path was generic
  if (!token && req.cookies) {
    if (reqRole === 'ADMIN') token = req.cookies.admin_access_token || req.cookies.access_token;
    else if (reqRole === 'DRIVER') token = req.cookies.driver_access_token || req.cookies.access_token;
    else if (reqRole === 'CUSTOMER') token = req.cookies.customer_access_token || req.cookies.access_token;
    else token = req.cookies.access_token || req.cookies.customer_access_token || req.cookies.admin_access_token || req.cookies.driver_access_token;
  }

  if (!refreshToken && req.cookies) {
    if (reqRole === 'ADMIN') refreshToken = req.cookies.admin_refresh_token || req.cookies.refresh_token;
    else if (reqRole === 'DRIVER') refreshToken = req.cookies.driver_refresh_token || req.cookies.refresh_token;
    else if (reqRole === 'CUSTOMER') refreshToken = req.cookies.customer_refresh_token || req.cookies.refresh_token;
    else refreshToken = req.cookies.refresh_token || req.cookies.customer_refresh_token || req.cookies.admin_refresh_token || req.cookies.driver_refresh_token;
  }

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  return { token, refreshToken, targetRole };
};

const authenticate = async (req, res, next) => {
  try {
    let { token, refreshToken, targetRole } = getTokensFromReq(req);
    let decoded = token ? verifyAccessToken(token) : null;

    // If token is decoded but role mismatches the explicit targetRole (e.g. customer_access_token used on admin path), try role token
    if (decoded && targetRole && decoded.role !== targetRole) {
      const altToken = targetRole === 'ADMIN' ? req.cookies?.admin_access_token : (targetRole === 'DRIVER' ? req.cookies?.driver_access_token : req.cookies?.customer_access_token);
      if (altToken) {
        const altDecoded = verifyAccessToken(altToken);
        if (altDecoded) {
          token = altToken;
          decoded = altDecoded;
        }
      }
    }

    // Silent Refresh: If access token missing or expired, attempt to auto-refresh using refresh token
    if (!decoded && refreshToken) {
      const decodedRefresh = verifyRefreshToken(refreshToken);
      if (decodedRefresh) {
        const newAccessToken = generateAccessToken({ id: decodedRefresh.id, role: decodedRefresh.role });
        setAuthCookies(res, newAccessToken, refreshToken, decodedRefresh.role);
        token = newAccessToken;
        decoded = decodedRefresh;
      }
    }

    if (!token || !decoded) {
      return sendError(res, 'Authentication token missing. Please log in.', [], 401);
    }

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Driver, as: 'driver' },
        { model: Admin, as: 'admin' },
      ],
    });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 'User account is inactive or no longer exists.', [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    let { token, refreshToken, targetRole } = getTokensFromReq(req);
    let decoded = token ? verifyAccessToken(token) : null;

    if (decoded && targetRole && decoded.role !== targetRole) {
      const altToken = targetRole === 'ADMIN' ? req.cookies?.admin_access_token : (targetRole === 'DRIVER' ? req.cookies?.driver_access_token : req.cookies?.customer_access_token);
      if (altToken) {
        const altDecoded = verifyAccessToken(altToken);
        if (altDecoded) {
          token = altToken;
          decoded = altDecoded;
        }
      }
    }

    if (!decoded && refreshToken) {
      const decodedRefresh = verifyRefreshToken(refreshToken);
      if (decodedRefresh) {
        const newAccessToken = generateAccessToken({ id: decodedRefresh.id, role: decodedRefresh.role });
        setAuthCookies(res, newAccessToken, refreshToken, decodedRefresh.role);
        token = newAccessToken;
        decoded = decodedRefresh;
      }
    }

    if (token && decoded) {
      const user = await User.findByPk(decoded.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Driver, as: 'driver' },
          { model: Admin, as: 'admin' },
        ],
      });

      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
  } catch (error) {
    // Non-blocking optional authentication
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
