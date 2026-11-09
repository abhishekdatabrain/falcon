const { HomepageCategorySection, HomepageCategoryItem, Category, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

class CategorySectionController {
  // Public endpoint: GET /api/v1/category-sections/active
  async getActiveSections(req, res) {
    try {
      const sections = await HomepageCategorySection.findAll({
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
      });

      // Filter and limit items according to max_items per section
      const formattedSections = sections.map((section) => {
        const plainSection = section.get({ plain: true });
        const sortedItems = (plainSection.items || []).sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        const maxItems = plainSection.max_items || 6;
        plainSection.items = sortedItems.slice(0, maxItems);
        return plainSection;
      });

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
      const sections = await HomepageCategorySection.findAll({
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
      });

      const formattedSections = sections.map((sec) => {
        const plain = sec.get({ plain: true });
        plain.items = (plain.items || []).sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        return plain;
      });

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
      } = req.body;

      if (!title_en || !title_ar) {
        await t.rollback();
        return sendError(res, 'Both English and Arabic titles are required', [], 400);
      }

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
      } = req.body;

      const section = await HomepageCategorySection.findByPk(id, { transaction: t });
      if (!section) {
        await t.rollback();
        return sendError(res, 'Category section not found', [], 404);
      }

      await section.update(
        {
          title_en: title_en !== undefined ? title_en : section.title_en,
          title_ar: title_ar !== undefined ? title_ar : section.title_ar,
          view_more_link: view_more_link !== undefined ? view_more_link : section.view_more_link,
          view_more_text_en: view_more_text_en !== undefined ? view_more_text_en : section.view_more_text_en,
          view_more_text_ar: view_more_text_ar !== undefined ? view_more_text_ar : section.view_more_text_ar,
          bg_color: bg_color !== undefined ? bg_color : section.bg_color,
          max_items: max_items !== undefined ? parseInt(max_items, 10) : section.max_items,
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
