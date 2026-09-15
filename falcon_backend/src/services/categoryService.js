const { Category } = require('../models');

class CategoryService {
  async getAllCategories(onlyActive = true) {
    const where = onlyActive ? { is_active: true } : {};
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
