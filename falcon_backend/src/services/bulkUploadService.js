const XLSX = require('xlsx');
const { Op } = require('sequelize');
const {
  sequelize,
  Category,
  Product,
  ProductVariant,
  ProductVariantImage,
  ProductImage,
  BulkUploadHistory,
  User,
} = require('../models');

// Track in-flight import locks to prevent duplicate submissions
const activeImportLocks = new Set();

class BulkUploadService {
  /**
   * Helper: Normalize string keys for header mapping
   */
  normalizeKey(key) {
    if (!key) return '';
    return String(key).trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  }

  /**
   * Helper: Validate and clean image references
   * Returns: { valid: boolean, url: string, error?: string, warning?: string }
   */
  processImageRef(rawRef) {
    if (!rawRef || typeof rawRef !== 'string') return null;
    const ref = rawRef.trim();
    if (!ref) return null;

    // Reject local desktop filesystem paths
    if (/^[a-zA-Z]:\\|^file:\/\/|^\/Users\/|^\/home\//i.test(ref)) {
      return {
        valid: false,
        error: `Local filesystem path "${ref}" is not accessible on server. Use uploaded image filename or public HTTP URL.`,
      };
    }

    // Direct HTTP/HTTPS URL
    if (ref.startsWith('http://') || ref.startsWith('https://')) {
      return { valid: true, url: ref };
    }

    // Relative uploads path
    if (ref.startsWith('/uploads/')) {
      return { valid: true, url: ref };
    }

    // Just filename e.g. "product-123.jpg" -> map to /uploads/product-123.jpg
    const cleanFilename = ref.replace(/^\/+/, '');
    return { valid: true, url: `/uploads/${cleanFilename}` };
  }

