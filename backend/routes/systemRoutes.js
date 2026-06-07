const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAuditLogs,
  backupDatabase,
  restoreDatabase,
} = require('../controllers/systemController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/audit-logs', protect, authorize('superadmin'), getAuditLogs);
router.get('/backup', protect, authorize('superadmin'), backupDatabase);
router.post('/restore', protect, authorize('superadmin'), upload.single('file'), restoreDatabase);

module.exports = router;
