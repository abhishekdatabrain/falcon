const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// POST /api/v1/upload - Single File Upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', [], 400);
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativePath}`;

    const ext = req.file.originalname.split('.').pop().toUpperCase();

    return sendSuccess(res, 'File uploaded successfully', {
      url: relativePath, // Stored in DB as relative path e.g. /uploads/file-123.jpg for production portability
      relativePath: relativePath,
      fullUrl: fullUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      sizeBytes: req.file.size,
      formattedSize: formatBytes(req.file.size),
      mimetype: req.file.mimetype,
      fileType: ext || 'IMAGE',
    });
  } catch (error) {
    return sendError(res, error.message || 'File upload failed', [], 500);
  }
});

// POST /api/v1/upload/multiple - Multiple Files Upload
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files uploaded', [], 400);
    }

    const host = req.get('host');
    const protocol = req.protocol;

    const uploadedFiles = req.files.map((file) => {
      const ext = file.originalname.split('.').pop().toUpperCase();
      const relativePath = `/uploads/${file.filename}`;
      const fullUrl = `${protocol}://${host}${relativePath}`;
      return {
        url: relativePath, // Stored in DB as relative path e.g. /uploads/file-123.jpg
        relativePath: relativePath,
        fullUrl: fullUrl,
        filename: file.filename,
        originalname: file.originalname,
        sizeBytes: file.size,
        formattedSize: formatBytes(file.size),
        mimetype: file.mimetype,
        fileType: ext || 'IMAGE',
      };
    });

    return sendSuccess(res, 'Files uploaded successfully', { files: uploadedFiles });
  } catch (error) {
    return sendError(res, error.message || 'Files upload failed', [], 500);
  }
});

module.exports = router;
