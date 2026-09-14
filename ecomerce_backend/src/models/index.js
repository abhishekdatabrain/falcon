const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Driver = require('./Driver');
const Admin = require('./Admin');
const Address = require('./Address');
const Category = require('./Category');
const Product = require('./Product');
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

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// --- Cart Associations ---
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cart_items' });

// --- Order & Item Associations ---
Address.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'status_history', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// --- Payment Associations ---
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Payment.hasOne(PaymentConfirmation, { foreignKey: 'payment_id', as: 'confirmation', onDelete: 'CASCADE' });
PaymentConfirmation.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

// --- Driver & Assignment Associations ---
Order.hasMany(DriverAssignment, { foreignKey: 'order_id', as: 'assignments', onDelete: 'CASCADE' });
DriverAssignment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Driver.hasMany(DriverAssignment, { foreignKey: 'driver_id', as: 'assignments' });
DriverAssignment.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

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

// --- Feedback Associations ---
Order.hasOne(Feedback, { foreignKey: 'order_id', as: 'feedback', onDelete: 'CASCADE' });
Feedback.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

module.exports = {
  sequelize,
  User,
  Customer,
  Driver,
  Admin,
  Address,
  Category,
  Product,
  ProductImage,
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
};
