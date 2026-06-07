const express = require('express');
const router = express.Router();
const {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, uploadToStorage } = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(getGallery)
  .post(protect, upload.single('media'), uploadToStorage, createGalleryItem);

router.delete('/:id', protect, deleteGalleryItem);

module.exports = router;
