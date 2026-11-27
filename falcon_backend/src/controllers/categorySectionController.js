const {
  HomepageCategorySection,
  HomepageCategoryItem,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  ProductVariantImage,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Resolves the parent Category matching a HomepageCategorySection using its
 * view_more_link (`?category=...`) or title_en / title_ar, then collects all
 * descendant category IDs recursively.
 */
function resolveSectionCategoryIds(section, allCategories) {
  const activeCategories = allCategories.filter((c) => c.is_active !== false);
  let matched = null;

  // 1. Explicit category_id configured on the section takes highest priority
  if (section.category_id) {
    matched = activeCategories.find(
      (c) => String(c.id).toLowerCase() === String(section.category_id).toLowerCase()
    );
  }

  // 2. Match by section title (so renaming a section to e.g. "Coffee" immediately resolves Coffee)
  const titleEn = (section.title_en || '').trim().toLowerCase();
  if (!matched && titleEn) {
    const normalizedTitle = titleEn.replace('bevarages', 'beverages');
    matched =
      activeCategories.find((c) => !c.parent_id && (c.name_en || '').trim().toLowerCase() === normalizedTitle) ||
      activeCategories.find((c) => (c.name_en || '').trim().toLowerCase() === normalizedTitle) ||
      activeCategories.find((c) => !c.parent_id && (c.name_en || '').trim().toLowerCase().includes(normalizedTitle)) ||
      activeCategories.find((c) => (c.name_en || '').trim().toLowerCase().includes(normalizedTitle));
  }

  const titleAr = (section.title_ar || '').trim();
  if (!matched && titleAr) {
    matched =
      activeCategories.find((c) => !c.parent_id && (c.name_ar || '').trim() === titleAr) ||
      activeCategories.find((c) => (c.name_ar || '').trim() === titleAr);
  }

  // 3. Fallback to view_more_link (?category=...)
  if (!matched) {
    const link = (section.view_more_link || '').trim();
    const queryMatch = link.match(/[?&]category=([^&#]+)/i);
    if (queryMatch && queryMatch[1]) {
      const paramCat = decodeURIComponent(queryMatch[1]).trim().toLowerCase();
      matched = activeCategories.find(
        (c) => String(c.id).toLowerCase() === paramCat || (c.slug || '').toLowerCase() === paramCat
      );
    }
  }

  if (!matched) {
    return { parentCategoryId: null, categoryIds: [] };
  }

  const collected = new Set([matched.id]);
  const queue = [matched.id];
  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const cat of activeCategories) {
      if (cat.parent_id === currentId && !collected.has(cat.id)) {
        collected.add(cat.id);
        queue.push(cat.id);
      }
    }
  }

  return { parentCategoryId: matched.id, categoryIds: Array.from(collected) };
}

/**
 * Fetches active, available products belonging to a section's resolved parent
 * category (and all descendant child categories) and attaches them to plainSection.
 */
async function attachSectionProducts(plainSection, allCategories, maxItems) {
  const { parentCategoryId, categoryIds } = resolveSectionCategoryIds(plainSection, allCategories);
  plainSection.category_id = parentCategoryId;

  const productInclude = [
    {
      model: ProductImage,
      as: 'images',
      attributes: ['id', 'image_url', 'is_primary', 'display_order'],
      separate: true,
      order: [['is_primary', 'DESC'], ['display_order', 'ASC']],
    },
    {
      model: ProductVariant,
      as: 'variants',
      where: { is_active: true },
      required: false,
      include: [
        {
          model: ProductVariantImage,
          as: 'images',
          order: [['is_primary', 'DESC'], ['sort_order', 'ASC']],
        },
      ],
    },
  ];

  const customIds = Array.isArray(plainSection.product_ids)
    ? plainSection.product_ids.filter(Boolean)
    : [];

  if (customIds.length > 0) {
    const customWhere = {
      id: { [Op.in]: customIds },
      is_active: true,
      is_available: true,
    };
    if (categoryIds.length > 0) {
      customWhere[Op.or] = [
        { category_id: { [Op.in]: categoryIds } },
        { subcategory_id: { [Op.in]: categoryIds } },
        { sub_subcategory_id: { [Op.in]: categoryIds } },
        { sub_sub_subcategory_id: { [Op.in]: categoryIds } },
      ];
    }
    const selectedProducts = await Product.findAll({
      where: customWhere,
      include: productInclude,
    });
    if (selectedProducts.length > 0) {
      const orderMap = new Map(customIds.map((pid, idx) => [String(pid), idx]));
      selectedProducts.sort(
        (a, b) => (orderMap.get(String(a.id)) ?? 9999) - (orderMap.get(String(b.id)) ?? 9999)
      );
      plainSection.products = selectedProducts.slice(0, maxItems).map((p) => p.get({ plain: true }));
      return plainSection;
    }
  }

  if (categoryIds.length === 0) {
    plainSection.products = [];
    return plainSection;
  }

  const products = await Product.findAll({
    where: {
      is_active: true,
      is_available: true,
      [Op.or]: [
        { category_id: { [Op.in]: categoryIds } },
        { subcategory_id: { [Op.in]: categoryIds } },
        { sub_subcategory_id: { [Op.in]: categoryIds } },
        { sub_sub_subcategory_id: { [Op.in]: categoryIds } },
      ],
    },
    include: productInclude,
    order: [['is_featured', 'DESC'], ['created_at', 'DESC']],
    limit: maxItems,
  });

  plainSection.products = products.map((p) => p.get({ plain: true }));
  return plainSection;
}

class CategorySectionController {
  // Public endpoint: GET /api/v1/category-sections/active
  async getActiveSections(req, res) {
    try {
      const [sections, allCategories] = await Promise.all([
        HomepageCategorySection.findAll({
          where: { is_active: true },
          order: [
            ['display_order', 'ASC'],
            ['created_at', 'ASC'],
          ],
          include: [
            {
              model: HomepageCategoryItem,
              as: 'items',
              where: { is_active: true },
              required: false,
              order: [
                ['display_order', 'ASC'],
                ['created_at', 'ASC'],
              ],
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name_en', 'name_ar', 'slug', 'image_url'],
                  required: false,
                },
              ],
            },
          ],
        }),
        Category.findAll({
          attributes: ['id', 'name_en', 'name_ar', 'slug', 'parent_id', 'is_active'],
        }),
      ]);

      // Resolve parent category & fetch actual products (including child categories) per section
      const formattedSections = await Promise.all(
        sections.map(async (section) => {
          const plainSection = section.get({ plain: true });
          const sortedItems = (plainSection.items || []).sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
          const maxItems = plainSection.max_items || 12;
          plainSection.items = sortedItems.slice(0, maxItems);
          return attachSectionProducts(plainSection, allCategories, maxItems);
        })
      );

      return sendSuccess(res, 'Active homepage category sections retrieved', {
        sections: formattedSections,
      });
    } catch (error) {
      console.error('Error fetching active category sections:', error);
      return sendError(res, error.message || 'Failed to fetch active category sections', [], 500);
    }
  }

  // Admin endpoint: GET /api/v1/category-sections/admin/all
  async getAllSectionsAdmin(req, res) {
    try {
      const [sections, allCategories] = await Promise.all([
        HomepageCategorySection.findAll({
          order: [
            ['display_order', 'ASC'],
            ['created_at', 'ASC'],
          ],
          include: [
            {
              model: HomepageCategoryItem,
              as: 'items',
              required: false,
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name_en', 'name_ar', 'slug', 'image_url'],
                  required: false,
                },
              ],
            },
          ],
        }),
        Category.findAll({
          attributes: ['id', 'name_en', 'name_ar', 'slug', 'parent_id', 'is_active'],
        }),
      ]);

      const formattedSections = await Promise.all(
        sections.map(async (sec) => {
          const plain = sec.get({ plain: true });
          plain.items = (plain.items || []).sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
          const maxItems = plain.max_items || 12;
          return attachSectionProducts(plain, allCategories, maxItems);
        })
      );

      return sendSuccess(res, 'All homepage category sections retrieved', {
        sections: formattedSections,
      });
    } catch (error) {
      console.error('Error fetching all category sections:', error);
      return sendError(res, error.message || 'Failed to fetch category sections', [], 500);
    }
  }

  // Admin endpoint: GET /api/v1/category-sections/admin/:id
  async getSectionById(req, res) {
    try {
      const { id } = req.params;
      const section = await HomepageCategorySection.findByPk(id, {
        include: [
          {
            model: HomepageCategoryItem,
            as: 'items',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name_en', 'name_ar', 'slug'],
                required: false,
              },
            ],
          },
        ],
      });

      if (!section) {
        return sendError(res, 'Category section not found', [], 404);
      }

      const plain = section.get({ plain: true });
      plain.items = (plain.items || []).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );

      return sendSuccess(res, 'Category section retrieved', { section: plain });
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch section', [], 500);
    }
  }

  // Admin endpoint: POST /api/v1/category-sections
  async createSection(req, res) {
    const t = await sequelize.transaction();
    try {
      const {
        title_en,
        title_ar,
        view_more_link,
        view_more_text_en,
        view_more_text_ar,
        bg_color,
        max_items,
        display_order,
        is_active,
        items,
        category_id,
        product_ids,
      } = req.body;

      if (!title_en || !title_ar) {
        await t.rollback();
        return sendError(res, 'Both English and Arabic titles are required', [], 400);
      }

      const normalizedProductIds = Array.isArray(product_ids)
        ? Array.from(new Set(product_ids.filter(Boolean).map(String)))
        : [];

      const nextOrder =
        display_order !== undefined
          ? parseInt(display_order, 10)
          : (await HomepageCategorySection.count({ transaction: t })) + 1;

      const section = await HomepageCategorySection.create(
        {
          title_en,
          title_ar,
          view_more_link: view_more_link || '/products',
          view_more_text_en: view_more_text_en || 'View more',
          view_more_text_ar: view_more_text_ar || 'عرض المزيد',
          bg_color: bg_color || '#F6FFF8',
          max_items: max_items ? parseInt(max_items, 10) : 6,
          category_id: category_id || null,
          product_ids: normalizedProductIds,
          display_order: nextOrder,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
        { transaction: t }
      );

      // Create items if provided
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.title_en && item.image_url) {
            await HomepageCategoryItem.create(
              {
                section_id: section.id,
                category_id: item.category_id || null,
                title_en: item.title_en,
                title_ar: item.title_ar || item.title_en,
                image_url: item.image_url,
                link_url: item.link_url || '/products',
                display_order: item.display_order !== undefined ? item.display_order : i + 1,
                is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();

      const created = await HomepageCategorySection.findByPk(section.id, {
        include: [{ model: HomepageCategoryItem, as: 'items' }],
      });

      return sendSuccess(res, 'Homepage category section created successfully', {
        section: created,
      }, 201);
    } catch (error) {
      await t.rollback();
      console.error('Error creating category section:', error);
      return sendError(res, error.message || 'Failed to create section', [], 500);
    }
  }

  // Admin endpoint: PUT /api/v1/category-sections/:id
  async updateSection(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        title_en,
        title_ar,
        view_more_link,
        view_more_text_en,
        view_more_text_ar,
        bg_color,
        max_items,
        display_order,
        is_active,
        items,
        category_id,
        product_ids,
      } = req.body;

      const section = await HomepageCategorySection.findByPk(id, { transaction: t });
      if (!section) {
        await t.rollback();
        return sendError(res, 'Category section not found', [], 404);
      }

      const normalizedProductIds = Array.isArray(product_ids)
        ? Array.from(new Set(product_ids.filter(Boolean).map(String)))
        : undefined;

      await section.update(
        {
          title_en: title_en !== undefined ? title_en : section.title_en,
          title_ar: title_ar !== undefined ? title_ar : section.title_ar,
          view_more_link: view_more_link !== undefined ? view_more_link : section.view_more_link,
          view_more_text_en: view_more_text_en !== undefined ? view_more_text_en : section.view_more_text_en,
          view_more_text_ar: view_more_text_ar !== undefined ? view_more_text_ar : section.view_more_text_ar,
          bg_color: bg_color !== undefined ? bg_color : section.bg_color,
          max_items: max_items !== undefined ? parseInt(max_items, 10) : section.max_items,
          category_id: category_id !== undefined ? (category_id || null) : section.category_id,
          product_ids: normalizedProductIds !== undefined ? normalizedProductIds : section.product_ids,
          display_order: display_order !== undefined ? parseInt(display_order, 10) : section.display_order,
          is_active: is_active !== undefined ? Boolean(is_active) : section.is_active,
        },
        { transaction: t }
      );

      // If items array is explicitly provided, update or recreate
      if (Array.isArray(items)) {
        await HomepageCategoryItem.destroy({ where: { section_id: id }, transaction: t });
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.title_en && item.image_url) {
            await HomepageCategoryItem.create(
              {
                section_id: id,
                category_id: item.category_id || null,
                title_en: item.title_en,
                title_ar: item.title_ar || item.title_en,
                image_url: item.image_url,
                link_url: item.link_url || '/products',
                display_order: item.display_order !== undefined ? item.display_order : i + 1,
                is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();

      const updated = await HomepageCategorySection.findByPk(id, {
        include: [{ model: HomepageCategoryItem, as: 'items' }],
      });

      return sendSuccess(res, 'Homepage category section updated successfully', {
        section: updated,
      });
    } catch (error) {
      await t.rollback();
      console.error('Error updating category section:', error);
      return sendError(res, error.message || 'Failed to update section', [], 500);
    }
  }

  // Admin endpoint: DELETE /api/v1/category-sections/:id
  async deleteSection(req, res) {
    try {
      const { id } = req.params;
      const section = await HomepageCategorySection.findByPk(id);
      if (!section) {
        return sendError(res, 'Category section not found', [], 404);
      }

      await section.destroy();
      return sendSuccess(res, 'Category section deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete section', [], 500);
    }
  }

  // Admin endpoint: PATCH /api/v1/category-sections/:id/toggle
  async toggleSectionStatus(req, res) {
    try {
      const { id } = req.params;
      const section = await HomepageCategorySection.findByPk(id);
      if (!section) {
        return sendError(res, 'Category section not found', [], 404);
      }

      section.is_active = !section.is_active;
      await section.save();

      return sendSuccess(res, 'Section status toggled successfully', {
        is_active: section.is_active,
      });
    } catch (error) {
      return sendError(res, error.message || 'Failed to toggle status', [], 500);
    }
  }

  // Admin endpoint: POST /api/v1/category-sections/reorder
  async reorderSections(req, res) {
    const t = await sequelize.transaction();
    try {
      const { orderList } = req.body; // [{ id, display_order }]
      if (!Array.isArray(orderList)) {
        await t.rollback();
        return sendError(res, 'orderList must be an array', [], 400);
      }

      for (const item of orderList) {
        if (item.id && item.display_order !== undefined) {
          await HomepageCategorySection.update(
            { display_order: parseInt(item.display_order, 10) },
            { where: { id: item.id }, transaction: t }
          );
        }
      }

      await t.commit();
      return sendSuccess(res, 'Sections reordered successfully');
    } catch (error) {
      await t.rollback();
      return sendError(res, error.message || 'Failed to reorder sections', [], 500);
    }
  }

  // Admin endpoint: POST /api/v1/category-sections/:sectionId/items
  async addItemToSection(req, res) {
    try {
      const { sectionId } = req.params;
      const {
        title_en,
        title_ar,
        category_id,
        link_url,
        display_order,
        is_active,
      } = req.body;

      let image_url = req.body.image_url;
      if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
      }

      if (!title_en || !image_url) {
        return sendError(res, 'Title in English and Image are required', [], 400);
      }

      const item = await HomepageCategoryItem.create({
        section_id: sectionId,
        category_id: category_id || null,
        title_en,
        title_ar: title_ar || title_en,
        image_url,
        link_url: link_url || '/products',
        display_order: display_order ? parseInt(display_order, 10) : 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      });

      return sendSuccess(res, 'Category item added successfully', { item }, 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to add item', [], 500);
    }
  }

  // Admin endpoint: PUT /api/v1/category-sections/items/:itemId
  async updateItem(req, res) {
    try {
      const { itemId } = req.params;
      const {
        title_en,
        title_ar,
        category_id,
        link_url,
        display_order,
        is_active,
      } = req.body;

      const item = await HomepageCategoryItem.findByPk(itemId);
      if (!item) {
        return sendError(res, 'Item not found', [], 404);
      }

      let image_url = req.body.image_url || item.image_url;
      if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
      }

      await item.update({
        title_en: title_en !== undefined ? title_en : item.title_en,
        title_ar: title_ar !== undefined ? title_ar : item.title_ar,
        category_id: category_id !== undefined ? category_id : item.category_id,
        image_url,
        link_url: link_url !== undefined ? link_url : item.link_url,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : item.display_order,
        is_active: is_active !== undefined ? Boolean(is_active) : item.is_active,
      });

      return sendSuccess(res, 'Category item updated successfully', { item });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update item', [], 500);
    }
  }

  // Admin endpoint: DELETE /api/v1/category-sections/items/:itemId
  async deleteItem(req, res) {
    try {
      const { itemId } = req.params;
      const item = await HomepageCategoryItem.findByPk(itemId);
      if (!item) {
        return sendError(res, 'Item not found', [], 404);
      }

      await item.destroy();
      return sendSuccess(res, 'Category item deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete item', [], 500);
    }
  }

  // Admin endpoint: PATCH /api/v1/category-sections/items/:itemId/toggle
  async toggleItemStatus(req, res) {
    try {
      const { itemId } = req.params;
      const item = await HomepageCategoryItem.findByPk(itemId);
      if (!item) {
        return sendError(res, 'Item not found', [], 404);
      }

      item.is_active = !item.is_active;
      await item.save();

      return sendSuccess(res, 'Item status toggled successfully', {
        is_active: item.is_active,
      });
    } catch (error) {
      return sendError(res, error.message || 'Failed to toggle item status', [], 500);
    }
  }
}

module.exports = new CategorySectionController();
