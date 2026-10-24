const { Category, Product } = require('../models');
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

    const shouldPaginate = (options.page !== undefined || options.limit !== undefined) && options.all !== 'true' && options.all !== true;

    if (shouldPaginate) {
      const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
      const paginationConfig = parsePagination(options, 10, 100);

      const { count, rows } = await Category.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'subcategories',
            include: [
              {
                model: Category,
                as: 'subcategories',
                include: [
                  { model: Category, as: 'subcategories' }
                ]
              }
            ]
          },
          {
            model: Category,
            as: 'parentCategory',
            include: [
              {
                model: Category,
                as: 'parentCategory',
                include: [
                  { model: Category, as: 'parentCategory' }
                ]
              }
            ]
          },
        ],
        distinct: true,
        limit: paginationConfig.limit,
        offset: paginationConfig.offset,
        order: [['name_en', 'ASC'], ['id', 'ASC']],
      });

      return {
        categories: rows,
        records: rows,
        pagination: buildPaginationResponse(count, paginationConfig.page, paginationConfig.limit),
      };
    }

    return await Category.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'subcategories',
          include: [
            {
              model: Category,
              as: 'subcategories',
              include: [
                { model: Category, as: 'subcategories' }
              ]
            }
          ]
        },
        {
          model: Category,
          as: 'parentCategory',
          include: [
            {
              model: Category,
              as: 'parentCategory',
              include: [
                { model: Category, as: 'parentCategory' }
              ]
            }
          ]
        },
      ],
      order: [['name_en', 'ASC'], ['id', 'ASC']],
    });
  }

  async getCategoryBySlug(slug) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const category = await Category.findOne({
      where: isUUID
        ? { [Op.or]: [{ id: slug }, { slug }], is_active: true }
        : { slug, is_active: true },
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: Category,
              as: 'subcategories',
              where: { is_active: true },
              required: false,
              include: [
                { model: Category, as: 'subcategories', where: { is_active: true }, required: false }
              ]
            }
          ]
        },
        {
          model: Category,
          as: 'parentCategory',
          include: [
            {
              model: Category,
              as: 'parentCategory',
              include: [
                { model: Category, as: 'parentCategory' }
              ]
            }
          ]
        },
      ],
      order: [
        [{ model: Category, as: 'subcategories' }, 'name_en', 'ASC'],
      ],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Helper to get all descendant category IDs recursively
    const getDescendantIds = async (parentIds) => {
      const children = await Category.findAll({
        where: { parent_id: { [Op.in]: parentIds }, is_active: true },
        attributes: ['id'],
      });
      if (children.length === 0) return [];
      const childIds = children.map(c => c.id);
      const deeper = await getDescendantIds(childIds);
      return [...childIds, ...deeper];
    };

    // Helper to count active products for given category IDs
    const countProductsForIds = async (targetIds) => {
      return await Product.count({
        where: {
          is_active: true,
          is_available: true,
          [Op.or]: [
            { category_id: { [Op.in]: targetIds } },
            { subcategory_id: { [Op.in]: targetIds } },
            { sub_subcategory_id: { [Op.in]: targetIds } },
            { sub_sub_subcategory_id: { [Op.in]: targetIds } }
          ]
        },
        distinct: true,
        col: 'id',
      });
    };

    const catDescendantIds = await getDescendantIds([category.id]);
    const totalCount = await countProductsForIds([category.id, ...catDescendantIds]);

    const result = category.toJSON();
    result.products_count = totalCount;

    // Filter active subcategories and populate each subcategory's product count
    const activeSubcategories = Array.isArray(result.subcategories)
      ? result.subcategories.filter(s => s.is_active !== false)
      : [];

    for (const sub of activeSubcategories) {
      const subDescIds = await getDescendantIds([sub.id]);
      sub.products_count = await countProductsForIds([sub.id, ...subDescIds]);
    }

    result.subcategories = activeSubcategories;
    return result;
  }

  async createCategory(data) {
    const { name_en, name_ar, slug, image_url, is_active, parent_id, banner, content } = data;
    return await Category.create({
      name_en,
      name_ar,
      slug,
      image_url,
      banner: banner || {},
      content: content || {},
      parent_id: parent_id || null,
      is_active: is_active !== undefined ? is_active : true,
    });
  }

  async updateCategory(id, data) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let category = null;
    if (isUUID) {
      category = await Category.findByPk(id);
    }
    if (!category) {
      category = await Category.findOne({ where: { slug: id } });
    }
    if (!category && data.slug) {
      category = await Category.findOne({ where: { slug: data.slug } });
    }

    if (!category) {
      // Auto-create category if it was defined in hierarchy but not yet in DB
      return await Category.create({
        slug: data.slug || id,
        name_en: data.name_en || id,
        name_ar: data.name_ar || id,
        parent_id: data.parent_id || null,
        banner: data.banner || {},
        content: data.content || {},
        image_url: data.image_url || null,
        is_active: true,
      });
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
