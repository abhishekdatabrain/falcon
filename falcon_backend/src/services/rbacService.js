const { sequelize, User, Admin, Role, Permission, RolePermission, AdminUserRole, AuditLog } = require('../models');
const { hashPassword } = require('../utils/password');
const auditService = require('./auditService');
const { Op } = require('sequelize');

class RbacService {
  /**
   * Get all system permissions grouped by module
   */
  async getAllPermissions() {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']],
    });

    // Group by module for clean permission matrix in UI
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return {
      all: permissions,
      grouped,
    };
  }

  /**
   * Get all roles with permission count and assigned user count
   */
  async getRoles() {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['id', 'email', 'status'],
        },
      ],
      order: [['is_system', 'DESC'], ['name', 'ASC']],
    });

    return roles.map((role) => {
      const r = role.toJSON();
      return {
        ...r,
        permissionsCount: r.permissions ? r.permissions.length : 0,
        usersCount: r.users ? r.users.length : 0,
      };
    });
  }

  /**
   * Get a single role by ID with permissions
   */
  async getRoleById(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  /**
   * Create a new custom role
   */
  async createRole(data, adminUser, req = null) {
    const { name, description, permissionCodes = [], permissionIds = [] } = data;

    if (!name || !name.trim()) {
      throw new Error('Role name is required');
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const existing = await Role.findOne({ where: { slug } });
    if (existing) {
      throw new Error(`A role with name "${name}" or slug "${slug}" already exists`);
    }

    // Resolve permissions to attach
    let permissionsToAssign = [];
    if (permissionCodes && permissionCodes.length > 0) {
      permissionsToAssign = await Permission.findAll({
        where: { code: { [Op.in]: permissionCodes } },
      });
    } else if (permissionIds && permissionIds.length > 0) {
      permissionsToAssign = await Permission.findAll({
        where: { id: { [Op.in]: permissionIds } },
      });
    }

    // Requirement 11: Sub Admins cannot grant permissions they do not have
    if (!adminUser.isSuperAdmin) {
      const allowedCodes = new Set(adminUser.permissions || []);
      const unauthorizedPerms = permissionsToAssign.filter((p) => !allowedCodes.has(p.code));
      if (unauthorizedPerms.length > 0) {
        throw new Error(
          `You cannot grant permissions you do not possess: ${unauthorizedPerms.map((p) => p.code).join(', ')}`
        );
      }
    }

    const createdRole = await sequelize.transaction(async (t) => {
      const role = await Role.create(
        {
          name: name.trim(),
          slug,
          description: description || null,
          is_system: false,
          is_active: true,
        },
        { transaction: t }
      );

      if (permissionsToAssign.length > 0) {
        await role.setPermissions(permissionsToAssign, { transaction: t });
      }

      return role;
    });

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_ROLE',
      module: 'admin_management',
      entityType: 'Role',
      entityId: createdRole.id,
      details: {
        roleName: createdRole.name,
        slug: createdRole.slug,
        permissionCount: permissionsToAssign.length,
      },
    });

    return await this.getRoleById(createdRole.id);
  }

  /**
   * Update role information and permission matrix
   */
  async updateRole(roleId, data, adminUser, req = null) {
    const { name, description, is_active, permissionCodes, permissionIds } = data;

    const role = await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissions' }],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent non-super admin from modifying super_admin role
    if (role.slug === 'super_admin' && !adminUser.isSuperAdmin) {
      throw new Error('Only Super Admin can edit the Super Admin role');
    }

    // System roles name / slug cannot be modified
    const updatePayload = {};
    if (name && !role.is_system) {
      updatePayload.name = name.trim();
    }
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (is_active !== undefined && !role.is_system) {
      updatePayload.is_active = Boolean(is_active);
    }

    // If permission changes provided
    let permissionsToAssign = null;
    if (permissionCodes !== undefined) {
      permissionsToAssign = await Permission.findAll({
        where: { code: { [Op.in]: permissionCodes } },
      });
    } else if (permissionIds !== undefined) {
      permissionsToAssign = await Permission.findAll({
        where: { id: { [Op.in]: permissionIds } },
      });
    }

    // Requirement 11: Sub Admins cannot grant permissions they do not have
    if (permissionsToAssign && !adminUser.isSuperAdmin) {
      const allowedCodes = new Set(adminUser.permissions || []);
      const unauthorizedPerms = permissionsToAssign.filter((p) => !allowedCodes.has(p.code));
      if (unauthorizedPerms.length > 0) {
        throw new Error(
          `You cannot grant permissions you do not possess: ${unauthorizedPerms.map((p) => p.code).join(', ')}`
        );
      }
    }

    await sequelize.transaction(async (t) => {
      if (Object.keys(updatePayload).length > 0) {
        await role.update(updatePayload, { transaction: t });
      }

      // If this is super_admin, do not strip permissions
      if (role.slug === 'super_admin') {
        const all = await Permission.findAll({ transaction: t });
        await role.setPermissions(all, { transaction: t });
      } else if (permissionsToAssign !== null) {
        await role.setPermissions(permissionsToAssign, { transaction: t });
      }
    });

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_ROLE',
      module: 'admin_management',
      entityType: 'Role',
      entityId: role.id,
      details: {
        roleName: role.name,
        slug: role.slug,
        permissionCount: permissionsToAssign ? permissionsToAssign.length : role.permissions.length,
        updatedFields: Object.keys(updatePayload),
      },
    });

    return await this.getRoleById(role.id);
  }

  /**
   * Delete custom role
   */
  async deleteRole(roleId, adminUser, req = null) {
    const role = await Role.findByPk(roleId, {
      include: [{ model: User, as: 'users' }],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.is_system || role.slug === 'super_admin') {
      throw new Error('System-defined roles cannot be deleted');
    }

    if (role.users && role.users.length > 0) {
      throw new Error(
        `Cannot delete role "${role.name}" because it is currently assigned to ${role.users.length} admin user(s). Reassign them first.`
      );
    }

    const roleName = role.name;
    await role.destroy();

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'DELETE_ROLE',
      module: 'admin_management',
      entityType: 'Role',
      entityId: roleId,
      details: { roleName },
    });

    return { message: `Role "${roleName}" successfully removed` };
  }

  /**
   * Get all Sub-Admin users
   */
  async getSubAdmins(options = {}) {
    const { search, roleId, status } = options;

    const where = { role: 'ADMIN' };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { email: { [Op.iLike]: q } },
        { mobile: { [Op.iLike]: q } },
      ];
    }

    const roleInclude = {
      model: Role,
      as: 'assigned_roles',
      through: { attributes: [] },
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    };

    if (roleId && roleId !== 'ALL') {
      roleInclude.where = { id: roleId };
      roleInclude.required = true;
    }

    const users = await User.findAll({
      where,
      include: [
        { model: Admin, as: 'admin' },
        roleInclude,
      ],
      order: [['createdAt', 'DESC']],
    });

    return users.map((u) => {
      const json = u.toJSON();
      const isSuper = Boolean(
        json.assigned_roles && json.assigned_roles.some((r) => r.slug === 'super_admin')
      );

      return {
        id: json.id,
        email: json.email,
        mobile: json.mobile,
        status: json.status,
        name: json.admin?.name || json.email.split('@')[0],
        department: json.admin?.department || 'Operations',
        isSuperAdmin: isSuper,
        roles: json.assigned_roles || [],
        assigned_role: json.assigned_roles?.[0] || null,
        admin_profile: {
          name: json.admin?.name || json.email.split('@')[0],
          department: json.admin?.department || 'Operations',
        },
        createdAt: json.createdAt,
      };
    });
  }

  /**
   * Create new Sub-Admin user
   */
  async createSubAdmin(data, adminUser, req = null) {
    const { email, mobile, password, name, department, roleId } = data;

    if (!email || !mobile || !password || !name) {
      throw new Error('Name, Email, Mobile number, and Password are required');
    }

    // Check duplicate
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }],
      },
    });

    if (existing) {
      throw new Error('An account with this email or mobile number already exists');
    }

    // Validate role
    let targetRole = null;
    if (roleId) {
      targetRole = await Role.findByPk(roleId);
      if (!targetRole) {
        throw new Error('Selected role not found');
      }

      // Requirement 11: Non-super admins cannot grant Super Admin role
      if (targetRole.slug === 'super_admin' && !adminUser.isSuperAdmin) {
        throw new Error('Only Super Admin can assign the Super Admin role');
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await sequelize.transaction(async (t) => {
      const user = await User.create(
        {
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          password_hash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        { transaction: t }
      );

      await Admin.create(
        {
          user_id: user.id,
          name: name.trim(),
          department: department ? department.trim() : 'Operations',
        },
        { transaction: t }
      );

      if (targetRole) {
        await AdminUserRole.create(
          {
            user_id: user.id,
            role_id: targetRole.id,
            assigned_by: adminUser.id,
          },
          { transaction: t }
        );
      }

      return user;
    });

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_SUB_ADMIN',
      module: 'admin_management',
      entityType: 'User',
      entityId: newUser.id,
      details: {
        email: newUser.email,
        name,
        assignedRole: targetRole ? targetRole.name : 'None',
      },
    });

    return await this.getSubAdminById(newUser.id);
  }

  /**
   * Get single Sub Admin by user ID
   */
  async getSubAdminById(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Admin, as: 'admin' },
        {
          model: Role,
          as: 'assigned_roles',
          through: { attributes: [] },
          include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
        },
      ],
    });

    if (!user) throw new Error('Sub-Admin user not found');

    const json = user.toJSON();
    const isSuper = Boolean(
      json.assigned_roles && json.assigned_roles.some((r) => r.slug === 'super_admin')
    );

    return {
      id: json.id,
      email: json.email,
      mobile: json.mobile,
      status: json.status,
      name: json.admin?.name || json.email.split('@')[0],
      department: json.admin?.department || 'Operations',
      isSuperAdmin: isSuper,
      roles: json.assigned_roles || [],
      assigned_role: json.assigned_roles?.[0] || null,
      admin_profile: {
        name: json.admin?.name || json.email.split('@')[0],
        department: json.admin?.department || 'Operations',
      },
      createdAt: json.createdAt,
    };
  }

  /**
   * Update Sub-Admin user
   */
  async updateSubAdmin(userId, data, adminUser, req = null) {
    const { name, department, email, mobile, password, roleId } = data;

    const user = await User.findByPk(userId, {
      include: [
        { model: Admin, as: 'admin' },
        { model: Role, as: 'assigned_roles' },
      ],
    });

    if (!user) throw new Error('Sub-Admin user not found');

    const isTargetSuperAdmin = Boolean(
      user.assigned_roles && user.assigned_roles.some((r) => r.slug === 'super_admin')
    );

    // Requirement 11: Sub Admins cannot modify Super Admin accounts
    if (isTargetSuperAdmin && !adminUser.isSuperAdmin) {
      throw new Error('Only Super Admin is authorized to modify Super Admin accounts');
    }

    // Check duplicate email/mobile if changing
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const dup = await User.findOne({ where: { email: email.toLowerCase() } });
      if (dup) throw new Error('Email address is already in use by another account');
    }
    if (mobile && mobile !== user.mobile) {
      const dup = await User.findOne({ where: { mobile } });
      if (dup) throw new Error('Mobile number is already in use by another account');
    }

    let targetRole = null;
    if (roleId) {
      targetRole = await Role.findByPk(roleId);
      if (!targetRole) throw new Error('Selected role not found');

      // Requirement 11: Non-super admin cannot grant Super Admin role
      if (targetRole.slug === 'super_admin' && !adminUser.isSuperAdmin) {
        throw new Error('Only Super Admin can assign the Super Admin role');
      }
    }

    await sequelize.transaction(async (t) => {
      const userUpdates = {};
      if (email) userUpdates.email = email.trim().toLowerCase();
      if (mobile) userUpdates.mobile = mobile.trim();
      if (password && password.trim()) {
        userUpdates.password_hash = await hashPassword(password);
      }

      if (Object.keys(userUpdates).length > 0) {
        await user.update(userUpdates, { transaction: t });
      }

      if (user.admin) {
        await user.admin.update(
          {
            name: name !== undefined ? name.trim() : user.admin.name,
            department: department !== undefined ? department.trim() : user.admin.department,
          },
          { transaction: t }
        );
      }

      // Update role assignment if roleId provided
      if (roleId) {
        // Prevent removing super_admin if this would leave zero super admins
        const isCurrentSuper = user.assigned_roles && user.assigned_roles.some((r) => r.slug === 'super_admin');
        if (isCurrentSuper && targetRole.slug !== 'super_admin') {
          const superRole = await Role.findOne({ where: { slug: 'super_admin' } });
          if (superRole) {
            const superAdminCount = await AdminUserRole.count({ where: { role_id: superRole.id } });
            if (superAdminCount <= 1) {
              throw new Error('Cannot remove Super Admin role: at least one Super Admin must remain in the system');
            }
          }
        }

        // Remove old role assignments
        await AdminUserRole.destroy({ where: { user_id: user.id }, transaction: t });
        // Assign new role
        await AdminUserRole.create(
          {
            user_id: user.id,
            role_id: targetRole.id,
            assigned_by: adminUser.id,
          },
          { transaction: t }
        );
      }
    });

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_SUB_ADMIN',
      module: 'admin_management',
      entityType: 'User',
      entityId: user.id,
      details: {
        updatedSubAdmin: user.email,
        assignedRole: targetRole ? targetRole.name : 'Unchanged',
      },
    });

    return await this.getSubAdminById(user.id);
  }

  /**
   * Toggle Sub-Admin active/inactive status
   */
  async toggleSubAdminStatus(userId, status, adminUser, req = null) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status must be ACTIVE or INACTIVE');
    }

    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'assigned_roles' }],
    });
    if (!user) throw new Error('Sub-Admin user not found');

    const isTargetSuper = Boolean(
      user.assigned_roles && user.assigned_roles.some((r) => r.slug === 'super_admin')
    );

    // Prevent deactivating root or super admin
    if (isTargetSuper && status === 'INACTIVE') {
      throw new Error('Super Admin accounts cannot be deactivated');
    }

    // Requirement 11: Sub Admins cannot modify Super Admin accounts
    if (isTargetSuper && !adminUser.isSuperAdmin) {
      throw new Error('Only Super Admin is authorized to modify Super Admin accounts');
    }

    await user.update({ status });

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'TOGGLE_SUB_ADMIN_STATUS',
      module: 'admin_management',
      entityType: 'User',
      entityId: user.id,
      details: { subAdminEmail: user.email, newStatus: status },
    });

    return await this.getSubAdminById(user.id);
  }

  /**
   * Delete Sub-Admin account
   */
  async deleteSubAdmin(userId, adminUser, req = null) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'assigned_roles' }],
    });
    if (!user) throw new Error('Sub-Admin user not found');

    const isTargetSuper = Boolean(
      user.assigned_roles && user.assigned_roles.some((r) => r.slug === 'super_admin')
    );

    if (isTargetSuper) {
      throw new Error('Super Admin accounts cannot be deleted');
    }

    if (!adminUser.isSuperAdmin) {
      throw new Error('Only Super Admin has authority to delete administrative accounts');
    }

    const deletedEmail = user.email;
    await user.destroy();

    // Audit log
    await auditService.log({
      req,
      userId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'DELETE_SUB_ADMIN',
      module: 'admin_management',
      entityType: 'User',
      entityId: userId,
      details: { deletedEmail },
    });

    return { message: `Sub-Admin account for ${deletedEmail} deleted successfully` };
  }
}

module.exports = new RbacService();
