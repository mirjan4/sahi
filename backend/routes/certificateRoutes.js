const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/certificateController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, uploadToStorage } = require('../middlewares/uploadMiddleware');

router.route('/templates')
  .get(getTemplates)
  .post(protect, upload.single('backgroundImage'), uploadToStorage, createTemplate);

router.route('/templates/:id')
  .get(getTemplateById)
  .put(protect, upload.single('backgroundImage'), uploadToStorage, updateTemplate)
  .delete(protect, deleteTemplate);

module.exports = router;
