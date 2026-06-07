const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getEvents).post(protect, createEvent);
router.route('/:id').get(getEventById).put(protect, updateEvent).delete(protect, deleteEvent);

module.exports = router;
