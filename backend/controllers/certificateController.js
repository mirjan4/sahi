const CertificateTemplate = require('../models/CertificateTemplate');
const { logAction } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

// @desc    Get all certificate templates
// @route   GET /api/certificates/templates
// @access  Public
const getTemplates = async (req, res) => {
  try {
    const templates = await CertificateTemplate.find().sort('-createdAt');
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single certificate template
// @route   GET /api/certificates/templates/:id
// @access  Public
const getTemplateById = async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Certificate template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create certificate template
// @route   POST /api/certificates/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
  const { name, config, isDefault } = req.body;
  let backgroundImage = '';

  if (req.file) {
    backgroundImage = req.file.location;
  }

  if (!backgroundImage) {
    return res.status(400).json({ success: false, message: 'Please upload a background image template' });
  }

  try {
    let parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
    const shouldBeDefault = isDefault === 'true' || isDefault === true;

    if (shouldBeDefault) {
      await CertificateTemplate.updateMany({}, { isDefault: false });
    }

    const template = await CertificateTemplate.create({
      name,
      backgroundImage,
      config: parsedConfig,
      isDefault: shouldBeDefault,
    });

    const count = await CertificateTemplate.countDocuments();
    if (count === 1 && !template.isDefault) {
      template.isDefault = true;
      await template.save();
    }

    await logAction(req.user._id, 'CREATE_CERTIFICATE_TEMPLATE', `Created certificate template: ${name}`, req);
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update certificate template
// @route   PUT /api/certificates/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
  const { name, config, isDefault } = req.body;

  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Certificate template not found' });
    }

    if (req.file) {
      if (template.backgroundImage && template.backgroundImage.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', template.backgroundImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      template.backgroundImage = req.file.location;
    }

    template.name = name || template.name;
    
    if (config) {
      const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
      template.config = { ...template.config, ...parsedConfig };
    }

    if (isDefault !== undefined) {
      const shouldBeDefault = isDefault === 'true' || isDefault === true;
      if (shouldBeDefault) {
        await CertificateTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
        template.isDefault = true;
      } else {
        template.isDefault = false;
      }
    }

    const updatedTemplate = await template.save();
    await logAction(req.user._id, 'UPDATE_CERTIFICATE_TEMPLATE', `Updated certificate template: ${template.name}`, req);

    res.json({ success: true, template: updatedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete certificate template
// @route   DELETE /api/certificates/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Certificate template not found' });
    }

    if (template.backgroundImage && template.backgroundImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', template.backgroundImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await CertificateTemplate.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_CERTIFICATE_TEMPLATE', `Deleted certificate template: ${template.name}`, req);

    if (template.isDefault) {
      const another = await CertificateTemplate.findOne();
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    res.json({ success: true, message: 'Certificate template deleted successfully' });
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
