const { Cart, CartItem, Product, ProductImage, Customer } = require('../models');

class CartService {
  async getOrCreateCart(customerId) {
    let cart = await Cart.findOne({
      where: { customer_id: customerId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false }],
            },
          ],
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({ customer_id: customerId });
      cart.items = [];
    }

    return cart;
  }

  async addItemToCart(customerId, productId, quantity = 1) {
    const product = await Product.findByPk(productId);
    if (!product || !product.is_active || !product.is_available) {
      throw new Error('Product is unavailable for purchase');
    }

    if (product.stock_quantity < quantity) {
      throw new Error(`Insufficient stock available. Current stock: ${product.stock_quantity}`);
    }

    const cart = await this.getOrCreateCart(customerId);
    let item = await CartItem.findOne({
      where: { cart_id: cart.id, product_id: productId },
    });

    if (item) {
      const newQuantity = item.quantity + quantity;
      if (product.stock_quantity < newQuantity) {
        throw new Error(`Cannot add more. Exceeds available stock of ${product.stock_quantity}`);
      }
      await item.update({ quantity: newQuantity });
    } else {
      item = await CartItem.create({
        cart_id: cart.id,
        product_id: productId,
        quantity,
      });
    }

    return await this.getOrCreateCart(customerId);
  }

  async updateCartItemQuantity(customerId, itemId, quantity) {
    if (quantity <= 0) {
      return await this.removeItemFromCart(customerId, itemId);
    }

    const cart = await this.getOrCreateCart(customerId);
    const item = await CartItem.findOne({
      where: { id: itemId, cart_id: cart.id },
      include: [{ model: Product, as: 'product' }],
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    if (item.product.stock_quantity < quantity) {
      throw new Error(`Insufficient stock available. Current stock: ${item.product.stock_quantity}`);
    }

    await item.update({ quantity });
    return await this.getOrCreateCart(customerId);
  }

  async removeItemFromCart(customerId, itemId) {
    const cart = await this.getOrCreateCart(customerId);
    await CartItem.destroy({
      where: { id: itemId, cart_id: cart.id },
    });
    return await this.getOrCreateCart(customerId);
  }

  async clearCart(customerId) {
    const cart = await this.getOrCreateCart(customerId);
    await CartItem.destroy({
      where: { cart_id: cart.id },
    });
    return await this.getOrCreateCart(customerId);
  }

  // Server-side calculation of cart summary
  async calculateCartTotals(customerId) {
    const cart = await this.getOrCreateCart(customerId);
    let subtotal = 0;

    const items = cart.items.map(item => {
      const price = parseFloat(item.product.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        id: item.id,
        productId: item.product_id,
        name_en: item.product.name_en,
        name_ar: item.product.name_ar,
        price,
        quantity: item.quantity,
        stockAvailable: item.product.stock_quantity,
        lineTotal,
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0].image_url : null,
      };
    });

    const taxRate = 0.15; // 15% Saudi Arabia VAT
    const taxTotal = Math.round(subtotal * taxRate * 100) / 100;
    const deliveryFee = subtotal > 0 ? (subtotal >= 500 ? 0.00 : 25.00) : 0.00; // Free delivery over 500 SAR
    const discountTotal = 0.00;
    const grandTotal = Math.round((subtotal + taxTotal + deliveryFee - discountTotal) * 100) / 100;

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal,
      deliveryFee,
      discountTotal,
      grandTotal,
    };
  }
}

module.exports = new CartService();
