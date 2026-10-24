const { Product, ProductVariant, ProductImage, Category, Feedback, StockLog, sequelize } = require('../models');
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
      show_on_store,
      showOnStore,
      best_deals_or_store,
      is_popular_pick,
      isPopularPick,
    } = query;

    const where = {};

    // 1. Status Filter: active / inactive / all
    const rawStatus = (query.status || '').toLowerCase();
    const rawIsActive = query.is_active;

    if (rawStatus === 'active' || rawIsActive === 'true' || rawIsActive === true) {
      where.is_active = true;
    } else if (rawStatus === 'inactive' || rawIsActive === 'false' || rawIsActive === false) {
      where.is_active = false;
    } else if (rawStatus === 'all' || query.onlyActive === false || query.onlyActive === 'false') {
      // Return both active and inactive
    } else if (onlyActive) {
      where.is_active = true;
      where.is_available = true;
    }

    // 2. Date Range Filter on created_at
    const rawStartDate = query.startDate || query.start_date || query.fromDate || query.from_date;
    const rawEndDate = query.endDate || query.end_date || query.toDate || query.to_date;

    if (rawStartDate || rawEndDate) {
      const dateFilter = {};
      if (rawStartDate) {
        const start = new Date(rawStartDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          dateFilter[Op.gte] = start;
        }
      }
      if (rawEndDate) {
        const end = new Date(rawEndDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter[Op.lte] = end;
        }
      }
      if (Object.keys(dateFilter).length > 0 || Object.getOwnPropertySymbols(dateFilter).length > 0) {
        where.created_at = dateFilter;
      }
    }

    if (best_deals_or_store !== undefined && (String(best_deals_or_store) === 'true' || best_deals_or_store === true)) {
      where[Op.or] = [
        { is_best_deal: true },
        { show_on_store: true }
      ];
    } else {
      if (is_best_deal !== undefined || isBestDeal !== undefined) {
        const val = is_best_deal !== undefined ? is_best_deal : isBestDeal;
        where.is_best_deal = String(val) === 'true';
      }

      if (show_on_store !== undefined || showOnStore !== undefined) {
        const val = show_on_store !== undefined ? show_on_store : showOnStore;
        where.show_on_store = String(val) === 'true';
      }
    }

    if (is_popular_pick !== undefined || isPopularPick !== undefined) {
      const val = is_popular_pick !== undefined ? is_popular_pick : isPopularPick;
      where.is_popular_pick = String(val) === 'true';
    }

    const activeLeafId = subSubSubcategoryId || sub_sub_subcategory_id;
    const activeSubSubId = subSubcategoryId || sub_subcategory_id;
    const activeSubId = subcategoryId;
    const activeCatId = categoryId;
    const rawCategoryInput = query.categoryIds || query.category_ids || activeLeafId || activeSubSubId || activeSubId || activeCatId;

    if (rawCategoryInput) {
      const inputList = Array.isArray(rawCategoryInput)
        ? rawCategoryInput
        : String(rawCategoryInput).split(',').map((s) => s.trim()).filter(Boolean);

      if (inputList.length > 0) {
        // Helper to collect all descendant category IDs recursively
        const getDescendantIds = async (parentIds) => {
          const children = await Category.findAll({
            where: { parent_id: { [Op.in]: parentIds } },
            attributes: ['id']
          });
          if (children.length === 0) return [];
          const childIds = children.map((c) => c.id);
          const deeper = await getDescendantIds(childIds);
          return [...childIds, ...deeper];
        };

        const allTargetIds = new Set();

        for (const item of inputList) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item);
          const catObj = await Category.findOne({
            where: isUUID
              ? { [Op.or]: [{ id: item }, { slug: item }] }
              : { slug: item }
          });

          if (catObj) {
            allTargetIds.add(catObj.id);
            const descendantIds = await getDescendantIds([catObj.id]);
            descendantIds.forEach((id) => allTargetIds.add(id));
          } else if (isUUID) {
            allTargetIds.add(item);
          }
        }

        if (allTargetIds.size > 0) {
          const targetArray = Array.from(allTargetIds);
          const categoryCondition = {
            [Op.or]: [
              { category_id: { [Op.in]: targetArray } },
              { subcategory_id: { [Op.in]: targetArray } },
              { sub_subcategory_id: { [Op.in]: targetArray } },
              { sub_sub_subcategory_id: { [Op.in]: targetArray } }
            ]
          };
          if (!where[Op.and]) where[Op.and] = [];
          where[Op.and].push(categoryCondition);
        }
      }
    }

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { name_en: { [Op.iLike]: `%${search}%` } },
          { name_ar: { [Op.iLike]: `%${search}%` } },
          { brand: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } },
          { description_en: { [Op.iLike]: `%${search}%` } },
          { description_ar: { [Op.iLike]: `%${search}%` } },
        ]
      };
      if (!where[Op.and]) where[Op.and] = [];
      where[Op.and].push(searchCondition);
    }

    const minP = minPrice !== undefined && minPrice !== '' ? parseFloat(minPrice) : (query.min_price !== undefined && query.min_price !== '' ? parseFloat(query.min_price) : null);
    const maxP = maxPrice !== undefined && maxPrice !== '' ? parseFloat(maxPrice) : (query.max_price !== undefined && query.max_price !== '' ? parseFloat(query.max_price) : null);

    if (minP !== null || maxP !== null) {
      const priceFilter = {};
      if (minP !== null && !isNaN(minP)) priceFilter[Op.gte] = minP;
      if (maxP !== null && !isNaN(maxP)) priceFilter[Op.lte] = maxP;
      where.price = priceFilter;
    }

    const activeBrand = query.brand || query.brands;
    if (activeBrand) {
      const brandList = Array.isArray(activeBrand)
        ? activeBrand
        : String(activeBrand).split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        where.brand = { [Op.in]: brandList };
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = query.all === 'true' || query.all === true ? 10000 : parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build robust server-side order clause based on sort / sortBy / sortOrder
    let orderClause = [['created_at', 'DESC']];
    const sortKey = (query.sort || sortBy || '').toLowerCase();
    const sortDir = (query.sortOrder || sortOrder || 'DESC').toUpperCase();

    if (sortKey === 'price_asc' || (sortKey === 'price' && sortDir === 'ASC')) {
      orderClause = [['price', 'ASC']];
    } else if (sortKey === 'price_desc' || (sortKey === 'price' && sortDir === 'DESC')) {
      orderClause = [['price', 'DESC']];
    } else if (sortKey === 'rating' || sortKey === 'highest_rated') {
      orderClause = [['rating', 'DESC'], ['created_at', 'DESC']];
    } else if (sortKey === 'popularity' || sortKey === 'popular') {
      orderClause = [['is_popular_pick', 'DESC'], ['is_best_seller', 'DESC'], ['rating', 'DESC'], ['created_at', 'DESC']];
    } else if (sortKey === 'featured') {
      orderClause = [['is_featured', 'DESC'], ['created_at', 'DESC']];
    } else if (sortKey === 'newest') {
      orderClause = [['created_at', 'DESC']];
    } else if (sortKey === 'oldest') {
      orderClause = [['created_at', 'ASC']];
    } else if (sortKey === 'name_asc') {
      orderClause = [['name_en', 'ASC']];
    } else if (sortKey === 'name_desc') {
      orderClause = [['name_en', 'DESC']];
    }

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
        {
          model: ProductVariant, as: 'variants', separate: true, order: [['price', 'ASC']]
        },
        {
          model: Feedback, as: 'feedbacks', attributes: ['id', 'rating', 'comment'], separate: true
        },
      ],
      order: orderClause,
      limit: limitNum,
      offset,
      distinct: true,
    });

    // Fetch dynamic brands list with counts
    let brandFacets = [];
    try {
      const dbBrands = await Product.findAll({
        attributes: [
          'brand',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          brand: {
            [Op.ne]: null,
            [Op.ne]: '',
          },
          ...(onlyActive ? { is_active: true, is_available: true } : {})
        },
        group: ['brand'],
        order: [[sequelize.literal('count'), 'DESC']],
        raw: true,
      });

      brandFacets = (dbBrands || []).map(b => ({
        name: b.brand,
        count: parseInt(b.count || '0', 10),
      })).filter(b => b.name && b.name.trim() !== '');
    } catch (bErr) {
      console.warn('Brand aggregation error:', bErr.message);
    }

    const { buildPaginationResponse } = require('../utils/pagination');
    const pagination = buildPaginationResponse(total, pageNum, limitNum);

    return {
      products,
      records: products,
      pagination,
      brands: brandFacets,
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
        { model: ProductVariant, as: 'variants', separate: true, order: [['price', 'ASC']] },
        { model: Feedback, as: 'feedbacks', attributes: ['id', 'rating', 'comment'], separate: true },
      ],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async validateVariants(variants, existingProductId = null) {
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('At least one variant must be provided when variants are enabled');
    }

    const skuSet = new Set();
    for (const v of variants) {
      const sku = (v.sku || '').trim();
      if (!sku) {
        throw new Error('Each variant must have a valid SKU');
      }
      if (skuSet.has(sku)) {
        throw new Error(`Duplicate SKU "${sku}" found within product variants`);
      }
      skuSet.add(sku);

      const price = parseFloat(v.price);
      if (isNaN(price) || price < 0) {
        throw new Error(`Variant price must be a valid non-negative number for SKU "${sku}"`);
      }

      if (v.discount_price !== undefined && v.discount_price !== null && v.discount_price !== '') {
        const disc = parseFloat(v.discount_price);
        if (isNaN(disc) || disc < 0) {
          throw new Error(`Variant discount price must be a valid non-negative number for SKU "${sku}"`);
        }
      }

      const stock = parseInt(v.stock_quantity !== undefined ? v.stock_quantity : 0, 10);
      if (isNaN(stock) || stock < 0) {
        throw new Error(`Variant stock cannot be negative for SKU "${sku}"`);
      }

      // Check for SKU conflicts in Products table
      const conflictProduct = await Product.findOne({
        where: {
          sku,
          ...(existingProductId ? { id: { [Op.ne]: existingProductId } } : {}),
        },
      });
      if (conflictProduct) {
        throw new Error(`Variant SKU "${sku}" conflicts with an existing product SKU`);
      }

      // Check for SKU conflicts in ProductVariants table
      const conflictVariant = await ProductVariant.findOne({
        where: {
          sku,
          ...(existingProductId ? { product_id: { [Op.ne]: existingProductId } } : {}),
        },
      });
      if (conflictVariant) {
        throw new Error(`Variant SKU "${sku}" is already in use by another product variant`);
      }
    }
  }

  sanitizeBadgeArray(items) {
    if (!Array.isArray(items)) return [];
    const ALLOWED_ICONS = new Set([
      'Check', 'Sparkles', 'Leaf', 'Zap', 'ShieldCheck', 'Award', 'Heart',
      'Star', 'Apple', 'Sun', 'Flame', 'Clock', 'Droplets', 'Package', 'Truck', 'CheckCircle2'
    ]);
    return items
      .map(item => {
        if (!item) return null;
        if (typeof item === 'string') {
          const trimmed = item.trim().slice(0, 100);
          return trimmed ? { text: trimmed, text_en: trimmed, text_ar: '', icon: 'Check' } : null;
        }
        if (typeof item === 'object') {
          const text_en = String(item.text_en || item.text || '').trim().slice(0, 100);
          const text_ar = String(item.text_ar || '').trim().slice(0, 100);
          const rawIcon = String(item.icon || 'Check').trim();
          const icon = ALLOWED_ICONS.has(rawIcon) ? rawIcon : 'Check';
          if (!text_en && !text_ar) return null;
          return {
            text: text_en || text_ar,
            text_en,
            text_ar,
            icon,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  sanitizeHighlightArray(items) {
    if (!Array.isArray(items)) return [];
    const ALLOWED_ICONS = new Set([
      'Check', 'Sparkles', 'Leaf', 'Zap', 'ShieldCheck', 'Award', 'Heart',
      'Star', 'Apple', 'Sun', 'Flame', 'Clock', 'Droplets', 'Package', 'Truck', 'CheckCircle2'
    ]);
    return items
      .map(item => {
        if (!item) return null;
        if (typeof item === 'string') {
          const trimmed = item.trim().slice(0, 150);
          return trimmed ? { text: trimmed, text_en: trimmed, text_ar: '', icon: 'Check' } : null;
        }
        if (typeof item === 'object') {
          const text_en = String(item.text_en || item.text || '').trim().slice(0, 150);
          const text_ar = String(item.text_ar || '').trim().slice(0, 150);
          const rawIcon = String(item.icon || 'Check').trim();
          const icon = ALLOWED_ICONS.has(rawIcon) ? rawIcon : 'Check';
          if (!text_en && !text_ar) return null;
          return {
            text: text_en || text_ar,
            text_en,
            text_ar,
            icon,
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  async createProduct(data) {
    const {
      category_id,
      subcategory_id,
      sub_subcategory_id,
      sub_sub_subcategory_id,
      sku,
      name_en,
      name_ar,
      description_title_en,
      description_title_ar,
      description_en,
      description_ar,
      long_description_en,
      long_description_ar,
      highlights,
      feature_badges,
      nutrition_facts,
      brand,
      unit,
      unit_type,
      unit_value,
      pack_size,
      sold_by,
      price,
      purchase_price,
      discount_price,
      vat_percentage,
      price_includes_vat,
      stock_quantity,
      is_available,
      is_active,
      is_featured,
      is_new_arrival,
      is_best_seller,
      is_best_deal,
      is_popular_pick,
      has_variants,
      variants,
      images,
      rating,
      reviews_count,
      reviews,
    } = data;

    let parsedHighlights = highlights;
    if (typeof parsedHighlights === 'string') {
      try { parsedHighlights = JSON.parse(parsedHighlights); } catch (e) { parsedHighlights = []; }
    }
    parsedHighlights = this.sanitizeHighlightArray(parsedHighlights);

    let parsedBadges = feature_badges;
    if (typeof parsedBadges === 'string') {
      try { parsedBadges = JSON.parse(parsedBadges); } catch (e) { parsedBadges = []; }
    }
    parsedBadges = this.sanitizeBadgeArray(parsedBadges);

    let parsedNutrition = nutrition_facts;
    if (typeof parsedNutrition === 'string') {
      try { parsedNutrition = JSON.parse(parsedNutrition); } catch (e) { parsedNutrition = {}; }
    }

    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) {
      throw new Error(`Product SKU "${sku}" already exists`);
    }

    const hasVariantsBool = Boolean(has_variants);
    if (hasVariantsBool) {
      await this.validateVariants(variants);
    }

    const computedUnit = (unit_value && unit_type) ? `${unit_value} ${unit_type}` : (unit || 'PCS');

    let basePrice = price;
    let baseStock = stock_quantity || 0;
    if (hasVariantsBool && variants && variants.length > 0) {
      const minVariantPrice = Math.min(...variants.map(v => parseFloat(v.price)));
      if (basePrice === undefined || basePrice === null || basePrice === '') {
        basePrice = minVariantPrice;
      }
      baseStock = variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0, 10), 0);
    }

    return await sequelize.transaction(async (t) => {
      const product = await Product.create({
        category_id,
        subcategory_id: subcategory_id || null,
        sub_subcategory_id: sub_subcategory_id || null,
        sub_sub_subcategory_id: sub_sub_subcategory_id || null,
        sku,
        name_en,
        name_ar,
        description_title_en: description_title_en || null,
        description_title_ar: description_title_ar || null,
        description_en: description_en || null,
        description_ar: description_ar || null,
        long_description_en: long_description_en || null,
        long_description_ar: long_description_ar || null,
        highlights: Array.isArray(parsedHighlights) ? parsedHighlights : [],
        feature_badges: Array.isArray(parsedBadges) ? parsedBadges : [],
        nutrition_facts: (typeof parsedNutrition === 'object' && parsedNutrition !== null) ? parsedNutrition : {},
        brand: brand || '',
        unit: computedUnit,
        unit_type: unit_type || null,
        unit_value: unit_value || null,
        pack_size: pack_size || null,
        sold_by: sold_by || null,
        price: basePrice,
        purchase_price: purchase_price ? parseFloat(purchase_price) : null,
        discount_price: discount_price ? parseFloat(discount_price) : null,
        vat_percentage: vat_percentage !== undefined && vat_percentage !== '' ? parseFloat(vat_percentage) : 15.00,
        price_includes_vat: price_includes_vat !== undefined ? Boolean(price_includes_vat) : true,
        stock_quantity: baseStock,
        is_available: is_available !== undefined ? Boolean(is_available) : true,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        is_featured: is_featured !== undefined ? Boolean(is_featured) : false,
        is_new_arrival: is_new_arrival !== undefined ? Boolean(is_new_arrival) : true,
        is_best_seller: is_best_seller !== undefined ? Boolean(is_best_seller) : false,
        is_best_deal: is_best_deal !== undefined ? Boolean(is_best_deal) : false,
        show_on_store: show_on_store !== undefined ? Boolean(show_on_store) : false,
        is_popular_pick: is_popular_pick !== undefined ? Boolean(is_popular_pick) : false,
        has_variants: hasVariantsBool,
        rating: rating !== undefined && rating !== '' ? parseFloat(rating) : 4.8,
        reviews_count: (reviews_count !== undefined && reviews_count !== '') ? parseInt(reviews_count, 10) : ((reviews !== undefined && reviews !== '') ? parseInt(reviews, 10) : 120),
      }, { transaction: t });

      if (hasVariantsBool && Array.isArray(variants) && variants.length > 0) {
        const variantRecords = variants.map((v) => ({
          product_id: product.id,
          sku: v.sku.trim(),
          unit_value: v.unit_value || null,
          unit_type: v.unit_type || null,
          pack_size: v.pack_size || null,
          price: parseFloat(v.price),
          discount_price: v.discount_price !== undefined && v.discount_price !== null && v.discount_price !== '' ? parseFloat(v.discount_price) : null,
          stock_quantity: parseInt(v.stock_quantity || 0, 10),
          image_url: v.image_url || null,
          is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
        }));
        await ProductVariant.bulkCreate(variantRecords, { transaction: t });
      }

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
          { model: ProductVariant, as: 'variants', separate: true, order: [['price', 'ASC']] },
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

    if (cleanData.rating !== undefined) {
      cleanData.rating = cleanData.rating !== '' && cleanData.rating !== null ? parseFloat(cleanData.rating) : null;
    }
    if (cleanData.reviews_count !== undefined) {
      cleanData.reviews_count = cleanData.reviews_count !== '' && cleanData.reviews_count !== null ? parseInt(cleanData.reviews_count, 10) : 0;
    } else if (cleanData.reviews !== undefined) {
      cleanData.reviews_count = cleanData.reviews !== '' && cleanData.reviews !== null ? parseInt(cleanData.reviews, 10) : 0;
    }

    if (cleanData.highlights !== undefined) {
      if (typeof cleanData.highlights === 'string') {
        try { cleanData.highlights = JSON.parse(cleanData.highlights); } catch (e) { cleanData.highlights = []; }
      }
      cleanData.highlights = this.sanitizeHighlightArray(cleanData.highlights);
    }
    if (cleanData.feature_badges !== undefined) {
      if (typeof cleanData.feature_badges === 'string') {
        try { cleanData.feature_badges = JSON.parse(cleanData.feature_badges); } catch (e) { cleanData.feature_badges = []; }
      }
      cleanData.feature_badges = this.sanitizeBadgeArray(cleanData.feature_badges);
    }
    if (cleanData.nutrition_facts !== undefined && typeof cleanData.nutrition_facts === 'string') {
      try { cleanData.nutrition_facts = JSON.parse(cleanData.nutrition_facts); } catch (e) { cleanData.nutrition_facts = {}; }
    }

    const hasVariantsBool = cleanData.has_variants !== undefined ? Boolean(cleanData.has_variants) : product.has_variants;
    if (hasVariantsBool && cleanData.variants) {
      await this.validateVariants(cleanData.variants, id);
    }

    return await sequelize.transaction(async (t) => {
      if (hasVariantsBool && cleanData.variants && cleanData.variants.length > 0) {
        const existingVariants = await ProductVariant.findAll({ where: { product_id: id }, transaction: t });
        const existingIds = existingVariants.map(ev => ev.id);
        const incomingIds = cleanData.variants.map(v => v.id).filter(Boolean);

        // Delete variants that were removed
        const toDeleteIds = existingIds.filter(eId => !incomingIds.includes(eId));
        if (toDeleteIds.length > 0) {
          await ProductVariant.destroy({ where: { id: { [Op.in]: toDeleteIds } }, transaction: t });
        }

        // Upsert variants
        for (const v of cleanData.variants) {
          const varPayload = {
            product_id: id,
            sku: v.sku.trim(),
            unit_value: v.unit_value || null,
            unit_type: v.unit_type || null,
            pack_size: v.pack_size || null,
            price: parseFloat(v.price),
            discount_price: v.discount_price !== undefined && v.discount_price !== null && v.discount_price !== '' ? parseFloat(v.discount_price) : null,
            stock_quantity: parseInt(v.stock_quantity || 0, 10),
            image_url: v.image_url || null,
            is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
          };

          if (v.id && existingIds.includes(v.id)) {
            await ProductVariant.update(varPayload, { where: { id: v.id }, transaction: t });
          } else {
            await ProductVariant.create(varPayload, { transaction: t });
          }
        }

        // Sync product level stock and base price
        const totalStock = cleanData.variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0, 10), 0);
        cleanData.stock_quantity = totalStock;
        const minVariantPrice = Math.min(...cleanData.variants.map(v => parseFloat(v.price)));
        if (!cleanData.price || cleanData.price === '') {
          cleanData.price = minVariantPrice;
        }
      } else if (cleanData.has_variants === false && product.has_variants) {
        // Toggled off variants
        await ProductVariant.destroy({ where: { product_id: id }, transaction: t });
      }

      if (cleanData.is_available !== undefined) {
        cleanData.is_available = Boolean(cleanData.is_available);
      }

      // Remove variants array from cleanData before calling product.update
      delete cleanData.variants;

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
          { model: ProductVariant, as: 'variants', separate: true, order: [['price', 'ASC']] },
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
