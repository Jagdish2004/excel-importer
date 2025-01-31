const express = require('express');
const importController = require('../controllers/importController');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes
router.post('/api/preview', upload.single('file'), importController.previewData);
router.post('/api/preview/delete', importController.deleteRow);
router.post('/api/import', importController.importValidated);
router.get('/api/data', importController.getData);
router.delete('/api/data/:id', importController.deleteRecord);

module.exports = router; 