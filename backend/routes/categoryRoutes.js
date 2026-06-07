const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getCategories).post(protect, createCategory);
router.route('/:id').get(getCategoryById).put(protect, updateCategory).delete(protect, deleteCategory);

module.exports = router;
