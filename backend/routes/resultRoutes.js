const express = require('express');
const router = express.Router();
const {
  getResults,
  getResultById,
  getResultByEventId,
  createOrUpdateResult,
  togglePublishResult,
  deleteResult,
} = require('../controllers/resultController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getResults).post(protect, createOrUpdateResult);
router.get('/event/:eventId', getResultByEventId);
router.put('/:id/publish', protect, togglePublishResult);
router.route('/:id').get(getResultById).delete(protect, deleteResult);

module.exports = router;
