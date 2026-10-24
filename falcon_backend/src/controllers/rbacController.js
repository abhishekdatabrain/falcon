const rbacService = require('../services/rbacService');
const auditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');

class RbacController {
  async getPermissions(req, res, next) {
    try {
      const data = await rbacService.getAllPermissions();
      return sendSuccess(res, 'Permissions retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getRoles(req, res, next) {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;
      const data = await rbacService.getRoles({ search, page, limit, sortBy, sortOrder });
      return sendSuccess(res, 'Roles retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getRoleById(req, res, next) {
    try {
      const { roleId } = req.params;
      const role = await rbacService.getRoleById(roleId);
      return sendSuccess(res, 'Role retrieved successfully', { role });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async createRole(req, res, next) {
    try {
      const role = await rbacService.createRole(req.body, req.user, req);
      return sendSuccess(res, 'Role created successfully', { role }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const role = await rbacService.updateRole(roleId, req.body, req.user, req);
      return sendSuccess(res, 'Role updated successfully', { role });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const result = await rbacService.deleteRole(roleId, req.user, req);
      return sendSuccess(res, result.message, result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getSubAdmins(req, res, next) {
    try {
      const { search, roleId, status, page, limit, sortBy, sortOrder } = req.query;
      const data = await rbacService.getSubAdmins({ search, roleId, status, page, limit, sortBy, sortOrder });
      return sendSuccess(res, 'Sub-admins retrieved successfully', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getSubAdminById(req, res, next) {
    try {
      const { subAdminId } = req.params;
      const subAdmin = await rbacService.getSubAdminById(subAdminId);
      return sendSuccess(res, 'Sub-admin details retrieved', { subAdmin });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async createSubAdmin(req, res, next) {
    try {
      const subAdmin = await rbacService.createSubAdmin(req.body, req.user, req);
      return sendSuccess(res, 'Sub-admin created successfully', { subAdmin }, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async updateSubAdmin(req, res, next) {
    try {
      const { subAdminId } = req.params;
      const subAdmin = await rbacService.updateSubAdmin(subAdminId, req.body, req.user, req);
      return sendSuccess(res, 'Sub-admin updated successfully', { subAdmin });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async toggleSubAdminStatus(req, res, next) {
    try {
      const { subAdminId } = req.params;
      const { status } = req.body;
      const subAdmin = await rbacService.toggleSubAdminStatus(subAdminId, status, req.user, req);
      return sendSuccess(res, `Sub-admin account status updated to ${status}`, { subAdmin });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async deleteSubAdmin(req, res, next) {
    try {
      const { subAdminId } = req.params;
      const result = await rbacService.deleteSubAdmin(subAdminId, req.user, req);
      return sendSuccess(res, result.message, result);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, module, action, search, startDate, endDate } = req.query;
      const logs = await auditService.getAuditLogs({
        page,
        limit,
        module,
        action,
        search,
        startDate,
        endDate,
      });
      return sendSuccess(res, 'Audit logs retrieved', logs);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  async getMePermissions(req, res, next) {
    try {
      const permissions = req.user.permissions || [];
      const roles = req.user.assigned_roles
        ? req.user.assigned_roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))
        : [];
      const isSuperAdmin = !!req.user.isSuperAdmin;

      return sendSuccess(res, 'Current admin permissions retrieved', {
        id: req.user.id,
        email: req.user.email,
        name: req.user.admin?.name || req.user.email.split('@')[0],
        department: req.user.admin?.department || 'Operations',
        isSuperAdmin,
        roles,
        permissions,
      });
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new RbacController();
