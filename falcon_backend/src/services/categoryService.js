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

  async getDescendantIds(parentIds, onlyActive = false) {
    if (!parentIds || !parentIds.length) return [];
    const where = { parent_id: { [Op.in]: parentIds } };
    if (onlyActive) {
      where.is_active = true;
    }
    const children = await Category.findAll({
      where,
      attributes: ['id'],
    });
    if (children.length === 0) return [];
    const childIds = children.map((c) => c.id);
    const deeper = await this.getDescendantIds(childIds, onlyActive);
    return [...childIds, ...deeper];
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

  async updateCategory(id, data = {}) {
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
      throw new Error('Category not found');
    }

    const updatePayload = {};

    // 1. English Name Validation
    if (data.name_en !== undefined) {
      const trimmed = String(data.name_en || '').trim();
      if (!trimmed) {
        throw new Error('English category name cannot be empty.');
      }
      updatePayload.name_en = trimmed;
    }

    // 2. Arabic Name Validation
    if (data.name_ar !== undefined) {
      const trimmed = String(data.name_ar || '').trim();
      if (!trimmed) {
        throw new Error('Arabic category name cannot be empty.');
      }
      updatePayload.name_ar = trimmed;
    }

    // 3. Slug Validation & Collision Check
    if (data.slug !== undefined) {
      const cleanSlug = String(data.slug || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (!cleanSlug) {
        throw new Error('Category slug cannot be empty.');
      }
      if (cleanSlug !== category.slug) {
        const existingSlug = await Category.findOne({
          where: {
            slug: cleanSlug,
            id: { [Op.ne]: category.id },
          },
        });
        if (existingSlug) {
          throw new Error(`The slug "${cleanSlug}" is already in use by category "${existingSlug.name_en}". Please choose a unique slug.`);
        }
      }
      updatePayload.slug = cleanSlug;
    }

    // 4. Image URL Handling
    if (data.image_url !== undefined) {
      updatePayload.image_url = data.image_url && String(data.image_url).trim() ? String(data.image_url).trim() : null;
    }

    // 5. Active Status Handling
    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    // 6. Parent ID & Hierarchy Integrity
    if (data.parent_id !== undefined) {
      let rawParentId = data.parent_id;
      if (rawParentId === '' || rawParentId === 'null' || rawParentId === 'none' || rawParentId === 'main') {
        rawParentId = null;
      }

      if (rawParentId !== null) {
        const isParentUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParentId);
        if (!isParentUUID) {
          const parentBySlug = await Category.findOne({ where: { slug: rawParentId } });
          if (parentBySlug) {
            rawParentId = parentBySlug.id;
          } else {
            throw new Error('Selected parent category does not exist.');
          }
        }

        // Cannot be its own parent
        if (String(rawParentId) === String(category.id)) {
          throw new Error('A category cannot be its own parent.');
        }

        // Ensure parent exists
        const parentCat = await Category.findByPk(rawParentId);
        if (!parentCat) {
          throw new Error('Selected parent category does not exist.');
        }

        // Ensure parent is not a descendant (prevent circular references)
        const descendantIds = await this.getDescendantIds([category.id]);
        if (descendantIds.map(String).includes(String(rawParentId))) {
          throw new Error('Cannot set a child or sub-category as the parent (circular hierarchy).');
        }
      }

      updatePayload.parent_id = rawParentId;
    }

    // 7. Validate Banner CTA URL if provided
    const candidateCtaUrl = data.banner?.cta_url || data.banner?.cta?.link;
    if (candidateCtaUrl && typeof candidateCtaUrl === 'string') {
      const url = candidateCtaUrl.trim();
      if (url.length > 0) {
        const isSafeLocal = url.startsWith('/') || url.startsWith('#') || url.startsWith('?');
        let isValid = isSafeLocal;
        if (!isValid) {
          try {
            const parsed = new URL(url);
            isValid = ['http:', 'https:'].includes(parsed.protocol);
          } catch (_) {
            isValid = false;
          }
        }
        if (!isValid) {
          throw new Error('Invalid CTA destination URL. Please enter a valid web URL or relative path.');
        }
      }
    }

    // 8. Preserve & Merge Banner / Content JSON fields
    if (data.banner && typeof data.banner === 'object') {
      updatePayload.banner = {
        ...(category.banner || {}),
        ...data.banner,
      };
    }
    if (data.content && typeof data.content === 'object') {
      updatePayload.content = {
        ...(category.content || {}),
        ...data.content,
      };
    }

    await category.update(updatePayload);

    const updated = await Category.findByPk(category.id, {
      include: [
        { model: Category, as: 'subcategories' },
        { model: Category, as: 'parentCategory' },
      ],
    });

    return updated || category;
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
