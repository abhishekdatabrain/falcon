const { Product, ProductImage, Category, StockLog, sequelize } = require('../models');
const { Op } = require('sequelize');

class ProductService {
  async getProducts(query = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      subcategoryId,
      subSubcategoryId,
      sub_subcategory_id,
      subSubSubcategoryId,
      sub_sub_subcategory_id,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      onlyActive = true,
      is_featured,
      is_new_arrival,
      is_best_seller,
      is_best_deal,
      isBestDeal,
    } = query;

    const where = {};
    if (onlyActive) {
      where.is_active = true;
      where.is_available = true;
    }

    if (is_best_deal !== undefined || isBestDeal !== undefined) {
      const val = is_best_deal !== undefined ? is_best_deal : isBestDeal;
      where.is_best_deal = String(val) === 'true';
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (subcategoryId) {
      where.subcategory_id = subcategoryId;
    }

    if (subSubcategoryId || sub_subcategory_id) {
      where.sub_subcategory_id = subSubcategoryId || sub_subcategory_id;
    }

    if (subSubSubcategoryId || sub_sub_subcategory_id) {
      where.sub_sub_subcategory_id = subSubSubcategoryId || sub_sub_subcategory_id;
    }

    if (search) {
      where[Op.or] = [
        { name_en: { [Op.iLike]: `%${search}%` } },
        { name_ar: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description_en: { [Op.iLike]: `%${search}%` } },
        { description_ar: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'sub_subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'sub_sub_subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        {
          model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'display_order'], separate: true, order: [['display_order', 'ASC']]
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getProductById(id) {
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'sub_subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: Category, as: 'sub_sub_subcategory', attributes: ['id', 'name_en', 'name_ar', 'slug'] },
        { model: ProductImage, as: 'images' },
      ],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(data) {
    const { category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, sku, name_en, name_ar, description_en, description_ar, brand, unit, unit_type, unit_value, pack_size, sold_by, price, purchase_price, discount_price, vat_percentage, price_includes_vat, stock_quantity, is_available, is_active, is_featured, is_new_arrival, is_best_seller, is_best_deal, images } = data;

    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) {
      throw new Error(`Product SKU "${sku}" already exists`);
    }

    const computedUnit = (unit_value && unit_type) ? `${unit_value} ${unit_type}` : (unit || 'PCS');

    return await sequelize.transaction(async (t) => {
      const product = await Product.create({
        category_id,
        subcategory_id: subcategory_id || null,
        sub_subcategory_id: sub_subcategory_id || null,
        sub_sub_subcategory_id: sub_sub_subcategory_id || null,
        sku,
        name_en,
        name_ar,
        description_en,
        description_ar,
        brand: brand || '',
        unit: computedUnit,
        unit_type: unit_type || null,
        unit_value: unit_value || null,
        pack_size: pack_size || null,
        sold_by: sold_by || null,
        price,
        purchase_price: purchase_price ? parseFloat(purchase_price) : null,
        discount_price: discount_price ? parseFloat(discount_price) : null,
        vat_percentage: vat_percentage !== undefined && vat_percentage !== '' ? parseFloat(vat_percentage) : 15.00,
        price_includes_vat: price_includes_vat !== undefined ? Boolean(price_includes_vat) : true,
        stock_quantity: stock_quantity || 0,
        is_available: is_available !== undefined ? Boolean(is_available) : (stock_quantity || 0) > 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        is_featured: is_featured !== undefined ? Boolean(is_featured) : false,
        is_new_arrival: is_new_arrival !== undefined ? Boolean(is_new_arrival) : true,
        is_best_seller: is_best_seller !== undefined ? Boolean(is_best_seller) : false,
        is_best_deal: is_best_deal !== undefined ? Boolean(is_best_deal) : false,
      }, { transaction: t });

      if (images && Array.isArray(images) && images.length > 0) {
        const imageRecords = images.map((url, idx) => ({
          product_id: product.id,
          image_url: url,
          display_order: idx,
          is_primary: idx === 0,
        }));
        await ProductImage.bulkCreate(imageRecords, { transaction: t });
      }

      return await Product.findByPk(product.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Category, as: 'subcategory' },
          { model: Category, as: 'sub_subcategory' },
          { model: Category, as: 'sub_sub_subcategory' },
          { model: ProductImage, as: 'images' },
        ],
        transaction: t,
      });
    });
  }

