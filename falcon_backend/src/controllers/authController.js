const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');
const { setAuthCookies, clearAuthCookies } = require('../utils/jwt');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, mobile, password, first_name, last_name } = req.body;
      if (!email || !mobile || !password || !first_name || !last_name) {
        return sendError(res, 'All registration fields are required', [], 400);
      }

      const result = await authService.registerCustomer({ email, mobile, password, first_name, last_name });
      return sendSuccess(res, 'Registration successful. You can now log in.', {
        userId: result.user.id,
        email: result.user.email,
      }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
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
      if (!loginInput || !password) {
        return sendError(res, 'Login credential and password are required', [], 400);
      }

      const reqInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const { user, accessToken, refreshToken } = await authService.login(loginInput, password, reqInfo);

      setAuthCookies(res, accessToken, refreshToken, user.role);

      return sendSuccess(res, 'Login successful', { user, accessToken });
    } catch (error) {
      return sendError(res, error.message, [], 401);
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

      setAuthCookies(res, newAccessToken, newRefreshToken, role || reqRole);
      return sendSuccess(res, 'Tokens refreshed successfully');
    } catch (error) {
      clearAuthCookies(res, req.headers['x-auth-role']);
      return sendError(res, error.message || 'Token refresh failed', [], 401);
    }
  }

  async logout(req, res, next) {
    const role = req.user?.role || req.headers['x-auth-role'];
    try {
      let refreshToken = null;
      if (req.cookies) {
        if (role === 'ADMIN') refreshToken = req.cookies.admin_refresh_token || req.cookies.refresh_token;
        else if (role === 'DRIVER') refreshToken = req.cookies.driver_refresh_token || req.cookies.refresh_token;
        else if (role === 'CUSTOMER') refreshToken = req.cookies.customer_refresh_token || req.cookies.refresh_token;
        else refreshToken = req.cookies.refresh_token || req.cookies.customer_refresh_token || req.cookies.admin_refresh_token;
      }
      await authService.logout(refreshToken);
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
        role: req.user.role,
        profile: req.user.customer || req.user.driver || req.user.admin,
      };
      return sendSuccess(res, 'User profile retrieved', { user });
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }
}

module.exports = new AuthController();
