const { sendError } = require('../utils/response');

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

module.exports = {
  authorize,
};
