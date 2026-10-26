const { sendError } = require('../utils/response');

/**
 * CSRF Protection Middleware for Customer State-Changing Requests
 * Protects cookie-authenticated POST, PUT, PATCH, DELETE operations
 * using the Double Submit Cookie pattern.
 */
const csrfProtection = (req, res, next) => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Exempt public endpoints where customer is not yet authenticated with session cookies
  const publicExemptEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/register-admin',
    '/auth/refresh',
    '/auth/logout',
    '/auth/send-code',
  ];

  const reqPath = req.originalUrl || req.path || '';
  if (publicExemptEndpoints.some((p) => reqPath.includes(p))) {
    return next();
  }

  // Check if request is authenticated using customer session cookies
  const hasCustomerSessionCookie = Boolean(
    req.cookies?.customer_access_token ||
    req.cookies?.access_token ||
    req.cookies?.customer_refresh_token
  );

  // If request is from an authenticated customer using session cookies:
  if (hasCustomerSessionCookie) {
    const clientCsrfToken =
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'] ||
      req.body?._csrf;

    const serverCsrfToken = req.cookies?.customer_csrf_token;

    if (!clientCsrfToken || !serverCsrfToken || clientCsrfToken !== serverCsrfToken) {
      return sendError(
        res,
        'CSRF validation failed: Invalid or missing CSRF token. Please refresh the page and try again.',
        [],
        403
      );
    }
  }

  next();
};

module.exports = {
  csrfProtection,
};
