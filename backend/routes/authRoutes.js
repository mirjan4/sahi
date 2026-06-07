const express = require('express');
const router = express.Router();
const {
  login,
  registerAdmin,
  getProfile,
  updateProfile,
  getAdmins,
  updateAdminStatus,
  deleteAdmin,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.post('/login', login);
router.post('/register', protect, authorize('superadmin'), registerAdmin);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/admins', protect, authorize('superadmin'), getAdmins);
router.put('/admins/:id/status', protect, authorize('superadmin'), updateAdminStatus);
router.delete('/admins/:id', protect, authorize('superadmin'), deleteAdmin);

module.exports = router;
