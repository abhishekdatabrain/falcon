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

  // Set role-specific cookies to allow concurrent admin & customer logins in same browser
  if (userRole === 'ADMIN') {
    res.cookie('admin_access_token', accessToken, accessOptions);
    res.cookie('admin_refresh_token', refreshToken, refreshOptions);
  } else if (userRole === 'DRIVER') {
    res.cookie('driver_access_token', accessToken, accessOptions);
    res.cookie('driver_refresh_token', refreshToken, refreshOptions);
  } else {
    // CUSTOMER or default storefront
    res.cookie('customer_access_token', accessToken, accessOptions);
    res.cookie('customer_refresh_token', refreshToken, refreshOptions);
    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);
  }
};

const clearAuthCookies = (res, role) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

  const normalizedRole = (role || '').toUpperCase();
  let cookieNames = [];

  if (normalizedRole === 'ADMIN') {
    // Only clear Admin cookies, preserving active Customer & Driver sessions
    cookieNames = ['admin_access_token', 'admin_refresh_token'];
  } else if (normalizedRole === 'DRIVER') {
    // Only clear Driver cookies, preserving active Admin & Customer sessions
    cookieNames = ['driver_access_token', 'driver_refresh_token'];
  } else if (normalizedRole === 'CUSTOMER') {
    // Only clear Customer cookies, preserving active Admin & Driver sessions
    cookieNames = ['customer_access_token', 'customer_refresh_token', 'access_token', 'refresh_token'];
  } else {
    // Fallback: clear all if role is unspecified
    cookieNames = [
      'access_token',
      'refresh_token',
      'customer_access_token',
      'customer_refresh_token',
      'admin_access_token',
      'admin_refresh_token',
      'driver_access_token',
      'driver_refresh_token',
    ];
  }

  const optionsList = [
    { httpOnly: true, secure: isProd, sameSite, path: '/' },
  ];

  if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
    optionsList.push({
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    });
  }

  // Clear targeted auth cookies with both clearCookie and immediate expiration
  for (const name of cookieNames) {
    for (const opts of optionsList) {
      res.clearCookie(name, opts);
      res.cookie(name, '', { ...opts, expires: new Date(0), maxAge: 0 });
    }
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
