const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/auditLogger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'sahithyolsav_super_secret_jwt_key_987654321', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Your account is deactivated' });
      }

      // Audit Logging
      if (user.mustChangePassword) {
        await logAction(user._id, 'FIRST_LOGIN', `Super admin logged in for the first time. Password change required.`, req);
      } else {
        await logAction(user._id, 'LOGIN', `User logged in successfully`, req);
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new admin
// @route   POST /api/auth/register
// @access  Private/SuperAdmin
const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin',
    });

    if (user) {
      await logAction(req.user._id, 'CREATE_ADMIN', `Created admin account for ${email}`, req);
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      let isFirstPasswordChange = false;
      let isPasswordChange = false;

      if (req.body.password) {
        user.password = req.body.password;
        isPasswordChange = true;
        if (user.mustChangePassword) {
          user.mustChangePassword = false;
          isFirstPasswordChange = true;
        }
      }

      const updatedUser = await user.save();

      if (isFirstPasswordChange) {
        await logAction(updatedUser._id, 'FIRST_PASSWORD_CHANGE', `Super admin completed first-time password change`, req);
      } else if (isPasswordChange) {
        await logAction(updatedUser._id, 'PASSWORD_CHANGE', `Changed account password`, req);
      } else {
        await logAction(req.user._id, 'UPDATE_PROFILE', `Updated own profile information`, req);
      }

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          mustChangePassword: updatedUser.mustChangePassword,
        },
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all admin users
// @route   GET /api/auth/admins
// @access  Private/SuperAdmin
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ _id: { $ne: req.user._id } }).sort('-createdAt');
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle admin status (Active/Inactive)
// @route   PUT /api/auth/admins/:id/status
// @access  Private/SuperAdmin
const updateAdminStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    await logAction(
      req.user._id,
      'TOGGLE_ADMIN_STATUS',
      `Toggled status of admin ${user.email} to ${user.isActive ? 'Active' : 'Inactive'}`,
      req
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an admin user
// @route   DELETE /api/auth/admins/:id
// @access  Private/SuperAdmin
const deleteAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Super admin accounts cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_ADMIN', `Deleted admin account for ${user.email}`, req);

    res.json({ success: true, message: 'Admin user removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  registerAdmin,
  getProfile,
  updateProfile,
  getAdmins,
  updateAdminStatus,
  deleteAdmin,
};
