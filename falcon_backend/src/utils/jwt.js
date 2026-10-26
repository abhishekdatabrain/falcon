const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const setAuthCookies = (res, accessToken, refreshToken, role, existingCsrfToken = null) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

  let userRole = (role || '').toUpperCase();
  if (!userRole && accessToken) {
    const decoded = verifyAccessToken(accessToken);
    if (decoded && decoded.role) {
      userRole = decoded.role.toUpperCase();
    }
  }

  // 1. ADMIN AUTHENTICATION (Unchanged: persistent 24h/7d cookies preserved)
  if (userRole === 'ADMIN') {
    const adminAccessOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    };
    const adminRefreshOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
      adminAccessOptions.domain = process.env.COOKIE_DOMAIN;
      adminRefreshOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('admin_access_token', accessToken, adminAccessOptions);
    res.cookie('admin_refresh_token', refreshToken, adminRefreshOptions);
    return null;
  }

  // 2. DRIVER AUTHENTICATION (Unchanged: persistent cookies preserved)
  if (userRole === 'DRIVER') {
    const driverAccessOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    };
    const driverRefreshOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
      driverAccessOptions.domain = process.env.COOKIE_DOMAIN;
      driverRefreshOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('driver_access_token', accessToken, driverAccessOptions);
    res.cookie('driver_refresh_token', refreshToken, driverRefreshOptions);
    return null;
  }

  // 3. CUSTOMER AUTHENTICATION (Browser-Session Cookies: NO Max-Age, NO Expires)
  // Per RFC 6265, cookies configured without Max-Age or Expires behave as browser-session cookies.
  // They remain in browser memory during the current session across all tabs and page navigations,
  // but are automatically discarded when the browser is closed.
  const customerSessionOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: '/',
    // Explicitly omit maxAge and expires to ensure true session-only lifetime
  };

  if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
    customerSessionOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('customer_access_token', accessToken, customerSessionOptions);
  res.cookie('customer_refresh_token', refreshToken, customerSessionOptions);
  res.cookie('access_token', accessToken, customerSessionOptions);
  res.cookie('refresh_token', refreshToken, customerSessionOptions);

  // Session-bound CSRF token cookie (accessible by JavaScript to attach in x-csrf-token header)
  const csrfToken = existingCsrfToken || generateCsrfToken();
  const csrfCookieOptions = {
    httpOnly: false,
    secure: isProd,
    sameSite,
    path: '/',
    // Omit maxAge and expires to match customer browser session
  };
  if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== 'localhost') {
    csrfCookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.cookie('customer_csrf_token', csrfToken, csrfCookieOptions);

  return csrfToken;
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
    cookieNames = [
      'customer_access_token',
      'customer_refresh_token',
      'access_token',
      'refresh_token',
      'customer_csrf_token',
    ];
  } else {
    // Fallback: clear all if role is unspecified
    cookieNames = [
      'access_token',
      'refresh_token',
      'customer_access_token',
      'customer_refresh_token',
      'customer_csrf_token',
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
    const isCsrf = name.includes('csrf');
    for (const opts of optionsList) {
      const clearOpts = isCsrf ? { ...opts, httpOnly: false } : opts;
      res.clearCookie(name, clearOpts);
      res.cookie(name, '', { ...clearOpts, expires: new Date(0), maxAge: 0 });
    }
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateCsrfToken,
  setAuthCookies,
  clearAuthCookies,
};