  async updateProduct(id, data) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const cleanData = { ...data };
    if (cleanData.subcategory_id === '' || cleanData.subcategory_id === undefined) cleanData.subcategory_id = null;
    if (cleanData.sub_subcategory_id === '' || cleanData.sub_subcategory_id === undefined) cleanData.sub_subcategory_id = null;
    if (cleanData.sub_sub_subcategory_id === '' || cleanData.sub_sub_subcategory_id === undefined) cleanData.sub_sub_subcategory_id = null;
    if (cleanData.category_id === '') delete cleanData.category_id;
    if (cleanData.purchase_price === '') cleanData.purchase_price = null;
    if (cleanData.discount_price === '') cleanData.discount_price = null;

    if (cleanData.unit_value && cleanData.unit_type) {
      cleanData.unit = `${cleanData.unit_value} ${cleanData.unit_type}`;
    }

    return await sequelize.transaction(async (t) => {
      if (cleanData.stock_quantity !== undefined) {
        cleanData.is_available = cleanData.stock_quantity > 0;
      }

      await product.update(cleanData, { transaction: t });

      if (cleanData.images && Array.isArray(cleanData.images)) {
        await ProductImage.destroy({ where: { product_id: product.id }, transaction: t });
        const imageRecords = cleanData.images.map((url, idx) => ({
          product_id: product.id,
          image_url: url,
          display_order: idx,
          is_primary: idx === 0,
        }));
        await ProductImage.bulkCreate(imageRecords, { transaction: t });
      }

      return await Product.findByPk(product.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Category, as: 'subcategory' },
          { model: Category, as: 'sub_subcategory' },
          { model: Category, as: 'sub_sub_subcategory' },
          { model: ProductImage, as: 'images' },
        ],
        transaction: t,
      });
    });
  }

  async deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    await product.destroy();
    return true;
  }

  async adjustStock(productId, { type = 'RESTOCK', quantity = 0, new_total_stock, reason, user_id }) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const previous_stock = parseInt(product.stock_quantity || 0, 10);
    const qtyVal = parseInt(quantity || 0, 10);
    let calculatedNewStock = previous_stock;

    if (type === 'RESTOCK' || type === 'ADD') {
      calculatedNewStock = previous_stock + Math.abs(qtyVal);
    } else if (type === 'DAMAGE' || type === 'REMOVE' || type === 'EXPIRED') {
      calculatedNewStock = Math.max(0, previous_stock - Math.abs(qtyVal));
    } else if (type === 'CORRECTION' || type === 'AUDIT') {
      calculatedNewStock = new_total_stock !== undefined && new_total_stock !== null
        ? Math.max(0, parseInt(new_total_stock, 10))
        : Math.max(0, previous_stock + qtyVal);
    } else {
      calculatedNewStock = Math.max(0, previous_stock + qtyVal);
    }

    const deltaQuantity = calculatedNewStock - previous_stock;

    return await sequelize.transaction(async (t) => {
      await product.update({
        stock_quantity: calculatedNewStock,
        is_available: calculatedNewStock > 0,
      }, { transaction: t });

      const stockLog = await StockLog.create({
        product_id: product.id,
        type,
        quantity: deltaQuantity,
        previous_stock,
        new_stock: calculatedNewStock,
        reason: reason || 'Stock adjustment via Admin Panel',
        created_by: user_id || 'Admin',
      }, { transaction: t });

      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Category, as: 'subcategory' },
          { model: Category, as: 'sub_subcategory' },
          { model: Category, as: 'sub_sub_subcategory' },
          { model: ProductImage, as: 'images' },
        ],
        transaction: t,
      });

      return { product: updatedProduct, stockLog };
    });
  }

  async getStockLogs(productId) {
    const logs = await StockLog.findAll({
      where: { product_id: productId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    return logs;
  }
}

module.exports = new ProductService();
