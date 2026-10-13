const { Cart, CartItem, Product, ProductVariant, ProductImage, Customer } = require('../models');

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
            {
              model: ProductVariant,
              as: 'variant',
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

  async addItemToCart(customerId, productId, quantity = 1, variantId = null) {
    const product = await Product.findByPk(productId);
    if (!product || !product.is_active || !product.is_available) {
      throw new Error('Product is unavailable for purchase');
    }

    let variant = null;
    if (variantId) {
      variant = await ProductVariant.findOne({
        where: { id: variantId, product_id: productId },
      });
      if (!variant || !variant.is_active) {
        throw new Error('Selected variant is unavailable for purchase');
      }
      if (variant.stock_quantity < quantity) {
        throw new Error(`Insufficient stock available for this variant. Current stock: ${variant.stock_quantity}`);
      }
    } else {
      if (product.stock_quantity < quantity) {
        throw new Error(`Insufficient stock available. Current stock: ${product.stock_quantity}`);
      }
    }

    const cart = await this.getOrCreateCart(customerId);
    const itemWhere = {
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId || null,
    };

    let item = await CartItem.findOne({
      where: itemWhere,
    });

    const maxStock = variant ? variant.stock_quantity : product.stock_quantity;

    if (item) {
      const newQuantity = item.quantity + quantity;
      if (maxStock < newQuantity) {
        throw new Error(`Cannot add more. Exceeds available stock of ${maxStock}`);
      }
      await item.update({ quantity: newQuantity });
    } else {
      item = await CartItem.create({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
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
      include: [
        { model: Product, as: 'product' },
        { model: ProductVariant, as: 'variant' },
      ],
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    const maxStock = item.variant ? item.variant.stock_quantity : item.product.stock_quantity;
    if (maxStock < quantity) {
      throw new Error(`Insufficient stock available. Current stock: ${maxStock}`);
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
      const v = item.variant;
      const p = item.product;

      const price = v ? parseFloat(v.price) : parseFloat(p.price);
      const discount_price = v
        ? (v.discount_price !== null && v.discount_price !== undefined ? parseFloat(v.discount_price) : null)
        : (p.discount_price !== null && p.discount_price !== undefined ? parseFloat(p.discount_price) : null);

      const effectivePrice = discount_price !== null && discount_price < price ? discount_price : price;
      const lineTotal = effectivePrice * item.quantity;
      subtotal += lineTotal;

      const unitValue = v ? v.unit_value : p.unit_value;
      const unitType = v ? v.unit_type : p.unit_type;
      const packSize = v ? v.pack_size : p.pack_size;
      const stockAvailable = v ? v.stock_quantity : p.stock_quantity;
      const image = (v && v.image_url)
        ? v.image_url
        : (p.images && p.images.length > 0 ? p.images[0].image_url : null);

      return {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id || null,
        name_en: p.name_en,
        name_ar: p.name_ar,
        sku: v ? v.sku : p.sku,
        price,
        discount_price,
        vat_percentage: p.vat_percentage,
        unit_value: unitValue,
        unit_type: unitType,
        pack_size: packSize,
        quantity: item.quantity,
        stockAvailable,
        lineTotal,
        image,
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
