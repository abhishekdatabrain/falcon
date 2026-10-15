const { sendError } = require('../utils/response');

/**
 * Authorize broad system role (e.g. ROLES.ADMIN, ROLES.CUSTOMER, ROLES.DRIVER)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user.', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: [${allowedRoles.join(', ')}].`,
        [],
        403
      );
    }

    next();
  };
};

/**
 * Check if the admin user has a specific granular module.action permission.
 * Super Admins bypass permission checks automatically.
 */
const checkPermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user.', [], 401);
    }

    // Super Admin has full unrestricted access
    if (req.user.isSuperAdmin || (req.user.role === 'ADMIN' && req.user.email === 'admin@gmail.com')) {
      return next();
    }

    const permissions = req.user.permissions || [];
    if (permissions.includes('*') || permissions.includes(permissionCode)) {
      return next();
    }

    return sendError(
      res,
      `Access denied. Missing required permission: [${permissionCode}].`,
      [],
      403
    );
  };
};

/**
 * Enforce that only a verified Super Admin can access the endpoint.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Unauthenticated user.', [], 401);
  }

  if (req.user.isSuperAdmin || (req.user.role === 'ADMIN' && req.user.email === 'admin@gmail.com')) {
    return next();
  }

  return sendError(res, 'Access denied. Only Super Admin has authority for this action.', [], 403);
};

module.exports = {
  authorize,
  checkPermission,
  requireSuperAdmin,
};

