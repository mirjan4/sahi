const Setting = require('../models/Setting');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    
    // Convert array to key-value object
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update system settings
// @route   POST /api/settings
// @access  Private/SuperAdmin
const updateSettings = async (req, res) => {
  const settingsData = req.body; // Key-value pairs { key1: val1, key2: val2 }

  try {
    const promises = Object.keys(settingsData).map(async (key) => {
      let setting = await Setting.findOne({ key });
      if (setting) {
        setting.value = String(settingsData[key]);
        return setting.save();
      } else {
        return Setting.create({ key, value: String(settingsData[key]) });
      }
    });

    await Promise.all(promises);
    await logAction(req.user._id, 'UPDATE_SETTINGS', `Updated global system configurations: ${Object.keys(settingsData).join(', ')}`, req);

    // Get fresh list
    const updatedSettings = await Setting.find();
    const settingsObj = {};
    updatedSettings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload multiple homepage hero/banner images
// @route   POST /api/settings/hero-images
// @access  Private/Admin
const uploadHeroImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided.' });
    }

    const newUrls = req.files.map((f) => f.location);

    // Get existing banners array
    let setting = await Setting.findOne({ key: 'festival_banners' });
    let existingUrls = [];
    if (setting && setting.value) {
      try { existingUrls = JSON.parse(setting.value); } catch { existingUrls = []; }
    }

    const mergedUrls = [...existingUrls, ...newUrls];
    const jsonValue = JSON.stringify(mergedUrls);

    if (setting) {
      setting.value = jsonValue;
      await setting.save();
    } else {
      await Setting.create({ key: 'festival_banners', value: jsonValue });
    }

    await logAction(req.user._id, 'UPDATE_HERO_IMAGES', `Added ${newUrls.length} hero banner image(s)`, req);

    res.json({ success: true, urls: mergedUrls, message: `${newUrls.length} image(s) uploaded successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a single hero image by index
// @route   DELETE /api/settings/hero-image/:index
// @access  Private/Admin
const removeHeroImage = async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    let setting = await Setting.findOne({ key: 'festival_banners' });
    let urls = [];
    if (setting && setting.value) {
      try { urls = JSON.parse(setting.value); } catch { urls = []; }
    }
    if (idx < 0 || idx >= urls.length) {
      return res.status(400).json({ success: false, message: 'Invalid index.' });
    }
    urls.splice(idx, 1);
    if (setting) {
      setting.value = JSON.stringify(urls);
      await setting.save();
    }
    res.json({ success: true, urls, message: 'Image removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadHeroImages,
  removeHeroImage,
};
