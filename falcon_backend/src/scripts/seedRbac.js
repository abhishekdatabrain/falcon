const { sequelize, User, Role, Permission, RolePermission, AdminUserRole, AuditLog } = require('../models');

const MODULE_DEFINITIONS = [
  {
    module: 'dashboard',
    name: 'Dashboard Overview',
    actions: [
      { action: 'view', name: 'View Dashboard Analytics', desc: 'Can view administrative dashboards and performance metrics' },
      { action: 'export', name: 'Export Dashboard Data', desc: 'Can export dashboard stats, charts, and summary reports' },
    ],
  },
  {
    module: 'products',
    name: 'Product Catalog',
    actions: [
      { action: 'view', name: 'View Products', desc: 'Can view product catalog and details' },
      { action: 'create', name: 'Create Products', desc: 'Can add new products, variants, and specifications' },
      { action: 'edit', name: 'Edit Products', desc: 'Can modify existing products, pricing, and images' },
      { action: 'delete', name: 'Delete Products', desc: 'Can remove products from the catalog' },
      { action: 'export', name: 'Export Products', desc: 'Can export product lists and catalog datasets' },
    ],
  },
  {
    module: 'categories',
    name: 'Category Management',
    actions: [
      { action: 'view', name: 'View Categories', desc: 'Can view category hierarchies and tree' },
      { action: 'create', name: 'Create Categories', desc: 'Can add parent and sub categories' },
      { action: 'edit', name: 'Edit Categories', desc: 'Can edit category details, images, and sorting' },
      { action: 'delete', name: 'Delete Categories', desc: 'Can remove categories' },
      { action: 'export', name: 'Export Categories', desc: 'Can export category structure' },
    ],
  },
  {
    module: 'inventory',
    name: 'Stock & Inventory',
    actions: [
      { action: 'view', name: 'View Inventory', desc: 'Can view warehouse stock levels and thresholds' },
      { action: 'edit', name: 'Adjust Stock', desc: 'Can update inventory levels and record adjustments' },
      { action: 'export', name: 'Export Inventory', desc: 'Can export inventory and stock ledger logs' },
    ],
  },
  {
    module: 'orders',
    name: 'Order Processing',
    actions: [
      { action: 'view', name: 'View Orders', desc: 'Can view customer orders and order histories' },
      { action: 'edit', name: 'Update Order Status', desc: 'Can transition order states (processing, dispatched, etc.)' },
      { action: 'assign', name: 'Assign Order Delivery', desc: 'Can assign drivers and dispatch orders' },
      { action: 'delete', name: 'Cancel Orders', desc: 'Can cancel customer orders' },
      { action: 'export', name: 'Export Orders', desc: 'Can export order manifests and invoices' },
    ],
  },
  {
    module: 'payments',
    name: 'Payment Reconciliation',
    actions: [
      { action: 'view', name: 'View Payments', desc: 'Can view bank transfers, receipts, and transactions' },
      { action: 'approve', name: 'Approve Payments', desc: 'Can verify receipts and approve manual transfers' },
      { action: 'export', name: 'Export Payments', desc: 'Can export payment reports and settlement logs' },
    ],
  },
  {
    module: 'refunds',
    name: 'Refund Management',
    actions: [
      { action: 'view', name: 'View Refunds', desc: 'Can view refund requests and processed refunds' },
      { action: 'approve', name: 'Approve Refund Requests', desc: 'Can review and accept customer refund requests' },
      { action: 'refund', name: 'Execute Refunds', desc: 'Can disburse financial refunds back to customers' },
      { action: 'export', name: 'Export Refunds', desc: 'Can export refund records and credit memos' },
    ],
  },
  {
    module: 'delivery',
    name: 'Delivery & Logistics',
    actions: [
      { action: 'view', name: 'View Deliveries', desc: 'Can track live deliveries, routes, and slots' },
      { action: 'assign', name: 'Dispatch & Assign Deliveries', desc: 'Can allocate orders to delivery runs' },
      { action: 'edit', name: 'Update Delivery Status', desc: 'Can adjust delivery slots and delivery milestones' },
      { action: 'export', name: 'Export Delivery Runs', desc: 'Can export driver delivery sheets' },
    ],
  },
  {
    module: 'drivers',
    name: 'Driver Fleet',
    actions: [
      { action: 'view', name: 'View Drivers', desc: 'Can inspect driver profiles, documents, and GPS' },
      { action: 'create', name: 'Create Drivers', desc: 'Can register new fleet drivers' },
      { action: 'edit', name: 'Edit Drivers', desc: 'Can modify driver accounts, vehicles, and status' },
      { action: 'delete', name: 'Deactivate / Remove Drivers', desc: 'Can deactivate or delete driver profiles' },
      { action: 'export', name: 'Export Driver Fleet', desc: 'Can export driver lists and performance data' },
    ],
  },
  {
    module: 'customers',
    name: 'Customer Management',
    actions: [
      { action: 'view', name: 'View Customers', desc: 'Can view customer profiles, order history, and addresses' },
      { action: 'create', name: 'Create Customers', desc: 'Can register customer accounts' },
      { action: 'edit', name: 'Edit Customers', desc: 'Can update customer info and toggle account status' },
      { action: 'delete', name: 'Delete Customers', desc: 'Can remove customer accounts' },
      { action: 'export', name: 'Export Customer Directory', desc: 'Can export customer databases' },
    ],
  },
  {
    module: 'invoices',
    name: 'Tax Invoices',
    actions: [
      { action: 'view', name: 'View Invoices', desc: 'Can inspect tax invoices and debit/credit notes' },
      { action: 'create', name: 'Generate Invoices & Credit Notes', desc: 'Can generate official invoices and credit notes' },
      { action: 'export', name: 'Download / Export Invoices', desc: 'Can export PDF and XML invoice batches' },
    ],
  },
  {
    module: 'zatca',
    name: 'ZATCA Compliance',
    actions: [
      { action: 'view', name: 'View ZATCA Status', desc: 'Can monitor phase 2 e-invoicing compliance and clearance logs' },
      { action: 'create', name: 'Report / Submit to ZATCA', desc: 'Can transmit compliance requests and re-try sync' },
      { action: 'export', name: 'Export ZATCA Audit Reports', desc: 'Can export compliance documentation and cryptographic hashes' },
    ],
  },
  {
    module: 'cms',
    name: 'Content & CMS',
    actions: [
      { action: 'view', name: 'View Homepage CMS', desc: 'Can view homepage layout and configured sections' },
      { action: 'create', name: 'Create CMS Sections', desc: 'Can create new homepage sections and showcases' },
      { action: 'edit', name: 'Edit CMS Content', desc: 'Can reorder sections and update promo cards' },
      { action: 'delete', name: 'Delete CMS Sections', desc: 'Can delete CMS sections' },
    ],
  },
  {
    module: 'banners',
    name: 'Hero & Promo Banners',
    actions: [
      { action: 'view', name: 'View Banners', desc: 'Can preview hero banners and promotional creatives' },
      { action: 'create', name: 'Create Banners', desc: 'Can upload and publish new banners' },
      { action: 'edit', name: 'Edit Banners', desc: 'Can modify banner scheduling, links, and order' },
      { action: 'delete', name: 'Delete Banners', desc: 'Can remove banners' },
    ],
  },
  {
    module: 'reports',
    name: 'Reports & Analytics',
    actions: [
      { action: 'view', name: 'View Reports', desc: 'Can view sales, customer acquisition, and accounting reports' },
      { action: 'export', name: 'Export Analytics', desc: 'Can download CSV/Excel reports' },
    ],
  },
  {
    module: 'admin_management',
    name: 'Role & Admin Management',
    actions: [
      { action: 'view', name: 'View Roles & Sub-Admins', desc: 'Can view admin users, custom roles, and permission matrix' },
      { action: 'create', name: 'Create Roles & Sub-Admins', desc: 'Can add custom roles and create new Sub-Admin accounts' },
      { action: 'edit', name: 'Edit Roles & Sub-Admins', desc: 'Can update roles, change permissions, and toggle account status' },
      { action: 'delete', name: 'Delete Roles & Sub-Admins', desc: 'Can delete custom roles and remove sub-admin accounts' },
      { action: 'assign', name: 'Assign Roles to Admins', desc: 'Can assign or revoke roles from sub-admins' },
    ],
  },
  {
    module: 'coupons',
    name: 'Coupons & Discounts',
    actions: [
      { action: 'view', name: 'View Coupons', desc: 'Can view promo coupons and discount rules' },
      { action: 'create', name: 'Create Coupons', desc: 'Can add new coupon codes and discounts' },
      { action: 'edit', name: 'Edit Coupons', desc: 'Can modify discounts, validity, and limits' },
      { action: 'delete', name: 'Delete Coupons', desc: 'Can remove promotional coupons' },
    ],
  },
  {
    module: 'feedback',
    name: 'Customer Feedback',
    actions: [
      { action: 'view', name: 'View Feedback', desc: 'Can view customer reviews and feedback ratings' },
      { action: 'delete', name: 'Delete Feedback', desc: 'Can moderate and remove customer feedback' },
    ],
  },
  {
    module: 'notifications',
    name: 'Push & Admin Notifications',
    actions: [
      { action: 'view', name: 'View Notifications', desc: 'Can view notifications stream' },
      { action: 'create', name: 'Send Notifications', desc: 'Can broadcast push alerts to customers and drivers' },
      { action: 'delete', name: 'Delete Notifications', desc: 'Can delete notification logs' },
    ],
  },
];

