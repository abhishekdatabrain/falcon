const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');
const { setAuthCookies, clearAuthCookies } = require('../utils/jwt');

class AuthController {
  async register(req, res, next) {
    try {
      let { email, mobile, password, first_name, last_name, username, verificationCode } = req.body;
      const fieldErrors = {};

      if (username) {
        const parts = username.trim().split(/\s+/);
        if (!first_name) first_name = parts[0] || 'User';
        if (!last_name) last_name = parts.slice(1).join(' ') || parts[0] || 'Customer';
      }

      if (!mobile && email) {
        const digits = Buffer.from(email).reduce((acc, byte) => (acc + byte) % 100000000, 10000000);
        mobile = `+9665${String(digits).padStart(8, '0')}`;
      } else if (!email && mobile) {
        const cleanMobile = mobile.replace(/[^0-9]/g, '');
        email = `user_${cleanMobile}@saqrcart.com`;
      }

      if (!username && !first_name) fieldErrors.username = 'Username is required';
      if (!first_name) fieldErrors.first_name = 'First name is required';
      if (!last_name) fieldErrors.last_name = 'Last name is required';
      if (!email) fieldErrors.email = 'Email address is required';
      if (!mobile) fieldErrors.mobile = 'Mobile number is required';
      if (!password) fieldErrors.password = 'Password is required';

      if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields',
          errors: Object.values(fieldErrors),
          fieldErrors,
        });
      }

      const result = await authService.registerCustomer({ email, mobile, password, first_name, last_name, username, verificationCode });
      return sendSuccess(res, 'Registration successful. You can now log in.', {
        userId: result.user.id,
        email: result.user.email,
        mobile: result.user.mobile,
        username: result.user.username,
      }, 201);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: error.fieldErrors ? Object.values(error.fieldErrors) : [error.message],
        fieldErrors: error.fieldErrors || {},
      });
    }
  }

  async registerAdmin(req, res, next) {
    try {
      const { email, mobile, password, name, department } = req.body;
      if (!email || !mobile || !password || !name) {
        return sendError(res, 'Email, mobile, password, and admin name are required', [], 400);
      }

      const result = await authService.registerAdmin({ email, mobile, password, name, department });
      return sendSuccess(res, 'Admin account created successfully. You can now log in.', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async login(req, res, next) {
    try {
      const { loginInput, password } = req.body; // email or mobile
      const fieldErrors = {};
      if (!loginInput) fieldErrors.loginInput = 'Email or mobile number is required';
      if (!password) fieldErrors.password = 'Password is required';
      if (Object.keys(fieldErrors).length > 0) {
        return sendError(res, 'Please fill in all required fields', Object.values(fieldErrors), 400, { fieldErrors });
      }

      const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const { user, accessToken, refreshToken } = await authService.login(loginInput, password, reqInfo);

      const csrfToken = setAuthCookies(res, accessToken, refreshToken, user.role);

      return sendSuccess(res, 'Login successful', { user, accessToken, csrfToken });
    } catch (error) {
      const fieldErrors = {};
      if (error.field && error.field !== 'general') {
        fieldErrors[error.field] = error.message;
      }
      return sendError(res, error.message, error.errors || [], error.statusCode || 401, { fieldErrors });
    }
  }

  async refresh(req, res, next) {
    try {
      const reqRole = (req.headers['x-auth-role'] || '').toUpperCase();
      let refreshToken = null;
      if (req.cookies) {
        if (reqRole === 'ADMIN') refreshToken = req.cookies.admin_refresh_token || req.cookies.refresh_token;
        else if (reqRole === 'DRIVER') refreshToken = req.cookies.driver_refresh_token || req.cookies.refresh_token;
        else if (reqRole === 'CUSTOMER') refreshToken = req.cookies.customer_refresh_token || req.cookies.refresh_token;
        else refreshToken = req.cookies.refresh_token || req.cookies.customer_refresh_token || req.cookies.admin_refresh_token || req.cookies.driver_refresh_token;
      }

      const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, role } = await authService.refreshTokens(refreshToken, reqInfo);

      const csrfToken = setAuthCookies(res, newAccessToken, newRefreshToken, role || reqRole, req.cookies?.customer_csrf_token);
      return sendSuccess(res, 'Tokens refreshed successfully', { csrfToken });
    } catch (error) {
      clearAuthCookies(res, req.headers['x-auth-role']);
      return sendError(res, error.message || 'Token refresh failed', [], 401);
    }
  }

  async logout(req, res, next) {
    const role = (req.body?.role || req.headers['x-auth-role'] || req.user?.role || '').toUpperCase();
    try {
      let refreshToken = null;
      if (req.cookies) {
        if (role === 'ADMIN') refreshToken = req.cookies.admin_refresh_token;
        else if (role === 'DRIVER') refreshToken = req.cookies.driver_refresh_token;
        else if (role === 'CUSTOMER') refreshToken = req.cookies.customer_refresh_token || req.cookies.refresh_token;
        else refreshToken = req.cookies.customer_refresh_token || req.cookies.refresh_token;
      }
      await authService.logout(refreshToken, req.user?.id);
      clearAuthCookies(res, role);
      return sendSuccess(res, 'Logout successful');
    } catch (error) {
      clearAuthCookies(res, role);
      return sendSuccess(res, 'Logout completed');
    }
  }

  async me(req, res, next) {
    try {
      const user = {
        id: req.user.id,
        email: req.user.email,
        mobile: req.user.mobile,
        username: req.user.username || null,
        role: req.user.role,
        profile: req.user.customer || req.user.driver || req.user.admin,
      };

      if (req.user.role === 'ADMIN') {
        user.isSuperAdmin = !!req.user.isSuperAdmin;
        user.roles = req.user.assigned_roles
          ? req.user.assigned_roles.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description,
            }))
          : [];
        user.permissions = req.user.permissions || [];
      }

      const csrfToken = req.cookies?.customer_csrf_token || null;

      return sendSuccess(res, 'User profile retrieved', { user, csrfToken });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  async checkUsername(req, res, next) {
    try {
      const raw = (req.query.username || '').trim();
      const result = await authService.checkUsernameAvailability(raw);
      return sendSuccess(res, 'Username availability checked', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async sendVerificationCode(req, res, next) {
    try {
      const { identifier, type } = req.body;
      if (!identifier) {
        return sendError(res, 'Mobile number or email address is required', [], 400);
      }
      const result = await authService.sendVerificationCode({ identifier, type });
      return sendSuccess(res, result.message, {
        code: result.code || null,
        sentToEmail: type === 'email',
      });
    } catch (error) {
      return sendError(res, error.message, error.fieldErrors ? Object.values(error.fieldErrors) : [], 400, {
        fieldErrors: error.fieldErrors || {},
      });
    }
  }

  async verifyCode(req, res, next) {
    try {
      const { identifier, code } = req.body;
      const result = await authService.verifyVerificationCode({ identifier, code });
      return sendSuccess(res, result.message);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async checkMobile(req, res, next) {
    try {
      const mobile = (req.query.mobile || '').trim();
      const result = await authService.checkMobileAvailability(mobile);
      return sendSuccess(res, 'Mobile availability checked', result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new AuthController();
