-- =============================================================================
-- FALCON FRESH E-COMMERCE: PRODUCTION SUPER ADMIN RBAC REPAIR & SEED SCRIPT
-- Target Database: falcon (PostgreSQL on VPS)
-- Intended Super Admin: admin@platform.com
-- Safe & Idempotent: Can be run multiple times safely without data loss
-- =============================================================================

BEGIN;

-- Step 0: Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Ensure RBAC tables exist
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Ensure all system permissions exist
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'dashboard', 'view', 'dashboard.view', 'Dashboard Overview - View Dashboard Analytics', 'Can view administrative dashboards and performance metrics', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'dashboard', 'export', 'dashboard.export', 'Dashboard Overview - Export Dashboard Data', 'Can export dashboard stats, charts, and summary reports', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'products', 'view', 'products.view', 'Product Catalog - View Products', 'Can view product catalog and details', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'products', 'create', 'products.create', 'Product Catalog - Create Products', 'Can add new products, variants, and specifications', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'products', 'edit', 'products.edit', 'Product Catalog - Edit Products', 'Can modify existing products, pricing, and images', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'products', 'delete', 'products.delete', 'Product Catalog - Delete Products', 'Can remove products from the catalog', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'products', 'export', 'products.export', 'Product Catalog - Export Products', 'Can export product lists and catalog datasets', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'categories', 'view', 'categories.view', 'Category Management - View Categories', 'Can view category hierarchies and tree', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'categories', 'create', 'categories.create', 'Category Management - Create Categories', 'Can add parent and sub categories', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'categories', 'edit', 'categories.edit', 'Category Management - Edit Categories', 'Can edit category details, images, and sorting', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'categories', 'delete', 'categories.delete', 'Category Management - Delete Categories', 'Can remove categories', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'categories', 'export', 'categories.export', 'Category Management - Export Categories', 'Can export category structure', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'inventory', 'view', 'inventory.view', 'Stock & Inventory - View Inventory', 'Can view warehouse stock levels and thresholds', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'inventory', 'edit', 'inventory.edit', 'Stock & Inventory - Adjust Stock', 'Can update inventory levels and record adjustments', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'inventory', 'export', 'inventory.export', 'Stock & Inventory - Export Inventory', 'Can export inventory and stock ledger logs', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'orders', 'view', 'orders.view', 'Order Processing - View Orders', 'Can view customer orders and order histories', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'orders', 'edit', 'orders.edit', 'Order Processing - Update Order Status', 'Can transition order states (processing, dispatched, etc.)', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'orders', 'assign', 'orders.assign', 'Order Processing - Assign Order Delivery', 'Can assign drivers and dispatch orders', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'orders', 'delete', 'orders.delete', 'Order Processing - Cancel Orders', 'Can cancel customer orders', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'orders', 'export', 'orders.export', 'Order Processing - Export Orders', 'Can export order manifests and invoices', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'payments', 'view', 'payments.view', 'Payment Reconciliation - View Payments', 'Can view bank transfers, receipts, and transactions', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'payments', 'approve', 'payments.approve', 'Payment Reconciliation - Approve Payments', 'Can verify receipts and approve manual transfers', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'payments', 'export', 'payments.export', 'Payment Reconciliation - Export Payments', 'Can export payment reports and settlement logs', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'refunds', 'view', 'refunds.view', 'Refund Management - View Refunds', 'Can view refund requests and processed refunds', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'refunds', 'approve', 'refunds.approve', 'Refund Management - Approve Refund Requests', 'Can review and accept customer refund requests', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'refunds', 'refund', 'refunds.refund', 'Refund Management - Execute Refunds', 'Can disburse financial refunds back to customers', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'refunds', 'export', 'refunds.export', 'Refund Management - Export Refunds', 'Can export refund records and credit memos', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'delivery', 'view', 'delivery.view', 'Delivery & Logistics - View Deliveries', 'Can track live deliveries, routes, and slots', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'delivery', 'assign', 'delivery.assign', 'Delivery & Logistics - Dispatch & Assign Deliveries', 'Can allocate orders to delivery runs', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'delivery', 'edit', 'delivery.edit', 'Delivery & Logistics - Update Delivery Status', 'Can adjust delivery slots and delivery milestones', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'delivery', 'export', 'delivery.export', 'Delivery & Logistics - Export Delivery Runs', 'Can export driver delivery sheets', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'drivers', 'view', 'drivers.view', 'Driver Fleet - View Drivers', 'Can inspect driver profiles, documents, and GPS', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'drivers', 'create', 'drivers.create', 'Driver Fleet - Create Drivers', 'Can register new fleet drivers', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'drivers', 'edit', 'drivers.edit', 'Driver Fleet - Edit Drivers', 'Can modify driver accounts, vehicles, and status', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'drivers', 'delete', 'drivers.delete', 'Driver Fleet - Deactivate / Remove Drivers', 'Can deactivate or delete driver profiles', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'drivers', 'export', 'drivers.export', 'Driver Fleet - Export Driver Fleet', 'Can export driver lists and performance data', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'customers', 'view', 'customers.view', 'Customer Management - View Customers', 'Can view customer profiles, order history, and addresses', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'customers', 'create', 'customers.create', 'Customer Management - Create Customers', 'Can register customer accounts', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'customers', 'edit', 'customers.edit', 'Customer Management - Edit Customers', 'Can update customer info and toggle account status', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'customers', 'delete', 'customers.delete', 'Customer Management - Delete Customers', 'Can remove customer accounts', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'customers', 'export', 'customers.export', 'Customer Management - Export Customer Directory', 'Can export customer databases', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'invoices', 'view', 'invoices.view', 'Tax Invoices - View Invoices', 'Can inspect tax invoices and debit/credit notes', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'invoices', 'create', 'invoices.create', 'Tax Invoices - Generate Invoices & Credit Notes', 'Can generate official invoices and credit notes', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'invoices', 'export', 'invoices.export', 'Tax Invoices - Download / Export Invoices', 'Can export PDF and XML invoice batches', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'zatca', 'view', 'zatca.view', 'ZATCA Compliance - View ZATCA Status', 'Can monitor phase 2 e-invoicing compliance and clearance logs', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'zatca', 'create', 'zatca.create', 'ZATCA Compliance - Report / Submit to ZATCA', 'Can transmit compliance requests and re-try sync', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'zatca', 'export', 'zatca.export', 'ZATCA Compliance - Export ZATCA Audit Reports', 'Can export compliance documentation and cryptographic hashes', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'cms', 'view', 'cms.view', 'Content & CMS - View Homepage CMS', 'Can view homepage layout and configured sections', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'cms', 'create', 'cms.create', 'Content & CMS - Create CMS Sections', 'Can create new homepage sections and showcases', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'cms', 'edit', 'cms.edit', 'Content & CMS - Edit CMS Content', 'Can reorder sections and update promo cards', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'cms', 'delete', 'cms.delete', 'Content & CMS - Delete CMS Sections', 'Can delete CMS sections', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'banners', 'view', 'banners.view', 'Hero & Promo Banners - View Banners', 'Can preview hero banners and promotional creatives', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'banners', 'create', 'banners.create', 'Hero & Promo Banners - Create Banners', 'Can upload and publish new banners', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'banners', 'edit', 'banners.edit', 'Hero & Promo Banners - Edit Banners', 'Can modify banner scheduling, links, and order', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'banners', 'delete', 'banners.delete', 'Hero & Promo Banners - Delete Banners', 'Can remove banners', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'reports', 'view', 'reports.view', 'Reports & Analytics - View Reports', 'Can view sales, customer acquisition, and accounting reports', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'reports', 'export', 'reports.export', 'Reports & Analytics - Export Analytics', 'Can download CSV/Excel reports', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin_management', 'view', 'admin_management.view', 'Role & Admin Management - View Roles & Sub-Admins', 'Can view admin users, custom roles, and permission matrix', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin_management', 'create', 'admin_management.create', 'Role & Admin Management - Create Roles & Sub-Admins', 'Can add custom roles and create new Sub-Admin accounts', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin_management', 'edit', 'admin_management.edit', 'Role & Admin Management - Edit Roles & Sub-Admins', 'Can update roles, change permissions, and toggle account status', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin_management', 'delete', 'admin_management.delete', 'Role & Admin Management - Delete Roles & Sub-Admins', 'Can delete custom roles and remove sub-admin accounts', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
INSERT INTO permissions (id, module, action, code, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin_management', 'assign', 'admin_management.assign', 'Role & Admin Management - Assign Roles to Admins', 'Can assign or revoke roles from sub-admins', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 3: Ensure Super Admin and standard business roles exist
INSERT INTO roles (id, name, slug, description, is_system, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'super_admin',
  'Full unconstrained system authority over all modules and settings.',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = TRUE,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO roles (id, name, slug, description, is_system, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Store Manager', 'store_manager', 'Manages catalog, inventory, order processing, and homepage showcase.', FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'Finance & Accounts Officer', 'finance_officer', 'Handles payment verification, refunds, tax invoicing, and ZATCA compliance.', FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'Logistics & Fleet Dispatcher', 'delivery_dispatcher', 'Coordinates drivers, schedules delivery runs, and monitors live fulfillment.', FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'Customer Support Representative', 'customer_support', 'Resolves customer issues, checks order status, and submits refund requests.', FALSE, TRUE, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Map ALL permissions to Super Admin role
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 5: Assign standard permissions to standard business roles
-- Store Manager: dashboard, products, categories, inventory, orders, cms, banners
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, NOW(), NOW()
FROM roles r
JOIN permissions p ON p.module IN ('dashboard', 'products', 'categories', 'inventory', 'orders', 'cms', 'banners')
WHERE r.slug = 'store_manager'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance Officer: dashboard, orders, payments, refunds, invoices, zatca, reports
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, NOW(), NOW()
FROM roles r
JOIN permissions p ON p.module IN ('dashboard', 'orders', 'payments', 'refunds', 'invoices', 'zatca', 'reports')
WHERE r.slug = 'finance_officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Logistics Dispatcher: dashboard, orders, delivery, drivers
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, NOW(), NOW()
FROM roles r
JOIN permissions p ON p.module IN ('dashboard', 'orders', 'delivery', 'drivers')
WHERE r.slug = 'delivery_dispatcher'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer Support: dashboard, orders, customers, refunds (except delete & refund actions)
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, NOW(), NOW()
FROM roles r
JOIN permissions p ON p.module IN ('dashboard', 'orders', 'customers', 'refunds')
  AND p.action NOT IN ('refund', 'delete')
WHERE r.slug = 'customer_support'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 6: Fix Production Super Admin role assignment for admin@platform.com
-- Ensure admin@platform.com is linked to the super_admin role in admin_user_roles.
-- Preserves all other admin users and sub-admins without modifying them.
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  -- Find production admin user
  SELECT id INTO v_user_id FROM users WHERE email = 'admin@platform.com' AND role = 'ADMIN' LIMIT 1;
  -- Find super_admin role
  SELECT id INTO v_role_id FROM roles WHERE slug = 'super_admin' LIMIT 1;

  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    -- If an entry already exists for this user, ensure role_id is super_admin
    IF EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = v_user_id) THEN
      UPDATE admin_user_roles
      SET role_id = v_role_id, updated_at = NOW()
      WHERE user_id = v_user_id;
      RAISE NOTICE 'Updated existing role assignment for admin@platform.com to Super Admin.';
    ELSE
      INSERT INTO admin_user_roles (id, user_id, role_id, created_at, updated_at)
      VALUES (gen_random_uuid(), v_user_id, v_role_id, NOW(), NOW());
      RAISE NOTICE 'Created Super Admin role assignment for admin@platform.com.';
    END IF;
  ELSE
    IF v_user_id IS NULL THEN
      RAISE WARNING 'User admin@platform.com was not found in users table. Please check email address.';
    END IF;
    IF v_role_id IS NULL THEN
      RAISE WARNING 'Role super_admin was not found in roles table.';
    END IF;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Verification Query (Run this to confirm the fix)
-- =============================================================================
SELECT 
  u.id AS user_id,
  u.email,
  u.role AS user_system_role,
  u.status,
  r.name AS rbac_role_name,
  r.slug AS rbac_role_slug,
  COUNT(rp.permission_id) AS total_permissions
FROM users u
JOIN admin_user_roles aur ON aur.user_id = u.id
JOIN roles r ON r.id = aur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE u.email = 'admin@platform.com'
GROUP BY u.id, u.email, u.role, u.status, r.name, r.slug;