async function seedRbac() {
  console.log('🔄 Initializing RBAC Tables...');
  
  // Create tables if not exist
  await Role.sync();
  await Permission.sync();
  await RolePermission.sync();
  await AdminUserRole.sync();
  await AuditLog.sync();
  console.log('✅ RBAC Tables synced.');

  // Upsert all permissions
  console.log('🔄 Seeding Permissions...');
  const allPermissions = [];
  for (const mod of MODULE_DEFINITIONS) {
    for (const act of mod.actions) {
      const code = `${mod.module}.${act.action}`;
      const [perm] = await Permission.findOrCreate({
        where: { code },
        defaults: {
          module: mod.module,
          action: act.action,
          name: `${mod.name} - ${act.name}`,
          description: act.desc,
        },
      });
      allPermissions.push(perm);
    }
  }
  console.log(`✅ ${allPermissions.length} Permissions ensured in database.`);

  // Create or update Super Admin Role
  const [superAdminRole] = await Role.findOrCreate({
    where: { slug: 'super_admin' },
    defaults: {
      name: 'Super Admin',
      description: 'Full unconstrained system authority over all modules and settings.',
      is_system: true,
      is_active: true,
    },
  });

  // Attach all permissions to Super Admin role
  await superAdminRole.setPermissions(allPermissions);
  console.log('✅ Super Admin role granted all permissions.');

  // Seed standard business roles
  const standardRoles = [
    {
      slug: 'admin',
      name: 'Admin',
      description: 'Configurable operational access across core store modules.',
      is_system: false,
      filterModules: [
        'dashboard',
        'products',
        'categories',
        'inventory',
        'orders',
        'payments',
        'refunds',
        'delivery',
        'drivers',
        'customers',
        'invoices',
        'zatca',
        'cms',
        'banners',
        'reports',
        'coupons',
        'feedback',
        'notifications',
      ],
      excludeActions: ['delete'],
    },
    {
      slug: 'product_manager',
      name: 'Product Manager',
      description: 'Manages products catalog, categories taxonomy, and stock inventory.',
      is_system: false,
      filterModules: ['dashboard', 'products', 'categories', 'inventory'],
    },
    {
      slug: 'order_manager',
      name: 'Order Manager',
      description: 'Supervises incoming orders, payment confirmations, and delivery fulfillment.',
      is_system: false,
      filterModules: ['dashboard', 'orders', 'payments', 'delivery', 'refunds'],
    },
    {
      slug: 'delivery_manager',
      name: 'Delivery Manager',
      description: 'Oversees delivery logistics, time slots, driver fleet, and dispatching.',
      is_system: false,
      filterModules: ['dashboard', 'delivery', 'drivers'],
    },
    {
      slug: 'staff',
      name: 'Staff',
      description: 'Limited operational view-only access across orders and catalog.',
      is_system: false,
      filterModules: ['dashboard', 'products', 'orders', 'customers'],
      allowedActions: ['view'],
    },
    {
      slug: 'store_manager',
      name: 'Store Manager',
      description: 'Manages catalog, inventory, order processing, and homepage showcase.',
      is_system: false,
      filterModules: ['dashboard', 'products', 'categories', 'inventory', 'orders', 'cms', 'banners'],
    },
    {
      slug: 'finance_officer',
      name: 'Finance & Accounts Officer',
      description: 'Handles payment verification, refunds, tax invoicing, and ZATCA compliance.',
      is_system: false,
      filterModules: ['dashboard', 'orders', 'payments', 'refunds', 'invoices', 'zatca', 'reports'],
    },
    {
      slug: 'delivery_dispatcher',
      name: 'Logistics & Fleet Dispatcher',
      description: 'Coordinates drivers, schedules delivery runs, and monitors live fulfillment.',
      is_system: false,
      filterModules: ['dashboard', 'orders', 'delivery', 'drivers'],
    },
    {
      slug: 'customer_support',
      name: 'Customer Support Representative',
      description: 'Resolves customer issues, checks order status, and submits refund requests.',
      is_system: false,
      filterModules: ['dashboard', 'orders', 'customers', 'refunds'],
      excludeActions: ['refund', 'delete'],
    },
  ];

  for (const roleDef of standardRoles) {
    const [role] = await Role.findOrCreate({
      where: { slug: roleDef.slug },
      defaults: {
        name: roleDef.name,
        description: roleDef.description,
        is_system: roleDef.is_system,
        is_active: true,
      },
    });

    const rolePerms = allPermissions.filter((p) => {
      if (!roleDef.filterModules.includes(p.module)) return false;
      if (roleDef.allowedActions && !roleDef.allowedActions.includes(p.action)) return false;
      if (roleDef.excludeActions && roleDef.excludeActions.includes(p.action)) return false;
      return true;
    });

    await role.setPermissions(rolePerms);
    console.log(`✅ Role "${roleDef.name}" configured with ${rolePerms.length} permissions.`);
  }

  // Target intended Super Admin accounts safely without granting Super Admin to every admin
  const targetSuperAdminEmails = (
    process.env.SUPER_ADMIN_EMAILS
      ? process.env.SUPER_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
      : ['admin@platform.com', 'admin@gmail.com']
  );

  if (process.argv[2] && process.argv[2].includes('@')) {
    targetSuperAdminEmails.push(process.argv[2].trim().toLowerCase());
  }

  console.log(`🎯 Ensuring Super Admin role for designated administrators: ${targetSuperAdminEmails.join(', ')}`);

  for (const email of targetSuperAdminEmails) {
    const adminUser = await User.findOne({ where: { email, role: 'ADMIN' } });
    if (adminUser) {
      const existingAssignment = await AdminUserRole.findOne({
        where: { user_id: adminUser.id },
      });

      if (!existingAssignment) {
        await AdminUserRole.create({
          user_id: adminUser.id,
          role_id: superAdminRole.id,
        });
        console.log(`👑 Assigned Super Admin role to designated administrator: ${adminUser.email} (${adminUser.id}).`);
      } else if (existingAssignment.role_id !== superAdminRole.id) {
        // Upgrade designated super admin account to super_admin role
        await existingAssignment.update({ role_id: superAdminRole.id });
        console.log(`👑 Upgraded administrator ${adminUser.email} to Super Admin role.`);
      } else {
        console.log(`✓ Administrator ${adminUser.email} already correctly configured with Super Admin role.`);
      }
    } else {
      console.log(`ℹ️ Account ${email} not found in this database; skipped.`);
    }
  }

  console.log('🎉 RBAC Seeding Completed Successfully!');
}

if (require.main === module) {
  seedRbac()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ RBAC Seed Error:', err);
      process.exit(1);
    });
}

module.exports = { seedRbac, MODULE_DEFINITIONS };
