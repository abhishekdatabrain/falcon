const { HomepageSection, HomepageSetting, HeroBanner, PromoBanner, HomepageCategorySection, Product, Category, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

class HomepageCmsController {
  // Public Endpoint: GET /api/v1/homepage-cms/public
  async getPublicHomepageConfig(req, res) {
    try {
      const sections = await HomepageSection.findAll({
        where: { is_active: true, is_published: true },
        order: [['display_order', 'ASC']],
      });

      const settingsRecords = await HomepageSetting.findAll();
      const settings = {};
      settingsRecords.forEach((s) => {
        settings[s.setting_key] = s.value;
      });

      return sendSuccess(res, 'Public homepage CMS configuration', {
        sections: sections.map((s) => ({
          id: s.id,
          section_key: s.section_key,
          section_type: s.section_type,
          title_en: s.title_en,
          title_ar: s.title_ar,
          subtitle_en: s.subtitle_en,
          subtitle_ar: s.subtitle_ar,
          config: s.config || {},
          display_order: s.display_order,
          is_active: s.is_active,
        })),
        settings,
      });
    } catch (error) {
      console.error('Error fetching public homepage config:', error);
      return sendError(res, error.message || 'Failed to fetch homepage configuration', [], 500);
    }
  }

  // Preview Endpoint: GET /api/v1/homepage-cms/preview (for Admin Live Preview)
  async getPreviewHomepageConfig(req, res) {
    try {
      const sections = await HomepageSection.findAll({
        where: { draft_is_active: true },
        order: [['draft_display_order', 'ASC']],
      });

      const settingsRecords = await HomepageSetting.findAll();
      const settings = {};
      settingsRecords.forEach((s) => {
        settings[s.setting_key] = s.draft_value || s.value;
      });

      return sendSuccess(res, 'Preview homepage CMS configuration', {
        sections: sections.map((s) => ({
          id: s.id,
          section_key: s.section_key,
          section_type: s.section_type,
          title_en: s.title_en,
          title_ar: s.title_ar,
          subtitle_en: s.subtitle_en,
          subtitle_ar: s.subtitle_ar,
          config: s.draft_config || s.config || {},
          display_order: s.draft_display_order,
          is_active: s.draft_is_active,
          has_unpublished_changes: s.has_unpublished_changes,
        })),
        settings,
      });
    } catch (error) {
      console.error('Error fetching preview homepage config:', error);
      return sendError(res, error.message || 'Failed to fetch preview configuration', [], 500);
    }
  }

  // Admin Endpoint: GET /api/v1/homepage-cms/admin/all
  async getAllSectionsAdmin(req, res) {
    try {
      const sections = await HomepageSection.findAll({
        order: [['draft_display_order', 'ASC']],
      });

      const settingsRecords = await HomepageSetting.findAll();
      const settings = {};
      settingsRecords.forEach((s) => {
        settings[s.setting_key] = {
          live: s.value,
          draft: s.draft_value,
          has_unpublished_changes: s.has_unpublished_changes,
        };
      });

      const hasUnpublished =
        sections.some((s) => s.has_unpublished_changes) ||
        settingsRecords.some((s) => s.has_unpublished_changes);

      return sendSuccess(res, 'All homepage CMS sections retrieved', {
        sections,
        settings,
        has_unpublished_changes: hasUnpublished,
      });
    } catch (error) {
      console.error('Error fetching all CMS sections:', error);
      return sendError(res, error.message || 'Failed to fetch CMS sections', [], 500);
    }
  }

  // Admin Endpoint: POST /api/v1/homepage-cms/admin/section
  async createSection(req, res) {
    try {
      const {
        section_key,
        section_type,
        title_en,
        title_ar,
        subtitle_en,
        subtitle_ar,
        config,
        display_order,
        is_active,
        publish_immediately,
      } = req.body;

      if (!section_key || !section_type) {
        return sendError(res, 'section_key and section_type are required', [], 400);
      }

      const existing = await HomepageSection.findOne({ where: { section_key } });
      if (existing) {
        return sendError(res, `A section with key '${section_key}' already exists`, [], 400);
      }

      const count = await HomepageSection.count();
      const nextOrder = display_order !== undefined ? parseInt(display_order, 10) : count + 1;
      const willPublish = Boolean(publish_immediately);

      const section = await HomepageSection.create({
        section_key,
        section_type,
        title_en: title_en || section_key,
        title_ar: title_ar || section_key,
        subtitle_en: subtitle_en || '',
        subtitle_ar: subtitle_ar || '',
        config: willPublish ? (config || {}) : {},
        draft_config: config || {},
        display_order: nextOrder,
        draft_display_order: nextOrder,
        is_active: willPublish ? (is_active !== undefined ? Boolean(is_active) : true) : true,
        draft_is_active: is_active !== undefined ? Boolean(is_active) : true,
        is_published: willPublish,
        has_unpublished_changes: !willPublish,
      });

      return sendSuccess(res, 'Section created successfully', { section }, 201);
    } catch (error) {
      console.error('Error creating section:', error);
      return sendError(res, error.message || 'Failed to create section', [], 500);
    }
  }

  // Admin Endpoint: PUT /api/v1/homepage-cms/admin/section/:id
  async updateSection(req, res) {
    try {
      const { id } = req.params;
      const {
        title_en,
        title_ar,
        subtitle_en,
        subtitle_ar,
        config,
        display_order,
        is_active,
        publish_immediately,
      } = req.body;

      const section = await HomepageSection.findByPk(id);
      if (!section) {
        return sendError(res, 'Section not found', [], 404);
      }

      const willPublish = Boolean(publish_immediately);
      const newConfig = config !== undefined ? config : section.draft_config;
      const newOrder = display_order !== undefined ? parseInt(display_order, 10) : section.draft_display_order;
      const newActive = is_active !== undefined ? Boolean(is_active) : section.draft_is_active;

      section.title_en = title_en !== undefined ? title_en : section.title_en;
      section.title_ar = title_ar !== undefined ? title_ar : section.title_ar;
      section.subtitle_en = subtitle_en !== undefined ? subtitle_en : section.subtitle_en;
      section.subtitle_ar = subtitle_ar !== undefined ? subtitle_ar : section.subtitle_ar;
      section.draft_config = newConfig;
      section.draft_display_order = newOrder;
      section.draft_is_active = newActive;

      if (willPublish) {
        section.config = newConfig;
        section.display_order = newOrder;
        section.is_active = newActive;
        section.is_published = true;
        section.has_unpublished_changes = false;
      } else {
        section.has_unpublished_changes = true;
      }

      await section.save();

      return sendSuccess(res, 'Section updated successfully', { section });
    } catch (error) {
      console.error('Error updating section:', error);
      return sendError(res, error.message || 'Failed to update section', [], 500);
    }
  }

  // Admin Endpoint: DELETE /api/v1/homepage-cms/admin/section/:id
  async deleteSection(req, res) {
    try {
      const { id } = req.params;
      const section = await HomepageSection.findByPk(id);
      if (!section) {
        return sendError(res, 'Section not found', [], 404);
      }

      await section.destroy();
      return sendSuccess(res, 'Section deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete section', [], 500);
    }
  }

  // Admin Endpoint: POST /api/v1/homepage-cms/admin/reorder
  async reorderSections(req, res) {
    const t = await sequelize.transaction();
    try {
      const { orderList, publish_immediately } = req.body; // [{ id, display_order }]
      if (!Array.isArray(orderList)) {
        await t.rollback();
        return sendError(res, 'orderList must be an array', [], 400);
      }

      const willPublish = Boolean(publish_immediately);

      for (const item of orderList) {
        if (item.id && item.display_order !== undefined) {
          const updateData = {
            draft_display_order: parseInt(item.display_order, 10),
            has_unpublished_changes: !willPublish,
          };
          if (willPublish) {
            updateData.display_order = parseInt(item.display_order, 10);
            updateData.has_unpublished_changes = false;
          }
          await HomepageSection.update(updateData, { where: { id: item.id }, transaction: t });
        }
      }

      await t.commit();
      return sendSuccess(res, 'Sections reordered successfully');
    } catch (error) {
      await t.rollback();
      return sendError(res, error.message || 'Failed to reorder sections', [], 500);
    }
  }

  // Admin Endpoint: PATCH /api/v1/homepage-cms/admin/section/:id/toggle
  async toggleSectionDraft(req, res) {
    try {
      const { id } = req.params;
      const section = await HomepageSection.findByPk(id);
      if (!section) {
        return sendError(res, 'Section not found', [], 404);
      }

      section.draft_is_active = !section.draft_is_active;
      section.has_unpublished_changes = true;
      await section.save();

      return sendSuccess(res, 'Section status toggled in draft', {
        draft_is_active: section.draft_is_active,
        has_unpublished_changes: section.has_unpublished_changes,
      });
    } catch (error) {
      return sendError(res, error.message || 'Failed to toggle section status', [], 500);
    }
  }

  // Admin Endpoint: POST /api/v1/homepage-cms/admin/publish (Publish all draft changes live)
  async publishAllChanges(req, res) {
    const t = await sequelize.transaction();
    try {
      const sections = await HomepageSection.findAll({ transaction: t });
      for (const s of sections) {
        s.config = s.draft_config || s.config || {};
        s.display_order = s.draft_display_order !== undefined ? s.draft_display_order : s.display_order;
        s.is_active = s.draft_is_active !== undefined ? s.draft_is_active : s.is_active;
        s.is_published = true;
        s.has_unpublished_changes = false;
        await s.save({ transaction: t });
      }

      const settings = await HomepageSetting.findAll({ transaction: t });
      for (const st of settings) {
        st.value = st.draft_value || st.value || {};
        st.has_unpublished_changes = false;
        await st.save({ transaction: t });
      }

      await t.commit();
      return sendSuccess(res, 'All homepage changes published live to the storefront successfully!');
    } catch (error) {
      await t.rollback();
      console.error('Error publishing homepage changes:', error);
      return sendError(res, error.message || 'Failed to publish changes', [], 500);
    }
  }

  // Admin Endpoint: POST /api/v1/homepage-cms/admin/discard-draft (Revert draft to published)
  async discardDraftChanges(req, res) {
    const t = await sequelize.transaction();
    try {
      const sections = await HomepageSection.findAll({ transaction: t });
      for (const s of sections) {
        s.draft_config = s.config || {};
        s.draft_display_order = s.display_order;
        s.draft_is_active = s.is_active;
        s.has_unpublished_changes = false;
        await s.save({ transaction: t });
      }

      const settings = await HomepageSetting.findAll({ transaction: t });
      for (const st of settings) {
        st.draft_value = st.value || {};
        st.has_unpublished_changes = false;
        await st.save({ transaction: t });
      }

      await t.commit();
      return sendSuccess(res, 'Draft changes discarded. Reverted to live published state.');
    } catch (error) {
      await t.rollback();
      return sendError(res, error.message || 'Failed to discard draft changes', [], 500);
    }
  }

  // Admin Endpoint: GET /api/v1/homepage-cms/admin/settings
  async getSettings(req, res) {
    try {
      const records = await HomepageSetting.findAll();
      const settings = {};
      records.forEach((r) => {
        settings[r.setting_key] = {
          live: r.value,
          draft: r.draft_value,
          has_unpublished_changes: r.has_unpublished_changes,
        };
      });
      return sendSuccess(res, 'Homepage settings retrieved', { settings });
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch settings', [], 500);
    }
  }

  // Admin Endpoint: PUT /api/v1/homepage-cms/admin/settings
  async updateSettings(req, res) {
    try {
      const { setting_key, value, publish_immediately } = req.body;
      if (!setting_key) {
        return sendError(res, 'setting_key is required', [], 400);
      }

      const willPublish = Boolean(publish_immediately);
      let record = await HomepageSetting.findOne({ where: { setting_key } });

      if (!record) {
        record = await HomepageSetting.create({
          setting_key,
          value: willPublish ? (value || {}) : {},
          draft_value: value || {},
          has_unpublished_changes: !willPublish,
        });
      } else {
        record.draft_value = value || {};
        if (willPublish) {
          record.value = value || {};
          record.has_unpublished_changes = false;
        } else {
          record.has_unpublished_changes = true;
        }
        await record.save();
      }

      return sendSuccess(res, 'Settings updated successfully', { record });
    } catch (error) {
      return sendError(res, error.message || 'Failed to update settings', [], 500);
    }
  }
}

module.exports = new HomepageCmsController();
