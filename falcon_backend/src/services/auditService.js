const { AuditLog, User, Admin } = require('../models');
const { Op } = require('sequelize');

class AuditService {
  /**
   * Log an administrative or sensitive action
   */
  async log({
    req = null,
    userId = null,
    adminName = 'System',
    adminEmail = null,
    action,
    module,
    entityType = null,
    entityId = null,
    details = null,
  }) {
    try {
      let finalUserId = userId;
      let finalAdminName = adminName;
      let finalAdminEmail = adminEmail;
      let ipAddress = null;
      let userAgent = null;

      if (req) {
        ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
        userAgent = req.headers['user-agent'] || null;

        if (req.user) {
          finalUserId = finalUserId || req.user.id;
          finalAdminEmail = finalAdminEmail || req.user.email;
          finalAdminName =
            finalAdminName !== 'System'
              ? finalAdminName
              : req.user.admin?.name || req.user.name || req.user.email?.split('@')[0] || 'Admin';
        }
      }

      const logEntry = await AuditLog.create({
        user_id: finalUserId,
        admin_name: finalAdminName,
        admin_email: finalAdminEmail,
        action,
        module,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        details: details ? (typeof details === 'object' ? details : { info: details }) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return logEntry;
    } catch (error) {
      console.error('⚠️ [AuditLog Error] Failed to write audit record:', error.message);
      return null;
    }
  }

  /**
   * Query audit logs with pagination and filters
   */
  async getAuditLogs({ page = 1, limit = 20, module, action, search, startDate, endDate }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const where = {};

    if (module && module !== 'all') {
      where.module = module;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (search) {
      where[Op.or] = [
        { admin_name: { [Op.iLike]: `%${search}%` } },
        { admin_email: { [Op.iLike]: `%${search}%` } },
        { action: { [Op.iLike]: `%${search}%` } },
        { entity_type: { [Op.iLike]: `%${search}%` } },
        { entity_id: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      logs: rows,
    };
  }
}

module.exports = new AuditService();
