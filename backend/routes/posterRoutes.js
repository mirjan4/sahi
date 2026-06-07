const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/posterController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadPosterFields, uploadPosterToStorage } = require('../middlewares/uploadMiddleware');

router.route('/templates')
  .get(getTemplates)
  .post(protect, uploadPosterFields, uploadPosterToStorage, createTemplate);

router.route('/templates/:id')
  .get(getTemplateById)
  .put(protect, uploadPosterFields, uploadPosterToStorage, updateTemplate)
  .delete(protect, deleteTemplate);

module.exports = router;
