const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '24h',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

const setAuthCookies = (res, accessToken, refreshToken, role) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

  const accessOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSite,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };

  const refreshOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  let userRole = role;
  if (!userRole && accessToken) {
    const decoded = verifyAccessToken(accessToken);
    if (decoded && decoded.role) {
      userRole = decoded.role;
    }
  }

  // Set default global cookies
  res.cookie('access_token', accessToken, accessOptions);
  res.cookie('refresh_token', refreshToken, refreshOptions);

  // Set role-specific cookies to allow concurrent admin & customer logins in same browser
  if (userRole === 'ADMIN') {
    res.cookie('admin_access_token', accessToken, accessOptions);
    res.cookie('admin_refresh_token', refreshToken, refreshOptions);
  } else if (userRole === 'DRIVER') {
    res.cookie('driver_access_token', accessToken, accessOptions);
    res.cookie('driver_refresh_token', refreshToken, refreshOptions);
  } else if (userRole === 'CUSTOMER') {
    res.cookie('customer_access_token', accessToken, accessOptions);
    res.cookie('customer_refresh_token', refreshToken, refreshOptions);
  }
};

const clearAuthCookies = (res, role) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSite,
    path: '/',
  };

  if (role === 'ADMIN') {
    res.clearCookie('admin_access_token', options);
    res.clearCookie('admin_refresh_token', options);
  } else if (role === 'DRIVER') {
    res.clearCookie('driver_access_token', options);
    res.clearCookie('driver_refresh_token', options);
  } else if (role === 'CUSTOMER') {
    res.clearCookie('customer_access_token', options);
    res.clearCookie('customer_refresh_token', options);
  } else {
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
    res.clearCookie('admin_access_token', options);
    res.clearCookie('admin_refresh_token', options);
    res.clearCookie('customer_access_token', options);
    res.clearCookie('customer_refresh_token', options);
    res.clearCookie('driver_access_token', options);
    res.clearCookie('driver_refresh_token', options);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
