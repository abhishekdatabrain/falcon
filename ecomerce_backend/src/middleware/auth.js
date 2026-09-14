const { verifyAccessToken, verifyRefreshToken, generateAccessToken, setAuthCookies } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { User, Customer, Driver, Admin } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies ? req.cookies.access_token : null;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    let decoded = token ? verifyAccessToken(token) : null;

    // Silent Refresh: If access token missing or expired, attempt to auto-refresh using refresh_token cookie
    if (!decoded) {
      const refreshToken = req.cookies ? req.cookies.refresh_token : null;
      if (refreshToken) {
        const decodedRefresh = verifyRefreshToken(refreshToken);
        if (decodedRefresh) {
          const newAccessToken = generateAccessToken({ id: decodedRefresh.id, role: decodedRefresh.role });
          setAuthCookies(res, newAccessToken, refreshToken);
          token = newAccessToken;
          decoded = decodedRefresh;
        }
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

module.exports = {
  authenticate,
};
