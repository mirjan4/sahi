const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, uploadHeroImages, removeHeroImage } = require('../controllers/settingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { upload, uploadToStorage, uploadToStorageMultiple } = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(getSettings)
  .post(protect, authorize('superadmin'), updateSettings);

// Multiple hero images upload (also handles single)
router.post(
  '/hero-images',
  protect,
  authorize('superadmin', 'admin'),
  upload.array('hero_images', 10),
  uploadToStorageMultiple,
  uploadHeroImages
);

// Remove a single hero image by index
router.delete(
  '/hero-image/:index',
  protect,
  authorize('superadmin', 'admin'),
  removeHeroImage
);

module.exports = router;
