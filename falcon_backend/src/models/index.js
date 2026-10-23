const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Driver = require('./Driver');
const Admin = require('./Admin');
const Address = require('./Address');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const ProductImage = require('./ProductImage');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const OrderStatusHistory = require('./OrderStatusHistory');
const Payment = require('./Payment');
const PaymentConfirmation = require('./PaymentConfirmation');
const DriverAssignment = require('./DriverAssignment');
const Delivery = require('./Delivery');
const DriverLocation = require('./DriverLocation');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Feedback = require('./Feedback');
const Notification = require('./Notification');
const RefreshToken = require('./RefreshToken');
const Wishlist = require('./Wishlist');
const StockLog = require('./StockLog');
const HeroBanner = require('./HeroBanner');
const PromoBanner = require('./PromoBanner');
const HomepageCategorySection = require('./HomepageCategorySection');
const HomepageCategoryItem = require('./HomepageCategoryItem');
const HomepageSection = require('./HomepageSection');
const HomepageSetting = require('./HomepageSetting');
const Coupon = require('./Coupon');
const DeliverySlot = require('./DeliverySlot');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const AdminUserRole = require('./AdminUserRole');
const AuditLog = require('./AuditLog');

// --- User Associations ---
User.hasOne(Customer, { foreignKey: 'user_id', as: 'customer', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Driver, { foreignKey: 'user_id', as: 'driver', onDelete: 'CASCADE' });
Driver.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Admin, { foreignKey: 'user_id', as: 'admin', onDelete: 'CASCADE' });
Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- Customer Associations ---
Customer.hasMany(Address, { foreignKey: 'customer_id', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasOne(Cart, { foreignKey: 'customer_id', as: 'cart', onDelete: 'CASCADE' });
Cart.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Feedback, { foreignKey: 'customer_id', as: 'feedbacks' });
Feedback.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// --- Catalog Associations ---
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories', onDelete: 'CASCADE' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parentCategory' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Category.hasMany(Product, { foreignKey: 'subcategory_id', as: 'subcategory_products' });
Product.belongsTo(Category, { foreignKey: 'subcategory_id', as: 'subcategory' });

Category.hasMany(Product, { foreignKey: 'sub_subcategory_id', as: 'sub_subcategory_products' });
Product.belongsTo(Category, { foreignKey: 'sub_subcategory_id', as: 'sub_subcategory' });

Category.hasMany(Product, { foreignKey: 'sub_sub_subcategory_id', as: 'sub_sub_subcategory_products' });
Product.belongsTo(Category, { foreignKey: 'sub_sub_subcategory_id', as: 'sub_sub_subcategory' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stock_logs', onDelete: 'CASCADE' });
StockLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cart_items' });

CartItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
ProductVariant.hasMany(CartItem, { foreignKey: 'variant_id', as: 'cart_items' });

// --- Order & Item Associations ---
Address.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });

OrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
ProductVariant.hasMany(OrderItem, { foreignKey: 'variant_id', as: 'order_items' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'status_history', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderStatusHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changed_by' });
User.hasMany(OrderStatusHistory, { foreignKey: 'changed_by_user_id', as: 'order_status_changes' });
Order.belongsTo(User, { foreignKey: 'cancelled_by', as: 'cancelled_by_user' });

// --- Payment Associations ---
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Payment.hasOne(PaymentConfirmation, { foreignKey: 'payment_id', as: 'confirmation', onDelete: 'CASCADE' });
PaymentConfirmation.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

Payment.belongsTo(Admin, { foreignKey: 'verified_by_admin_id', as: 'verified_by_admin' });
Admin.hasMany(Payment, { foreignKey: 'verified_by_admin_id', as: 'verified_payments' });

// --- Driver & Assignment Associations ---
Order.hasMany(DriverAssignment, { foreignKey: 'order_id', as: 'assignments', onDelete: 'CASCADE' });
DriverAssignment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Driver.hasMany(DriverAssignment, { foreignKey: 'driver_id', as: 'assignments' });
DriverAssignment.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });
DriverAssignment.belongsTo(Driver, { foreignKey: 'previous_driver_id', as: 'previous_driver' });

Admin.hasMany(DriverAssignment, { foreignKey: 'assigned_by_admin_id', as: 'assigned_drivers' });
DriverAssignment.belongsTo(Admin, { foreignKey: 'assigned_by_admin_id', as: 'assigned_by_admin' });

// --- Delivery & GPS Associations ---
Order.hasOne(Delivery, { foreignKey: 'order_id', as: 'delivery', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Driver.hasMany(Delivery, { foreignKey: 'driver_id', as: 'deliveries' });
Delivery.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Delivery.hasMany(DriverLocation, { foreignKey: 'delivery_id', as: 'locations', onDelete: 'CASCADE' });
DriverLocation.belongsTo(Delivery, { foreignKey: 'delivery_id', as: 'delivery' });

// --- Invoice Associations ---
Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

Invoice.belongsTo(Invoice, { foreignKey: 'original_invoice_id', as: 'original_invoice' });
Invoice.hasMany(Invoice, { foreignKey: 'original_invoice_id', as: 'credit_notes' });

// --- Feedback Associations ---
Order.hasMany(Feedback, { foreignKey: 'order_id', as: 'feedbacks', onDelete: 'CASCADE' });
Order.hasOne(Feedback, { foreignKey: 'order_id', as: 'feedback', onDelete: 'CASCADE' });
Feedback.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Product.hasMany(Feedback, { foreignKey: 'product_id', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
OrderItem.hasOne(Feedback, { foreignKey: 'order_item_id', as: 'feedback', onDelete: 'CASCADE' });
Feedback.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'order_item' });

// --- Homepage Category Showcase Associations ---
HomepageCategorySection.hasMany(HomepageCategoryItem, { foreignKey: 'section_id', as: 'items', onDelete: 'CASCADE' });
HomepageCategoryItem.belongsTo(HomepageCategorySection, { foreignKey: 'section_id', as: 'section' });
HomepageCategoryItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// --- Role-Based Access Control (RBAC) Associations ---
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

User.belongsToMany(Role, {
  through: AdminUserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'assigned_roles',
});
Role.belongsToMany(User, {
  through: AdminUserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users',
});

AdminUserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AdminUserRole.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Customer,
  Driver,
  Admin,
  Address,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  StockLog,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  PaymentConfirmation,
  DriverAssignment,
  Delivery,
  DriverLocation,
  Invoice,
  InvoiceItem,
  Feedback,
  Notification,
  RefreshToken,
  Wishlist,
  HeroBanner,
  PromoBanner,
  HomepageCategorySection,
  HomepageCategoryItem,
  HomepageSection,
  HomepageSetting,
  Coupon,
  DeliverySlot,
  Role,
  Permission,
  RolePermission,
  AdminUserRole,
  AuditLog,
};
