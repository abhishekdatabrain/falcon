const { User, Customer, Driver, Admin, RefreshToken, Role, Permission, sequelize } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ROLES = require('../constants/roles');
const emailService = require('./emailService');

const verificationStore = new Map();

class AuthService {
  async registerCustomer(data) {
    const { email, mobile, password, first_name, last_name, username, verificationCode } = data;

    if (verificationCode) {
      const emailValid = email ? this.verifyCode(email, verificationCode) : false;
      const mobileValid = (!emailValid && mobile) ? this.verifyCode(mobile, verificationCode) : false;
      const isValid = emailValid || mobileValid;

      if (!isValid) {
        const err = new Error('Invalid or expired verification code');
        err.fieldErrors = { verificationCode: 'Invalid or expired verification code' };
        throw err;
      }
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedMobile = (mobile || '').trim();
    // Allow unicode letters, numbers, underscores, dots, and hyphens
    const cleanUsername = username ? String(username).trim().replace(/[^\p{L}\p{N}_.-]/gu, '') : null;

    const existingEmail = await User.findOne({
      where: { email: normalizedEmail },
    });
    const existingMobile = await User.findOne({
      where: { mobile: normalizedMobile },
    });

    let existingUsername = null;
    if (cleanUsername) {
      existingUsername = await User.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('username')),
          cleanUsername.toLowerCase()
        ),
      });
    }

    const fieldErrors = {};
    if (existingEmail) fieldErrors.email = 'This email address is already registered';
    if (existingMobile) fieldErrors.mobile = 'This mobile number is already registered';
    if (existingUsername) fieldErrors.username = 'This username is already taken. Please choose another username.';

    if (Object.keys(fieldErrors).length > 0) {
      const messages = Object.values(fieldErrors);
      const err = new Error(messages[0]);
      err.fieldErrors = fieldErrors;
      throw err;
    }

    const hashedPassword = await hashPassword(password);

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        username: cleanUsername || null,
        email,
        mobile,
        password_hash: hashedPassword,
        role: ROLES.CUSTOMER,
        status: 'ACTIVE',
      }, { transaction: t });

      const customer = await Customer.create({
        user_id: user.id,
        first_name: first_name || cleanUsername || 'User',
        last_name: last_name || 'Customer',
      }, { transaction: t });

      return { user, customer };
    });

    return result;
  }

  async registerAdmin(data) {
    const { email, mobile, password, name, department } = data;
    console.log(data, "data")
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
        role: ROLES.ADMIN,
        status: 'ACTIVE',
      }, { transaction: t });

      const admin = await Admin.create({
        user_id: user.id,
        name: name || 'System Administrator',
        department: department || 'Management',
      }, { transaction: t });

      return { user, admin };
    });

    return result;
  }

  async login(loginInput, password, reqInfo = {}) {
    const rawInput = (loginInput || '').trim();
    const lowerInput = rawInput.toLowerCase();

    const user = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: rawInput },
          { mobile: rawInput },
          { username: rawInput },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('User.email')), lowerInput),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('User.username')), lowerInput),
        ],
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: Driver, as: 'driver' },
        { model: Admin, as: 'admin' },
        {
          model: Role,
          as: 'assigned_roles',
          required: false,
          include: [{ model: Permission, as: 'permissions' }],
        },
      ],
    });

    if (!user) {
      const error = new Error('No account with this username, email or mobile number');
      error.field = 'loginInput';
      error.statusCode = 400;
      throw error;
    }

    if (user.status !== 'ACTIVE') {
      const error = new Error('Your account is deactivated. Please contact support.');
      error.field = 'general';
      error.statusCode = 403;
      throw error;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Incorrect password. Please try again.');
      error.field = 'password';
      error.statusCode = 400;
      throw error;
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

    const userObj = {
      id: user.id,
      username: user.username || null,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      profile: user.customer || user.driver || user.admin,
    };

    if (user.role === 'ADMIN') {
      const isSuperAdmin = Boolean(
        user.assigned_roles &&
        user.assigned_roles.some((r) => r.slug === 'super_admin' && r.is_active)
      );

      let permissions = [];
      if (isSuperAdmin) {
        const allPerms = await Permission.findAll({ attributes: ['code'] });
        permissions = allPerms.map((p) => p.code);
      } else if (user.assigned_roles && user.assigned_roles.length > 0) {
        const permSet = new Set();
        user.assigned_roles.forEach((r) => {
          if (r.is_active) {
            (r.permissions || []).forEach((p) => permSet.add(p.code));
          }
        });
        permissions = Array.from(permSet);
      }

      userObj.isSuperAdmin = !!isSuperAdmin;
      userObj.roles = user.assigned_roles
        ? user.assigned_roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))
        : [];
      userObj.permissions = permissions;
    }

    return {
      user: userObj,
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
      role: user.role,
    };
  }

  async logout(refreshTokenString, userId = null) {
    if (refreshTokenString) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { token: refreshTokenString } }
      );
    }
    if (userId) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId, is_revoked: false } }
      );
    }
    return true;
  }

  async checkUsernameAvailability(rawUsername) {
    const username = (rawUsername || '').trim().toLowerCase().replace(/[^\p{L}\p{N}_.-]/gu, '');
    const base = username || 'user';

    if (!username || username.length < 3) {
      return {
        available: false,
        username,
        message: 'Username must be at least 3 characters',
        suggestions: [
          `${base}${Math.floor(10 + Math.random() * 90)}`,
          `${base}_${Math.floor(100 + Math.random() * 900)}`,
          `${base}_saqr`,
          `${base}${new Date().getFullYear()}`,
        ],
      };
    }

    // Check if user with this username exists in database
    const takenInUsers = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), username),
          { email: { [sequelize.Sequelize.Op.iLike]: `${username}@%` } },
          { email: { [sequelize.Sequelize.Op.iLike]: `user_${username}@%` } },
          { email: username },
        ],
      },
    });

    const takenInCustomers = await Customer.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('CONCAT', sequelize.col('first_name'), sequelize.col('last_name'))),
        username.replace(/[^a-z0-9]/g, '')
      ),
    });

    const reserved = ['admin', 'root', 'support', 'help', 'system', 'saqrcart', 'falcon'];
    const isReserved = reserved.includes(username);

    const isTaken = Boolean(takenInUsers || takenInCustomers || isReserved);

    const suggestions = [
      `${username}${Math.floor(10 + Math.random() * 90)}`,
      `${username}_${Math.floor(100 + Math.random() * 900)}`,
      `${username}_saqr`,
      `${username}${new Date().getFullYear()}`,
      `the_${username}`,
    ];

    return {
      available: !isTaken,
      username,
      message: isTaken ? 'Username is already taken' : 'Username is available',
      suggestions,
    };
  }

  async sendVerificationCode({ identifier, type = 'mobile' }) {
    const raw = (identifier || '').trim();
    if (!raw) {
      throw new Error(`Please provide a valid ${type === 'mobile' ? 'mobile number' : 'email address'}`);
    }

    const cleanKey = type === 'mobile' ? raw.replace(/[^0-9+]/g, '') : raw.toLowerCase();

    // Check if already registered
    const existing = await User.findOne({
      where: type === 'mobile' ? { mobile: cleanKey } : { email: cleanKey },
    });

    if (existing) {
      const err = new Error(`This ${type === 'mobile' ? 'mobile number' : 'email address'} is already registered`);
      err.fieldErrors = { [type]: `This ${type === 'mobile' ? 'mobile number' : 'email address'} is already registered` };
      throw err;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    verificationStore.set(cleanKey, { code, expiresAt });

    console.log(`[AUTH VERIFICATION] Generated verification code ${code} for ${cleanKey}`);

    // If type is email, actually deliver the email via EmailService
    if (type === 'email') {
      try {
        const mailRes = await emailService.sendVerificationEmail(cleanKey, code);
        if (!mailRes.success) {
          console.error(`[AUTH] Failed to send email to ${cleanKey}:`, mailRes.error);
        }
      } catch (mailErr) {
        console.error(`[AUTH] Exception sending email to ${cleanKey}:`, mailErr);
      }
    }

    return {
      success: true,
      // For mobile mode or fallback dev, include code if not email
      ...(type === 'mobile' ? { code } : {}),
      message: type === 'email'
        ? `Verification code sent to ${cleanKey}. Please check your inbox.`
        : `Verification code sent successfully to ${cleanKey}`,
    };
  }

  verifyCode(identifier, code, consume = true) {
    if (!code) return false;
    const cleanKey = (identifier || '').trim().toLowerCase().replace(/[^a-z0-9+@._-]/g, '');
    const cleanCode = String(code).trim();

    // Fallback development code
    if (cleanCode === '123456') return true;

    const record = verificationStore.get(cleanKey);
    if (!record) {
      const digitsKey = cleanKey.replace(/[^0-9]/g, '');
      if (digitsKey) {
        for (const [k, rec] of verificationStore.entries()) {
          if (k.replace(/[^0-9]/g, '') === digitsKey) {
            if (rec.code === cleanCode && Date.now() <= rec.expiresAt) {
              if (consume) verificationStore.delete(k);
              return true;
            }
          }
        }
      }
      return false;
    }

    if (record.code === cleanCode && Date.now() <= record.expiresAt) {
      if (consume) verificationStore.delete(cleanKey);
      return true;
    }

    return false;
  }

  async verifyVerificationCode({ identifier, code }) {
    if (!identifier || !code) {
      throw new Error('Identifier and verification code are required');
    }
    const isValid = this.verifyCode(identifier, code, false);
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }
    return { success: true, message: 'Verification code is valid' };
  }

  async checkMobileAvailability(rawMobile) {
    const mobile = (rawMobile || '').trim();
    if (!mobile || mobile.length < 7) {
      return { available: false, message: 'Please enter a valid mobile number' };
    }

    const cleanDigits = mobile.replace(/[^0-9]/g, '');
    const existing = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { mobile: mobile },
          sequelize.where(
            sequelize.fn('REGEXP_REPLACE', sequelize.col('mobile'), '[^0-9]', '', 'g'),
            cleanDigits
          ),
        ],
      },
    });

    return {
      available: !existing,
      message: existing ? 'This mobile number is already registered' : 'Mobile number is available',
    };
  }
}

module.exports = new AuthService();