  /**
   * Parse uploaded file buffer (XLSX or CSV)
   */
  parseFileBuffer(buffer) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Uploaded file is empty or corrupted');
    }

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Uploaded file has no readable sheets');
    }

    // Use the first non-instructions sheet
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      if (!name.toLowerCase().includes('instruction')) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('The uploaded sheet contains no data rows');
    }

    if (rawRows.length > 5000) {
      throw new Error(`Row limit exceeded. Maximum 5000 rows per batch (found ${rawRows.length} rows)`);
    }

    // Normalize keys in every row
    return rawRows.map((row) => {
      const normalizedRow = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[this.normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
      }
      return normalizedRow;
    });
  }

  // =========================================================================
  // 1. TEMPLATES GENERATION
  // =========================================================================

  /**
   * Generates downloadable Category sample template
   */
  getCategoryTemplate(format = 'xlsx') {
    const sampleCategories = [
      {
        category_code: 'CAT_BEVERAGES',
        parent_category_code: '',
        name_en: 'Beverages & Drinks',
        name_ar: 'المشروبات والعصائر',
        slug: 'beverages-drinks',
        image_url: 'beverages-hero.jpg',
        is_active: 'TRUE',
      },
      {
        category_code: 'SUB_JUICES',
        parent_category_code: 'CAT_BEVERAGES',
        name_en: 'Fresh Juices',
        name_ar: 'عصائر طازجة',
        slug: 'fresh-juices',
        image_url: 'fresh-juices.jpg',
        is_active: 'TRUE',
      },
      {
        category_code: 'SUB_CITRUS',
        parent_category_code: 'SUB_JUICES',
        name_en: 'Citrus Blends',
        name_ar: 'خلطات الحمضيات',
        slug: 'citrus-blends',
        image_url: 'citrus.jpg',
        is_active: 'TRUE',
      },
      {
        category_code: 'SUB_ORANGE_JUICE',
        parent_category_code: 'SUB_CITRUS',
        name_en: 'Organic Orange Juice',
        name_ar: 'عصير برتقال عضوي',
        slug: 'organic-orange-juice',
        image_url: 'organic-orange.jpg',
        is_active: 'TRUE',
      },
      {
        category_code: 'CAT_DAIRY',
        parent_category_code: '',
        name_en: 'Dairy & Eggs',
        name_ar: 'منتجات الألبان والبيض',
        slug: 'dairy-eggs',
        image_url: 'dairy.jpg',
        is_active: 'TRUE',
      },
    ];

    const instructions = [
      ['FALCON CATEGORY BULK IMPORT TEMPLATE INSTRUCTIONS'],
      [''],
      ['Column Name', 'Required', 'Description', 'Allowed Values / Format'],
      ['category_code', 'YES', 'Unique category identifier', 'Unique string (e.g. CAT_FOOD, SUB_SNACKS). Never change this once set.'],
      ['parent_category_code', 'NO', 'Parent category code for subcategories', 'Must match an existing category_code in DB or in this file. Leave BLANK for Level 1 main categories.'],
      ['name_en', 'YES', 'English display name', 'e.g. Fresh Juices'],
      ['name_ar', 'YES', 'Arabic display name', 'e.g. عصائر طازجة'],
      ['slug', 'NO', 'URL friendly identifier', 'e.g. fresh-juices. If empty, automatically generated from English name.'],
      ['image_url', 'NO', 'Image filename or URL', 'e.g. "juice.jpg" or full URL "https://...". Do NOT use local paths like C:\\...'],
      ['is_active', 'NO', 'Category visibility status', 'TRUE or FALSE (default: TRUE)'],
      [''],
      ['CATEGORY HIERARCHY RULES:'],
      ['1. Up to 4 levels supported: Level 1 (Main) -> Level 2 (Sub) -> Level 3 (Sub-Sub) -> Level 4 (Sub-Sub-Sub)'],
      ['2. Parent categories must be declared before or alongside children.'],
      ['3. Circular hierarchies (A -> B -> A) are strictly rejected.'],
    ];

    const wb = XLSX.utils.book_new();
    const wsTemplate = XLSX.utils.json_to_sheet(sampleCategories);
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Categories');

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    return XLSX.write(wb, { type: 'buffer', bookType });
  }

  /**
   * Generates downloadable Product sample template
   */
  getProductTemplate(format = 'xlsx') {
    const sampleProducts = [
      {
        product_sku: 'PRD-ORG-001',
        name_en: 'Falcon Pure Orange Juice 1L',
        name_ar: 'عصير برتقال نقي فالكون 1 لتر',
        category_code: 'SUB_ORANGE_JUICE',
        brand: 'Falcon Fresh',
        unit: '1 L Bottle',
        unit_value: '1',
        unit_type: 'L',
        pack_size: 'Single',
        price: '14.50',
        discount_price: '12.00',
        purchase_price: '8.50',
        stock_quantity: '100',
        description_en: '100% pure squeezed cold pressed orange juice.',
        description_ar: 'عصير برتقال طبيعي 100٪ معصور على البارد.',
        is_active: 'TRUE',
        is_featured: 'TRUE',
        is_best_deal: 'FALSE',
        has_variants: 'FALSE',
        variant_sku: '',
        variant_unit_value: '',
        variant_unit_type: '',
        variant_pack_size: '',
        variant_price: '',
        variant_discount_price: '',
        variant_stock_quantity: '',
        images: 'orange-front.jpg, orange-back.jpg',
      },
      {
        product_sku: 'PRD-ALM-MILK',
        name_en: 'Almarai Fresh Milk',
        name_ar: 'حليب المراعي طازج',
        category_code: 'CAT_DAIRY',
        brand: 'Almarai',
        unit: 'Bottle',
        unit_value: '',
        unit_type: '',
        pack_size: '',
        price: '5.50',
        discount_price: '',
        purchase_price: '3.50',
        stock_quantity: '300',
        description_en: 'Fresh whole cow milk pasteurized daily.',
        description_ar: 'حليب أبقار طازج كامل الدسم مبستر يومياً.',
        is_active: 'TRUE',
        is_featured: 'FALSE',
        is_best_deal: 'TRUE',
        has_variants: 'TRUE',
        variant_sku: 'VAR-MILK-1L',
        variant_unit_value: '1',
        variant_unit_type: 'L',
        variant_pack_size: '1 Liter Bottle',
        variant_price: '5.50',
        variant_discount_price: '',
        variant_stock_quantity: '150',
        images: 'milk-1l.jpg',
      },
      {
        product_sku: 'PRD-ALM-MILK',
        name_en: 'Almarai Fresh Milk',
        name_ar: 'حليب المراعي طازج',
        category_code: 'CAT_DAIRY',
        brand: 'Almarai',
        unit: 'Bottle',
        unit_value: '',
        unit_type: '',
        pack_size: '',
        price: '5.50',
        discount_price: '',
        purchase_price: '3.50',
        stock_quantity: '300',
        description_en: 'Fresh whole cow milk pasteurized daily.',
        description_ar: 'حليب أبقار طازج كامل الدسم مبستر يومياً.',
        is_active: 'TRUE',
        is_featured: 'FALSE',
        is_best_deal: 'TRUE',
        has_variants: 'TRUE',
        variant_sku: 'VAR-MILK-2L',
        variant_unit_value: '2',
        variant_unit_type: 'L',
        variant_pack_size: '2 Liter Bottle',
        variant_price: '10.00',
        variant_discount_price: '9.00',
        variant_stock_quantity: '150',
        images: 'milk-2l.jpg',
      },
    ];

    const instructions = [
      ['FALCON PRODUCT BULK IMPORT TEMPLATE INSTRUCTIONS'],
      [''],
      ['Column Name', 'Required', 'Description', 'Allowed Values / Format'],
      ['product_sku', 'YES', 'Unique master product SKU', 'e.g. PRD-1001. Multiple rows with same product_sku define product variants.'],
      ['name_en', 'YES', 'Product Name in English', 'e.g. Fresh Orange Juice'],
      ['name_ar', 'YES', 'Product Name in Arabic', 'e.g. عصير برتقال طازج'],
      ['category_code', 'YES', 'Mapped Category Code', 'Must match an existing category_code in database (L1, L2, L3, or L4).'],
      ['brand', 'NO', 'Brand name', 'e.g. Falcon, Almarai'],
      ['price', 'YES', 'Base product selling price', 'Decimal >= 0 (e.g. 15.50)'],
      ['discount_price', 'NO', 'Promotional sale price', 'Decimal < price (leave blank if none)'],
      ['purchase_price', 'NO', 'Cost / purchase price', 'Decimal >= 0'],
      ['stock_quantity', 'YES', 'Available inventory count', 'Whole integer >= 0 (e.g. 50)'],
      ['has_variants', 'NO', 'Does product have variants?', 'TRUE or FALSE (default: FALSE)'],
      ['variant_sku', 'CONDITIONAL', 'Unique variant SKU', 'Required if has_variants is TRUE. Each variant SKU must be unique.'],
      ['variant_unit_value', 'NO', 'Variant measurement value', 'e.g. 500, 1, 2.5'],
      ['variant_unit_type', 'NO', 'Variant measurement unit', 'e.g. g, kg, ml, L, pcs'],
      ['variant_price', 'NO', 'Variant price', 'Decimal >= 0 (defaults to product price if omitted)'],
      ['variant_stock_quantity', 'NO', 'Variant inventory', 'Integer >= 0 (defaults to 0)'],
      ['images', 'NO', 'Images list (comma-separated)', 'e.g. "front.jpg, /uploads/side.jpg, https://cdn.com/item.png"'],
      ['is_active', 'NO', 'Product active status', 'TRUE or FALSE (default: TRUE)'],
      [''],
      ['IMPORTANT IMAGE GUIDELINES:'],
      ['1. Local computer paths (e.g. C:\\Users\\... or D:\\Photos\\...) are strictly NOT accessible on the server.'],
      ['2. You can specify image filenames previously uploaded through Admin Asset Manager (e.g. file-123.jpg), or full public URLs (https://...).'],
    ];

    const wb = XLSX.utils.book_new();
    const wsTemplate = XLSX.utils.json_to_sheet(sampleProducts);
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Products');

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    return XLSX.write(wb, { type: 'buffer', bookType });
  }

  // =========================================================================
  // 2. VALIDATION ENGINE
  // =========================================================================

  /**
   * Validates bulk category or product data
   */
  async validateBulkData({ fileBuffer, importType, importMode = 'UPSERT' }) {
    const rawRows = this.parseFileBuffer(fileBuffer);

    if (importType === 'CATEGORY') {
      return await this.validateCategoryRows(rawRows, importMode);
    } else if (importType === 'PRODUCT') {
      return await this.validateProductRows(rawRows, importMode);
    } else {
      throw new Error(`Invalid import type "${importType}". Supported: CATEGORY, PRODUCT`);
    }
  }

  /**
   * Validate Category Rows
   */
  async validateCategoryRows(rows, importMode) {
    const errors = [];
    const warnings = [];
    const previewRows = [];

    // Header check
    const firstRow = rows[0] || {};
    const hasCategoryCode = Object.keys(firstRow).some(k => k === 'category_code');
    const hasNameEn = Object.keys(firstRow).some(k => k === 'name_en');
    const hasNameAr = Object.keys(firstRow).some(k => k === 'name_ar');

    if (!hasCategoryCode || !hasNameEn || !hasNameAr) {
      throw new Error('Missing required category columns: category_code, name_en, name_ar are mandatory.');
    }

    // Load existing categories from DB
    const existingCats = await Category.findAll({
      attributes: ['id', 'code', 'slug', 'parent_id', 'name_en'],
      raw: true,
    });
    const dbCatMap = new Map();
    for (const c of existingCats) {
      if (c.code) dbCatMap.set(c.code.toUpperCase(), c);
      if (c.slug) dbCatMap.set(c.slug.toUpperCase(), c);
    }

    const fileCatMap = new Map();
    const fileCodesSeen = new Set();

    // Pass 1: Syntax & row checks
    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const rowErrors = [];
      const rowWarnings = [];

      const rawCode = row.category_code || row.code || '';
      const code = rawCode.trim().toUpperCase();
      const parentCode = (row.parent_category_code || row.parent_code || '').trim().toUpperCase();
      const nameEn = (row.name_en || '').trim();
      const nameAr = (row.name_ar || '').trim();
      const rawImage = row.image_url || row.image || '';

      if (!code) {
        rowErrors.push({ field: 'category_code', message: 'Category Code is required' });
      } else {
        if (!/^[A-Z0-9_-]{2,80}$/.test(code)) {
          rowWarnings.push({ field: 'category_code', message: 'Category code should use letters, numbers, underscores or hyphens' });
        }
        if (fileCodesSeen.has(code)) {
          rowErrors.push({ field: 'category_code', message: `Duplicate category_code "${code}" found in this file` });
        } else {
          fileCodesSeen.add(code);
        }
      }

      if (!nameEn) rowErrors.push({ field: 'name_en', message: 'English name is required' });
      if (!nameAr) rowErrors.push({ field: 'name_ar', message: 'Arabic name is required' });

      // Mode check against DB
      const existsInDb = dbCatMap.has(code);
      if (importMode === 'CREATE_ONLY' && existsInDb) {
        rowErrors.push({ field: 'category_code', message: `Category "${code}" already exists in database (Create Only mode)` });
      } else if (importMode === 'UPDATE_ONLY' && !existsInDb) {
        rowErrors.push({ field: 'category_code', message: `Category "${code}" does not exist in database (Update Only mode)` });
      }

      // Image validation
      if (rawImage) {
        const imgCheck = this.processImageRef(rawImage);
        if (imgCheck && !imgCheck.valid) {
          rowErrors.push({ field: 'image_url', message: imgCheck.error });
        }
      }

      fileCatMap.set(code, {
        rowNum,
        code,
        parentCode,
        nameEn,
        nameAr,
        slug: (row.slug || '').trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        image_url: rawImage ? (this.processImageRef(rawImage)?.url || rawImage) : null,
        is_active: String(row.is_active || 'true').toLowerCase() !== 'false',
        rowErrors,
        rowWarnings,
      });
    });

    // Pass 2: Hierarchy & Circular reference check
    for (const [code, cat] of fileCatMap.entries()) {
      if (cat.parentCode) {
        if (cat.parentCode === code) {
          cat.rowErrors.push({ field: 'parent_category_code', message: `Self-referencing parent code "${cat.parentCode}"` });
          continue;
        }

        // Parent must exist in file or DB
        const parentInFile = fileCatMap.get(cat.parentCode);
        const parentInDb = dbCatMap.get(cat.parentCode);

        if (!parentInFile && !parentInDb) {
          cat.rowErrors.push({ field: 'parent_category_code', message: `Parent category "${cat.parentCode}" not found in file or database` });
          continue;
        }

        // Circular reference & max depth check
        let depth = 1;
        let curr = cat.parentCode;
        const visited = new Set([code]);
        let circular = false;

        while (curr) {
          if (visited.has(curr)) {
            cat.rowErrors.push({ field: 'parent_category_code', message: `Circular hierarchy detected involving "${curr}"` });
            circular = true;
            break;
          }
          visited.add(curr);
          depth++;

          if (depth > 4) {
            cat.rowErrors.push({ field: 'parent_category_code', message: `Category hierarchy exceeds maximum supported 4 levels (depth: ${depth})` });
            break;
          }

          const nextParent = fileCatMap.get(curr) || dbCatMap.get(curr);
          if (nextParent && nextParent.parentCode) {
            curr = nextParent.parentCode;
          } else if (nextParent && nextParent.parent_id) {
            // Find parent of DB parent
            const grandParentDb = existingCats.find(c => c.id === nextParent.parent_id);
            curr = grandParentDb ? (grandParentDb.code || grandParentDb.slug || '').toUpperCase() : null;
          } else {
            curr = null;
          }
        }
      }
    }

    // Assemble preview rows & error list
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const [code, cat] of fileCatMap.entries()) {
      const hasErr = cat.rowErrors.length > 0;
      const hasWarn = cat.rowWarnings.length > 0;

      if (hasErr) {
        errorCount++;
        cat.rowErrors.forEach(err => {
          errors.push({ row: cat.rowNum, identifier: code, field: err.field, message: err.message, severity: 'error' });
        });
      } else {
        validCount++;
      }

      if (hasWarn) {
        warningCount++;
        cat.rowWarnings.forEach(warn => {
          warnings.push({ row: cat.rowNum, identifier: code, field: warn.field, message: warn.message, severity: 'warning' });
        });
      }

      previewRows.push({
        rowNumber: cat.rowNum,
        identifier: code,
        name: cat.nameEn,
        secondary: cat.nameAr,
        parent: cat.parentCode || 'None (Level 1 Root)',
        status: hasErr ? 'ERROR' : (hasWarn ? 'WARNING' : 'VALID'),
        issues: [...cat.rowErrors.map(e => e.message), ...cat.rowWarnings.map(w => w.message)],
        raw: {
          category_code: code,
          parent_category_code: cat.parentCode,
          name_en: cat.nameEn,
          name_ar: cat.nameAr,
          slug: cat.slug,
          image_url: cat.image_url,
          is_active: cat.is_active,
        },
      });
    }

    return {
      importType: 'CATEGORY',
      importMode,
      totalRows: rows.length,
      validCount,
      errorCount,
      warningCount,
      isValid: errorCount === 0,
      errors,
      warnings,
      previewRows: previewRows.slice(0, 100), // Return first 100 for responsive UI preview
    };
  }

  /**
   * Validate Product Rows
   */
  async validateProductRows(rows, importMode) {
    const errors = [];
    const warnings = [];
    const previewRows = [];

    // Header check
    const firstRow = rows[0] || {};
    const hasProductSku = Object.keys(firstRow).some(k => k === 'product_sku' || k === 'sku');
    const hasNameEn = Object.keys(firstRow).some(k => k === 'name_en');
    const hasCategoryCode = Object.keys(firstRow).some(k => k === 'category_code');
    const hasPrice = Object.keys(firstRow).some(k => k === 'price');

    if (!hasProductSku || !hasNameEn || !hasCategoryCode || !hasPrice) {
      throw new Error('Missing required product columns: product_sku, name_en, category_code, and price are mandatory.');
    }

    // Load existing categories from DB for mapping
    const existingCats = await Category.findAll({
      attributes: ['id', 'code', 'slug', 'parent_id', 'name_en'],
      raw: true,
    });
    const catCodeMap = new Map();
    for (const c of existingCats) {
      if (c.code) catCodeMap.set(c.code.toUpperCase(), c);
      if (c.slug) catCodeMap.set(c.slug.toUpperCase(), c);
    }

    // Load existing products and variants from DB by SKU
    const existingProducts = await Product.findAll({
      attributes: ['id', 'sku', 'name_en'],
      raw: true,
    });
    const dbProductSkuMap = new Map();
    existingProducts.forEach(p => dbProductSkuMap.set(p.sku.toUpperCase(), p));

    const existingVariants = await ProductVariant.findAll({
      attributes: ['id', 'sku', 'product_id'],
      raw: true,
    });
    const dbVariantSkuMap = new Map();
    existingVariants.forEach(v => dbVariantSkuMap.set(v.sku.toUpperCase(), v));

    // Group rows by product_sku
    const productGroups = new Map();
    const allVariantSkusInFile = new Set();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const rowErrors = [];
      const rowWarnings = [];

      const rawSku = row.product_sku || row.sku || '';
      const productSku = rawSku.trim().toUpperCase();
      const nameEn = (row.name_en || '').trim();
      const nameAr = (row.name_ar || '').trim();
      const rawCatCode = row.category_code || '';
      const categoryCode = rawCatCode.trim().toUpperCase();
      const rawPrice = row.price;
      const rawDiscountPrice = row.discount_price;
      const rawStock = row.stock_quantity || row.stock;
      const rawImages = row.images || row.image_url || '';
      const hasVariantsBool = String(row.has_variants || '').toLowerCase() === 'true';
      const variantSku = (row.variant_sku || '').trim().toUpperCase();

      if (!productSku) {
        rowErrors.push({ field: 'product_sku', message: 'Product SKU is required' });
      }

      if (!nameEn) rowErrors.push({ field: 'name_en', message: 'English name is required' });

      if (!categoryCode) {
        rowErrors.push({ field: 'category_code', message: 'Category Code is required' });
      } else if (!catCodeMap.has(categoryCode)) {
        rowErrors.push({ field: 'category_code', message: `Category code "${categoryCode}" does not exist in the database` });
      }

      // Price checks
      const priceNum = parseFloat(rawPrice);
      if (rawPrice === '' || isNaN(priceNum) || priceNum < 0) {
        rowErrors.push({ field: 'price', message: 'Valid positive numeric price is required' });
      }

      if (rawDiscountPrice !== undefined && rawDiscountPrice !== '') {
        const discNum = parseFloat(rawDiscountPrice);
        if (isNaN(discNum) || discNum < 0) {
          rowErrors.push({ field: 'discount_price', message: 'Discount price must be a valid positive number' });
        } else if (discNum >= priceNum) {
          rowErrors.push({ field: 'discount_price', message: `Discount price (${discNum}) must be less than regular price (${priceNum})` });
        }
      }

      // Stock check
      if (rawStock !== undefined && rawStock !== '') {
        const stockInt = parseInt(rawStock, 10);
        if (isNaN(stockInt) || stockInt < 0) {
          rowErrors.push({ field: 'stock_quantity', message: 'Stock quantity must be a non-negative integer' });
        }
      }

      // Mode check against DB
      const existsInDb = dbProductSkuMap.has(productSku);
      if (importMode === 'CREATE_ONLY' && existsInDb) {
        rowErrors.push({ field: 'product_sku', message: `Product SKU "${productSku}" already exists in database (Create Only mode)` });
      } else if (importMode === 'UPDATE_ONLY' && !existsInDb) {
        rowErrors.push({ field: 'product_sku', message: `Product SKU "${productSku}" does not exist in database (Update Only mode)` });
      }

      // Variant checks
      if (hasVariantsBool) {
        if (!variantSku) {
          rowErrors.push({ field: 'variant_sku', message: 'variant_sku is required when has_variants is TRUE' });
        } else {
          if (allVariantSkusInFile.has(variantSku)) {
            rowErrors.push({ field: 'variant_sku', message: `Duplicate variant_sku "${variantSku}" found in this file` });
          } else {
            allVariantSkusInFile.add(variantSku);
          }

          // Check if variant SKU collides with another product in DB
          const existingVar = dbVariantSkuMap.get(variantSku);
          if (existingVar && (!existsInDb || existingVar.product_id !== dbProductSkuMap.get(productSku)?.id)) {
            if (importMode === 'CREATE_ONLY') {
              rowErrors.push({ field: 'variant_sku', message: `Variant SKU "${variantSku}" already registered to another item` });
            }
          }
        }
      }

      // Image validation
      if (rawImages) {
        const imgList = String(rawImages).split(',').map(s => s.trim()).filter(Boolean);
        imgList.forEach(img => {
          const check = this.processImageRef(img);
          if (check && !check.valid) {
            rowErrors.push({ field: 'images', message: check.error });
          }
        });
      }

      if (!productGroups.has(productSku)) {
        productGroups.set(productSku, {
          productSku,
          nameEn,
          nameAr,
          categoryCode,
          rows: [],
          errors: [],
          warnings: [],
        });
      }

      const group = productGroups.get(productSku);
      group.rows.push({
        rowNum,
        data: row,
        rowErrors,
        rowWarnings,
      });
      group.errors.push(...rowErrors.map(e => ({ row: rowNum, identifier: productSku, field: e.field, message: e.message, severity: 'error' })));
      group.warnings.push(...rowWarnings.map(w => ({ row: rowNum, identifier: productSku, field: w.field, message: w.message, severity: 'warning' })));
    });

    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const [sku, group] of productGroups.entries()) {
      const hasErr = group.errors.length > 0;
      const hasWarn = group.warnings.length > 0;

      if (hasErr) {
        errorCount += group.rows.length;
        errors.push(...group.errors);
      } else {
        validCount += group.rows.length;
      }

      if (hasWarn) {
        warningCount += group.warnings.length;
        warnings.push(...group.warnings);
      }

      const firstGroupRow = group.rows[0];
      previewRows.push({
        rowNumber: firstGroupRow.rowNum,
        identifier: sku,
        name: group.nameEn,
        secondary: `${group.rows.length} ${group.rows.length === 1 ? 'Variant / Record' : 'Variants'}`,
        parent: group.categoryCode,
        status: hasErr ? 'ERROR' : (hasWarn ? 'WARNING' : 'VALID'),
        issues: [...new Set([...group.errors.map(e => e.message), ...group.warnings.map(w => w.message)])],
        raw: firstGroupRow.data,
      });
    }

    return {
      importType: 'PRODUCT',
      importMode,
      totalRows: rows.length,
      validCount,
      errorCount,
      warningCount,
      isValid: errorCount === 0,
      errors,
      warnings,
      previewRows: previewRows.slice(0, 100),
    };
  }

  // =========================================================================
  // 3. DATABASE IMPORT ENGINE
  // =========================================================================

  /**
   * Main import handler
   */
  async importBulkData({
    fileBuffer,
    fileName,
    fileSize,
    importType,
    importMode = 'UPSERT',
    errorHandling = 'SKIP_INVALID',
    userId = null,
  }) {
    // Prevent concurrent duplicate executions
    const lockKey = `${userId || 'system'}_${importType}_${fileName}`;
    if (activeImportLocks.has(lockKey)) {
      throw new Error('An import with this file is currently being processed. Please wait for it to complete.');
    }
    activeImportLocks.add(lockKey);

    let historyRecord = null;
    try {
      // 1. Initial Validation
      const validation = await this.validateBulkData({ fileBuffer, importType, importMode });

      if (errorHandling === 'ALL_OR_NOTHING' && !validation.isValid) {
        throw new Error(`Import aborted: ${validation.errorCount} row(s) contain validation errors (All-or-Nothing mode)`);
      }

      // 2. Initialize history record
      historyRecord = await BulkUploadHistory.create({
        uploaded_by: userId || null,
        file_name: fileName || `${importType.toLowerCase()}_import.xlsx`,
        file_size: fileSize || fileBuffer.length,
        import_type: importType,
        import_mode: importMode,
        error_handling: errorHandling,
        total_rows: validation.totalRows,
        valid_rows: validation.validCount,
        status: 'PROCESSING',
      });

      let importResult;
      if (importType === 'CATEGORY') {
        importResult = await this.executeCategoryImport({
          rawRows: this.parseFileBuffer(fileBuffer),
          importMode,
          errorHandling,
          historyId: historyRecord.id,
        });
      } else {
        importResult = await this.executeProductImport({
          rawRows: this.parseFileBuffer(fileBuffer),
          importMode,
          errorHandling,
          historyId: historyRecord.id,
        });
      }

      // 3. Update history record with results
      const finalStatus = importResult.failedCount === 0
        ? 'COMPLETED'
        : (importResult.successCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED');

      await historyRecord.update({
        success_count: importResult.successCount,
        failed_count: importResult.failedCount,
        status: finalStatus,
        error_summary: importResult.allErrors || [],
        stats: importResult.stats || {},
      });

      return {
        success: true,
        historyId: historyRecord.id,
        status: finalStatus,
        totalRows: validation.totalRows,
        successCount: importResult.successCount,
        failedCount: importResult.failedCount,
        stats: importResult.stats,
        errors: importResult.allErrors || [],
      };
    } catch (err) {
      if (historyRecord) {
        await historyRecord.update({
          status: 'FAILED',
          failed_count: historyRecord.total_rows || 1,
          error_summary: [{ row: 0, field: 'general', message: err.message, severity: 'error' }],
        });
      }
      throw err;
    } finally {
      activeImportLocks.delete(lockKey);
    }
  }

  /**
   * Execute Category Database Import
   */
  async executeCategoryImport({ rawRows, importMode, errorHandling, historyId }) {
    const validation = await this.validateCategoryRows(rawRows, importMode);
    const validRowsByCode = new Map();
    const allErrors = [...validation.errors];

    // Filter valid rows
    const errorCodes = new Set(validation.errors.map(e => e.identifier));
    validation.previewRows.forEach(p => {
      if (!errorCodes.has(p.identifier)) {
        validRowsByCode.set(p.identifier, p.raw);
      }
    });

    if (errorHandling === 'ALL_OR_NOTHING' && errorCodes.size > 0) {
      throw new Error(`All-or-Nothing check failed: ${errorCodes.size} invalid category rows found`);
    }

    let successCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = errorCodes.size;

    // Load existing categories from DB
    const existingCats = await Category.findAll();
    const catCodeToDbMap = new Map();
    existingCats.forEach(c => {
      if (c.code) catCodeToDbMap.set(c.code.toUpperCase(), c);
      if (c.slug) catCodeToDbMap.set(c.slug.toUpperCase(), c);
    });

    // Topological sort: parents before children
    const sortedCodes = [];
    const visited = new Set();

    const visit = (code) => {
      if (visited.has(code)) return;
      visited.add(code);
      const row = validRowsByCode.get(code);
      if (row && row.parent_category_code && validRowsByCode.has(row.parent_category_code)) {
        visit(row.parent_category_code);
      }
      sortedCodes.push(code);
    };

    for (const code of validRowsByCode.keys()) {
      visit(code);
    }

    // Execute within transaction
    await sequelize.transaction(async (t) => {
      for (const code of sortedCodes) {
        const row = validRowsByCode.get(code);
        if (!row) continue;

        try {
          // Resolve parent_id
          let parentId = null;
          if (row.parent_category_code) {
            const parentCat = catCodeToDbMap.get(row.parent_category_code.toUpperCase());
            if (parentCat) {
              parentId = parentCat.id;
            } else {
              throw new Error(`Parent category "${row.parent_category_code}" could not be resolved`);
            }
          }

          const existingCategory = catCodeToDbMap.get(code);

          if (existingCategory && (importMode === 'UPDATE_ONLY' || importMode === 'UPSERT')) {
            await existingCategory.update({
              name_en: row.name_en,
              name_ar: row.name_ar,
              parent_id: parentId,
              image_url: row.image_url || existingCategory.image_url,
              is_active: row.is_active,
            }, { transaction: t });

            catCodeToDbMap.set(code, existingCategory);
            updatedCount++;
            successCount++;
          } else if (!existingCategory && (importMode === 'CREATE_ONLY' || importMode === 'UPSERT')) {
            const newCat = await Category.create({
              code,
              name_en: row.name_en,
              name_ar: row.name_ar,
              slug: row.slug || `${row.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
              parent_id: parentId,
              image_url: row.image_url || null,
              is_active: row.is_active,
            }, { transaction: t });

            catCodeToDbMap.set(code, newCat);
            createdCount++;
            successCount++;
          }
        } catch (catErr) {
          if (errorHandling === 'ALL_OR_NOTHING') throw catErr;
          failedCount++;
          allErrors.push({ row: 0, identifier: code, field: 'database', message: catErr.message, severity: 'error' });
        }
      }
    });

    return {
      successCount,
      failedCount,
      allErrors,
      stats: { createdCount, updatedCount, totalProcessed: sortedCodes.length },
    };
  }

  /**
   * Execute Product Database Import
   */
  async executeProductImport({ rawRows, importMode, errorHandling, historyId }) {
    const validation = await this.validateProductRows(rawRows, importMode);
    const allErrors = [...validation.errors];

    // Identify failed SKUs
    const errorSkus = new Set(validation.errors.map(e => e.identifier));
    if (errorHandling === 'ALL_OR_NOTHING' && errorSkus.size > 0) {
      throw new Error(`All-or-Nothing check failed: ${errorSkus.size} products contain validation errors`);
    }

    // Group rows by product_sku
    const validProductGroups = new Map();
    rawRows.forEach((row, idx) => {
      const sku = (row.product_sku || row.sku || '').trim().toUpperCase();
      if (!errorSkus.has(sku)) {
        if (!validProductGroups.has(sku)) {
          validProductGroups.set(sku, []);
        }
        validProductGroups.get(sku).push({ rowNum: idx + 2, data: row });
      }
    });

    // Load category hierarchy map to populate L1, L2, L3, L4
    const allCats = await Category.findAll({ raw: true });
    const catMapById = new Map();
    const catMapByCode = new Map();
    allCats.forEach(c => {
      catMapById.set(c.id, c);
      if (c.code) catMapByCode.set(c.code.toUpperCase(), c);
      if (c.slug) catMapByCode.set(c.slug.toUpperCase(), c);
    });

    const resolveHierarchy = (targetCategoryCode) => {
      const leafCat = catMapByCode.get(targetCategoryCode.toUpperCase());
      if (!leafCat) return { category_id: null };

      // Build chain upwards: [leaf, parent, grandparent, root]
      const chain = [];
      let curr = leafCat;
      while (curr) {
        chain.unshift(curr);
        curr = curr.parent_id ? catMapById.get(curr.parent_id) : null;
      }

      // Map chain into L1, L2, L3, L4
      return {
        category_id: chain[0]?.id || null, // L1
        subcategory_id: chain[1]?.id || null, // L2
        sub_subcategory_id: chain[2]?.id || null, // L3
        sub_sub_subcategory_id: chain[3]?.id || null, // L4
      };
    };

    let successCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = errorSkus.size;

    // Execute in transaction
    await sequelize.transaction(async (t) => {
      for (const [sku, groupRows] of validProductGroups.entries()) {
        try {
          const firstRow = groupRows[0].data;
          const hierarchy = resolveHierarchy(firstRow.category_code || '');

          if (!hierarchy.category_id) {
            throw new Error(`Category hierarchy resolution failed for code "${firstRow.category_code}"`);
          }

          const hasVariantsBool = groupRows.length > 1 || String(firstRow.has_variants || '').toLowerCase() === 'true';
          const priceNum = parseFloat(firstRow.price);
          const discountNum = firstRow.discount_price ? parseFloat(firstRow.discount_price) : null;
          const purchaseNum = firstRow.purchase_price ? parseFloat(firstRow.purchase_price) : null;
          const stockNum = firstRow.stock_quantity ? parseInt(firstRow.stock_quantity, 10) : 0;

          // Parse images
          const imageList = [];
          if (firstRow.images || firstRow.image_url) {
            const rawList = String(firstRow.images || firstRow.image_url).split(',').map(s => s.trim()).filter(Boolean);
            rawList.forEach(rawImg => {
              const res = this.processImageRef(rawImg);
              if (res && res.valid) imageList.push(res.url);
            });
          }

          const computedUnit = (firstRow.unit_value && firstRow.unit_type)
            ? `${firstRow.unit_value} ${firstRow.unit_type}`
            : (firstRow.unit || 'PCS');

          let product = await Product.findOne({ where: { sku }, transaction: t });

          if (product && (importMode === 'UPDATE_ONLY' || importMode === 'UPSERT')) {
            // Update master product
            await product.update({
              category_id: hierarchy.category_id,
              subcategory_id: hierarchy.subcategory_id,
              sub_subcategory_id: hierarchy.sub_subcategory_id,
              sub_sub_subcategory_id: hierarchy.sub_sub_subcategory_id,
              name_en: firstRow.name_en,
              name_ar: firstRow.name_ar || firstRow.name_en,
              brand: firstRow.brand || product.brand,
              unit: computedUnit,
              unit_type: firstRow.unit_type || product.unit_type,
              unit_value: firstRow.unit_value || product.unit_value,
              pack_size: firstRow.pack_size || product.pack_size,
              price: priceNum,
              discount_price: discountNum,
              purchase_price: purchaseNum,
              stock_quantity: stockNum,
              description_en: firstRow.description_en || product.description_en,
              description_ar: firstRow.description_ar || product.description_ar,
              is_active: String(firstRow.is_active || 'true').toLowerCase() !== 'false',
              is_featured: String(firstRow.is_featured || 'false').toLowerCase() === 'true',
              is_best_deal: String(firstRow.is_best_deal || 'false').toLowerCase() === 'true',
              has_variants: hasVariantsBool,
            }, { transaction: t });

            updatedCount++;
          } else if (!product && (importMode === 'CREATE_ONLY' || importMode === 'UPSERT')) {
            // Create master product
            product = await Product.create({
              category_id: hierarchy.category_id,
              subcategory_id: hierarchy.subcategory_id,
              sub_subcategory_id: hierarchy.sub_subcategory_id,
              sub_sub_subcategory_id: hierarchy.sub_sub_subcategory_id,
              sku,
              name_en: firstRow.name_en,
              name_ar: firstRow.name_ar || firstRow.name_en,
              brand: firstRow.brand || '',
              unit: computedUnit,
              unit_type: firstRow.unit_type || null,
              unit_value: firstRow.unit_value || null,
              pack_size: firstRow.pack_size || null,
              price: priceNum,
              discount_price: discountNum,
              purchase_price: purchaseNum,
              stock_quantity: stockNum,
              description_en: firstRow.description_en || null,
              description_ar: firstRow.description_ar || null,
              is_active: String(firstRow.is_active || 'true').toLowerCase() !== 'false',
              is_featured: String(firstRow.is_featured || 'false').toLowerCase() === 'true',
              is_best_deal: String(firstRow.is_best_deal || 'false').toLowerCase() === 'true',
              has_variants: hasVariantsBool,
            }, { transaction: t });

            createdCount++;
          }

          // Handle Variants & Images
          if (hasVariantsBool) {
            for (const vRow of groupRows) {
              const vd = vRow.data;
              const vSku = (vd.variant_sku || vd.sku || `${sku}-${Date.now().toString(36)}`).trim().toUpperCase();
              const vPrice = vd.variant_price ? parseFloat(vd.variant_price) : priceNum;
              const vDiscount = vd.variant_discount_price ? parseFloat(vd.variant_discount_price) : discountNum;
              const vStock = vd.variant_stock_quantity ? parseInt(vd.variant_stock_quantity, 10) : stockNum;

              // Variant images
              const vImages = [];
              const rawVImg = vd.images || vd.image_url;
              if (rawVImg) {
                String(rawVImg).split(',').map(s => s.trim()).filter(Boolean).forEach(img => {
                  const r = this.processImageRef(img);
                  if (r && r.valid) vImages.push(r.url);
                });
              }

              let [variant, wasCreated] = await ProductVariant.findOrCreate({
                where: { sku: vSku },
                defaults: {
                  product_id: product.id,
                  sku: vSku,
                  unit_value: vd.variant_unit_value || vd.unit_value || null,
                  unit_type: vd.variant_unit_type || vd.unit_type || null,
                  pack_size: vd.variant_pack_size || vd.pack_size || null,
                  price: vPrice,
                  discount_price: vDiscount,
                  stock_quantity: vStock,
                  image_url: vImages[0] || imageList[0] || null,
                  is_active: true,
                },
                transaction: t,
              });

              if (!wasCreated) {
                await variant.update({
                  product_id: product.id,
                  unit_value: vd.variant_unit_value || vd.unit_value || variant.unit_value,
                  unit_type: vd.variant_unit_type || vd.unit_type || variant.unit_type,
                  pack_size: vd.variant_pack_size || vd.pack_size || variant.pack_size,
                  price: vPrice,
                  discount_price: vDiscount,
                  stock_quantity: vStock,
                  image_url: vImages[0] || variant.image_url,
                }, { transaction: t });
              }

              // Sync variant images
              if (vImages.length > 0) {
                await ProductVariantImage.destroy({ where: { variant_id: variant.id }, transaction: t });
                const imgRecords = vImages.map((url, idx) => ({
                  variant_id: variant.id,
                  image_url: url,
                  is_primary: idx === 0,
                  sort_order: idx,
                }));
                await ProductVariantImage.bulkCreate(imgRecords, { transaction: t });
              }
            }
          } else {
            // Standalone product: ensure base variant exists
            let [baseVariant] = await ProductVariant.findOrCreate({
              where: { product_id: product.id },
              defaults: {
                product_id: product.id,
                sku,
                price: priceNum,
                discount_price: discountNum,
                stock_quantity: stockNum,
                unit_value: firstRow.unit_value || null,
                unit_type: firstRow.unit_type || null,
                image_url: imageList[0] || null,
                is_active: true,
              },
              transaction: t,
            });

            await baseVariant.update({
              price: priceNum,
              discount_price: discountNum,
              stock_quantity: stockNum,
              image_url: imageList[0] || baseVariant.image_url,
            }, { transaction: t });

            // Master product images
            if (imageList.length > 0) {
              await ProductImage.destroy({ where: { product_id: product.id }, transaction: t });
              const prodImages = imageList.map((url, idx) => ({
                product_id: product.id,
                image_url: url,
                display_order: idx,
                is_primary: idx === 0,
              }));
              await ProductImage.bulkCreate(prodImages, { transaction: t });
            }
          }

          successCount += groupRows.length;
        } catch (prodErr) {
          if (errorHandling === 'ALL_OR_NOTHING') throw prodErr;
          failedCount += groupRows.length;
          allErrors.push({ row: groupRows[0]?.rowNum || 0, identifier: sku, field: 'database', message: prodErr.message, severity: 'error' });
        }
      }
    });

    return {
      successCount,
      failedCount,
      allErrors,
      stats: { createdCount, updatedCount, totalProducts: validProductGroups.size },
    };
  }

  // =========================================================================
  // 4. HISTORY & ERROR REPORTING
  // =========================================================================

  /**
   * Get paginated upload history
   */
  async getUploadHistory(query = {}) {
    const {
      page = 1,
      limit = 10,
      importType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (importType && importType !== 'ALL') where.import_type = importType;
    if (status && status !== 'ALL') where.status = status;

    const { count, rows } = await BulkUploadHistory.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email', 'mobile'],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limitNum,
      offset,
    });

    return {
      records: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords: count,
        totalPages: Math.ceil(count / limitNum) || 1,
      },
    };
  }

  /**
   * Get single upload history by ID
   */
  async getUploadHistoryById(id) {
    const record = await BulkUploadHistory.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email', 'mobile'],
        },
      ],
    });

    if (!record) {
      throw new Error(`Upload history record with ID "${id}" not found`);
    }

    return record;
  }

  /**
   * Generate downloadable error report CSV buffer
   */
  async generateErrorReportCsv(id) {
    const record = await this.getUploadHistoryById(id);
    const errors = record.error_summary || [];

    const csvRows = [
      ['Row Number', 'Identifier (SKU / Category Code)', 'Field', 'Error Message', 'Severity'],
      ...errors.map(e => [
        e.row || 'N/A',
        e.identifier || 'N/A',
        e.field || 'General',
        e.message || 'Unknown error',
        (e.severity || 'ERROR').toUpperCase(),
      ]),
    ];

    if (errors.length === 0) {
      csvRows.push(['-', '-', '-', 'No errors recorded. All rows imported successfully.', 'INFO']);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(csvRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');

    return XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
  }
}

module.exports = new BulkUploadService();
