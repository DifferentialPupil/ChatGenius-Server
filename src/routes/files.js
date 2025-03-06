const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files');
const upload = require('../middleware/upload.middleware');

// File upload route - single file upload
router.post('/upload', upload.single('file'), filesController.uploadFile);

// Get current user's uploaded files
router.get('/my-uploads', filesController.getUserFiles);

// Search files by filename
router.get('/search', filesController.searchFiles);

// Get file by ID
router.get('/:fileId', filesController.getFileById);

// Update file information (rename)
router.patch('/:fileId', filesController.updateFile);

// Delete a file
router.delete('/:fileId', filesController.deleteFile);

module.exports = router; 