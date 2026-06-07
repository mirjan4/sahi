const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, uploadToStorage } = require('../middlewares/uploadMiddleware');

router.route('/')
  .get(getAnnouncements)
  .post(protect, upload.single('attachment'), uploadToStorage, createAnnouncement);

router.route('/:id')
  .get(getAnnouncementById)
  .put(protect, upload.single('attachment'), uploadToStorage, updateAnnouncement)
  .delete(protect, deleteAnnouncement);

module.exports = router;
