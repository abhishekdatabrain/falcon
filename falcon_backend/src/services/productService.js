const { Product, ProductImage, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

class ProductService {
  async getProducts(query = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      onlyActive = true,
    } = query;

    const where = {};
    if (onlyActive) {
      where.is_active = true;
      where.is_available = true;
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (subcategoryId) {
      where.subcategory_id = subcategoryId;
    }

    if (search) {
      where[Op.or] = [
        { name_en: { [Op.iLike]: `%${search}%` } },
        { name_ar: { [Op.iLike]: `%${search}%` } },
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
        { model: ProductImage, as: 'images' },
      ],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(data) {
    const { category_id, subcategory_id, sku, name_en, name_ar, description_en, description_ar, unit, price, stock_quantity, images } = data;

    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) {
      throw new Error(`Product SKU "${sku}" already exists`);
    }

    return await sequelize.transaction(async (t) => {
      const product = await Product.create({
        category_id,
        subcategory_id: subcategory_id || null,
        sku,
        name_en,
        name_ar,
        description_en,
        description_ar,
        unit: unit || 'PCS',
        price,
        stock_quantity: stock_quantity || 0,
        is_available: (stock_quantity || 0) > 0,
        is_active: true,
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

    return await sequelize.transaction(async (t) => {
      if (data.stock_quantity !== undefined) {
        data.is_available = data.stock_quantity > 0;
      }

      await product.update(data, { transaction: t });

      if (data.images && Array.isArray(data.images)) {
        await ProductImage.destroy({ where: { product_id: product.id }, transaction: t });
        const imageRecords = data.images.map((url, idx) => ({
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
}

module.exports = new ProductService();
