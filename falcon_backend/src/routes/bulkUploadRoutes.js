const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkUploadController = require('../controllers/bulkUploadController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ROLES = require('../constants/roles');

// Configure multer memory storage with file type and size validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB limit
  },
  fileFilter: (req, file, cb) => {
    const originalName = (file.originalname || '').toLowerCase();
    const isCsv = originalName.endsWith('.csv') || file.mimetype.includes('csv');
    const isExcel = originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel');

    if (isCsv || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.'));
    }
  },
});

// Protect all routes: Admin only
router.use(authenticate, authorize(ROLES.ADMIN));

// 1. Download Templates
router.get('/category-template', (req, res, next) =>
  bulkUploadController.downloadCategoryTemplate(req, res, next)
);
router.get('/product-template', (req, res, next) =>
  bulkUploadController.downloadProductTemplate(req, res, next)
);

// 2. Validate Uploaded File
router.post('/validate', upload.single('file'), (req, res, next) =>
  bulkUploadController.validateUpload(req, res, next)
);

// 3. Execute Database Import
router.post('/import', upload.single('file'), (req, res, next) =>
  bulkUploadController.importUpload(req, res, next)
);

// 4. Import History
router.get('/history', (req, res, next) =>
  bulkUploadController.getHistory(req, res, next)
);
router.get('/history/:id', (req, res, next) =>
  bulkUploadController.getHistoryById(req, res, next)
);

// 5. Download Error Report CSV
router.get('/history/:id/errors', (req, res, next) =>
  bulkUploadController.downloadErrorReport(req, res, next)
);

module.exports = router;
