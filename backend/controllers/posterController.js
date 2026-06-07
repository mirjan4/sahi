const PosterTemplate = require('../models/PosterTemplate');
const { logAction } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

// @desc    Get all poster templates
// @route   GET /api/posters/templates
// @access  Public
const getTemplates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.name = new RegExp(req.query.search.trim(), 'i');
    }

    let sort = '-createdAt';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await PosterTemplate.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const templates = await PosterTemplate.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        templates,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const templates = await PosterTemplate.find(filter).sort(sort);
      res.json({ success: true, templates });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single poster template
// @route   GET /api/posters/templates/:id
// @access  Public
const getTemplateById = async (req, res) => {
  try {
    const template = await PosterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Poster template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create poster template
// @route   POST /api/posters/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
  const { name, config, isDefault } = req.body;
  let backgroundImage = '';

  if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
    backgroundImage = req.files.backgroundImage[0].location;
  }

  if (!backgroundImage) {
    return res.status(400).json({ success: false, message: 'Please upload a background image template' });
  }

  // Handle symbol files
  const symbols = {};
  if (req.files) {
    ['firstSymbol', 'secondSymbol', 'thirdSymbol'].forEach((field) => {
      if (req.files[field] && req.files[field][0]) {
        symbols[field] = req.files[field][0].location;
      }
    });
  }

  try {
    // Parse config if stringified
    let parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;

    // Check if default is requested
    const shouldBeDefault = isDefault === 'true' || isDefault === true;

    if (shouldBeDefault) {
      // Unset previous defaults
      await PosterTemplate.updateMany({}, { isDefault: false });
    }

    const template = await PosterTemplate.create({
      name,
      backgroundImage,
      config: parsedConfig,
      symbols,
      isDefault: shouldBeDefault,
    });

    // If this is the only template, make it default
    const count = await PosterTemplate.countDocuments();
    if (count === 1 && !template.isDefault) {
      template.isDefault = true;
      await template.save();
    }

    await logAction(req.user._id, 'CREATE_POSTER_TEMPLATE', `Created poster template: ${name}`, req);
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update poster template
// @route   PUT /api/posters/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
  const { name, config, isDefault } = req.body;

  try {
    const template = await PosterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Poster template not found' });
    }

    if (req.files && req.files.backgroundImage && req.files.backgroundImage[0]) {
      // Clean up old local file
      if (template.backgroundImage && template.backgroundImage.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', template.backgroundImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      template.backgroundImage = req.files.backgroundImage[0].location;
    }

    // Handle symbols updates
    if (req.files) {
      ['firstSymbol', 'secondSymbol', 'thirdSymbol'].forEach((field) => {
        if (req.files[field] && req.files[field][0]) {
          // Clean up old local file if replaced
          const oldSymbolUrl = template.symbols ? template.symbols.get(field) : null;
          if (oldSymbolUrl && oldSymbolUrl.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '..', oldSymbolUrl);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
          if (!template.symbols) {
            template.symbols = new Map();
          }
          template.symbols.set(field, req.files[field][0].location);
        }
      });
      template.markModified('symbols');
    }

    template.name = name || template.name;
    
    if (config) {
      const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
      if (!template.config) {
        template.config = new Map();
      }
      Object.keys(parsedConfig).forEach((key) => {
        template.config.set(key, parsedConfig[key]);
      });
      template.markModified('config');
    }

    if (isDefault !== undefined) {
      const shouldBeDefault = isDefault === 'true' || isDefault === true;
      if (shouldBeDefault) {
        await PosterTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
        template.isDefault = true;
      } else {
        template.isDefault = false;
      }
    }

    const updatedTemplate = await template.save();
    await logAction(req.user._id, 'UPDATE_POSTER_TEMPLATE', `Updated poster template: ${template.name}`, req);

    res.json({ success: true, template: updatedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete poster template
// @route   DELETE /api/posters/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
  try {
    const template = await PosterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Poster template not found' });
    }

    // Clean up local background file
    if (template.backgroundImage && template.backgroundImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', template.backgroundImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await PosterTemplate.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_POSTER_TEMPLATE', `Deleted poster template: ${template.name}`, req);

    // If we deleted the default, set another one as default
    if (template.isDefault) {
      const another = await PosterTemplate.findOne();
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    res.json({ success: true, message: 'Poster template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
