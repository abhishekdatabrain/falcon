const { Category } = require('../models');
const { Op } = require('sequelize');

class CategoryService {
  async getAllCategories(options = {}) {
    const { onlyActive = true, search, parent_id, type } = typeof options === 'boolean' ? { onlyActive: options } : options;

    const where = {};
    if (onlyActive) {
      where.is_active = true;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name_en: { [Op.iLike]: q } },
        { name_ar: { [Op.iLike]: q } },
        { slug: { [Op.iLike]: q } },
      ];
    }

    if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
      if (parent_id === 'null' || parent_id === 'none' || parent_id === 'main') {
        where.parent_id = null;
      } else {
        where.parent_id = parent_id;
      }
    } else if (type === 'parent' || type === 'main') {
      where.parent_id = null;
    } else if (type === 'sub') {
      where.parent_id = { [Op.ne]: null };
    }

    return await Category.findAll({
      where,
      include: [
        { model: Category, as: 'subcategories' },
        { model: Category, as: 'parentCategory' },
      ],
      order: [['name_en', 'ASC']],
    });
  }

  async getCategoryBySlug(slug) {
    const category = await Category.findOne({
      where: { slug, is_active: true },
      include: [
        { model: Category, as: 'subcategories' },
        { model: Category, as: 'parentCategory' },
      ],
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async createCategory(data) {
    const { name_en, name_ar, slug, image_url, is_active, parent_id } = data;
    return await Category.create({
      name_en,
      name_ar,
      slug,
      image_url,
      parent_id: parent_id || null,
      is_active: is_active !== undefined ? is_active : true,
    });
  }

  async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return await category.update(data);
  }

  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error('Category not found');
    }
    await category.destroy();
    return true;
  }
}

module.exports = new CategoryService();
