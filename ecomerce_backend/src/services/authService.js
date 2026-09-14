const { User, Customer, Driver, Admin, RefreshToken, sequelize } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ROLES = require('../constants/roles');

class AuthService {
  async registerCustomer(data) {
    const { email, mobile, password, first_name, last_name } = data;

    const existingUser = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      throw new Error('Email or mobile number is already registered');
    }

    const hashedPassword = await hashPassword(password);

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        email,
        mobile,
        password_hash: hashedPassword,
        role: ROLES.CUSTOMER,
        status: 'ACTIVE',
      }, { transaction: t });

      const customer = await Customer.create({
        user_id: user.id,
        first_name,
        last_name,
      }, { transaction: t });

      return { user, customer };
    });

    return result;
  }

  async login(loginInput, password, reqInfo = {}) {
    const user = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [{ email: loginInput }, { mobile: loginInput }],
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: Driver, as: 'driver' },
        { model: Admin, as: 'admin' },
      ],
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Your account is deactivated. Please contact support.');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      ip_address: reqInfo.ip,
      user_agent: reqInfo.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profile: user.customer || user.driver || user.admin,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenString, reqInfo = {}) {
    if (!refreshTokenString) {
      throw new Error('Refresh token missing');
    }

    const decoded = verifyRefreshToken(refreshTokenString);
    if (!decoded) {
      throw new Error('Invalid or expired refresh token');
    }

    const savedToken = await RefreshToken.findOne({
      where: {
        token: refreshTokenString,
        is_revoked: false,
      },
    });

    if (!savedToken) {
      throw new Error('Refresh token revoked or invalid');
    }

    // Revoke old refresh token (token rotation)
    savedToken.is_revoked = true;
    await savedToken.save();

    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('User inactive or invalid');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: expiresAt,
      ip_address: reqInfo.ip,
      user_agent: reqInfo.userAgent,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshTokenString) {
    if (refreshTokenString) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { token: refreshTokenString } }
      );
    }
    return true;
  }
}

module.exports = new AuthService();
