const express = require('express');
const router = express.Router();
const {
  getUnits,
  getLeaderboard,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  updateStandings,
} = require('../controllers/unitController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getUnits).post(protect, createUnit);
router.get('/leaderboard', getLeaderboard);
router.put('/standings', protect, updateStandings);
router.route('/:id').get(getUnitById).put(protect, updateUnit).delete(protect, deleteUnit);

module.exports = router;
