const Category = require('../models/Category');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex }
      ];
    }

    let sort = 'name';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await Category.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const categories = await Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        categories,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const categories = await Category.find(filter).sort(sort);
      res.json({ success: true, categories });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  const { name, code } = req.body;

  try {
    const codeExists = await Category.findOne({ code: code.toUpperCase() });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'Category code already exists' });
    }

    const category = await Category.create({ name, code: code.toUpperCase() });
    await logAction(req.user._id, 'CREATE_CATEGORY', `Created category ${name} (${code.toUpperCase()})`, req);

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  const { name, code } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (code && code.toUpperCase() !== category.code) {
      const codeExists = await Category.findOne({ code: code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Category code already exists' });
      }
      category.code = code.toUpperCase();
    }

    category.name = name || category.name;
    const updatedCategory = await category.save();

    await logAction(req.user._id, 'UPDATE_CATEGORY', `Updated category to ${category.name}`, req);
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_CATEGORY', `Deleted category ${category.name}`, req);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
