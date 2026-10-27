const bulkUploadService = require('../services/bulkUploadService');
const { sendSuccess, sendError } = require('../utils/response');

class BulkUploadController {
  /**
   * GET /admin/bulk-upload/category-template
   */
  async downloadCategoryTemplate(req, res, next) {
    try {
      const format = (req.query.format || 'xlsx').toLowerCase();
      const buffer = bulkUploadService.getCategoryTemplate(format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="falcon_category_bulk_template.csv"');
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="falcon_category_bulk_template.xlsx"');
      }

      return res.send(buffer);
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  /**
   * GET /admin/bulk-upload/product-template
   */
  async downloadProductTemplate(req, res, next) {
    try {
      const format = (req.query.format || 'xlsx').toLowerCase();
      const buffer = bulkUploadService.getProductTemplate(format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="falcon_product_bulk_template.csv"');
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="falcon_product_bulk_template.xlsx"');
      }

      return res.send(buffer);
    } catch (error) {
      return sendError(res, error.message, [], 500);
    }
  }

  /**
   * POST /admin/bulk-upload/validate
   */
  async validateUpload(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return sendError(res, 'Please upload an Excel (.xlsx) or CSV (.csv) file to validate', [], 400);
      }

      const importType = (req.body.importType || req.body.import_type || 'PRODUCT').toUpperCase();
      const importMode = (req.body.importMode || req.body.import_mode || 'UPSERT').toUpperCase();

      const validation = await bulkUploadService.validateBulkData({
        fileBuffer: req.file.buffer,
        importType,
        importMode,
      });

      return sendSuccess(res, 'File validation completed', validation);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  /**
   * POST /admin/bulk-upload/import
   */
  async importUpload(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return sendError(res, 'Please upload an Excel (.xlsx) or CSV (.csv) file to import', [], 400);
      }

      const importType = (req.body.importType || req.body.import_type || 'PRODUCT').toUpperCase();
      const importMode = (req.body.importMode || req.body.import_mode || 'UPSERT').toUpperCase();
      const errorHandling = (req.body.errorHandling || req.body.error_handling || 'SKIP_INVALID').toUpperCase();
      const userId = req.user ? req.user.id : null;

      const result = await bulkUploadService.importBulkData({
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        importType,
        importMode,
        errorHandling,
        userId,
      });

      return sendSuccess(res, 'Bulk import executed successfully', result, 201);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  /**
   * GET /admin/bulk-upload/history
   */
  async getHistory(req, res, next) {
    try {
      const data = await bulkUploadService.getUploadHistory(req.query);
      return sendSuccess(res, 'Bulk upload history retrieved', data);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }

  /**
   * GET /admin/bulk-upload/history/:id
   */
  async getHistoryById(req, res, next) {
    try {
      const record = await bulkUploadService.getUploadHistoryById(req.params.id);
      return sendSuccess(res, 'Upload history record retrieved', { record });
    } catch (error) {
      return sendError(res, error.message, [], 404);
    }
  }

  /**
   * GET /admin/bulk-upload/history/:id/errors
   */
  async downloadErrorReport(req, res, next) {
    try {
      const csvBuffer = await bulkUploadService.generateErrorReportCsv(req.params.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="bulk_import_errors_${req.params.id}.csv"`
      );
      return res.send(csvBuffer);
    } catch (error) {
      return sendError(res, error.message, [], 400);
    }
  }
}

module.exports = new BulkUploadController();
