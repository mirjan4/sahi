require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Setting = require('./models/Setting');
const Category = require('./models/Category');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const unitRoutes = require('./routes/unitRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participantRoutes = require('./routes/participantRoutes');
const resultRoutes = require('./routes/resultRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const settingRoutes = require('./routes/settingRoutes');
const posterRoutes = require('./routes/posterRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Database connection
connectDB();

const seedSystem = async () => {
  try {
    // 1. Seed Super Admin if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const name = process.env.DEFAULT_SUPERADMIN_NAME;
      const email = process.env.DEFAULT_SUPERADMIN_EMAIL;
      let password = process.env.DEFAULT_SUPERADMIN_PASSWORD;

      if (!name || !email) {
        console.warn('⚠️ WARNING: Seeding super admin skipped because DEFAULT_SUPERADMIN_NAME or DEFAULT_SUPERADMIN_EMAIL is missing from environment variables.');
      } else {
        let isGenerated = false;
        if (!password) {
          const crypto = require('crypto');
          password = crypto.randomBytes(10).toString('hex') + '!'; // Generate 21-character random password
          isGenerated = true;
        }

        const superAdmin = await User.create({
          name,
          email,
          password,
          role: 'superadmin',
          isActive: true,
          mustChangePassword: true,
        });

        // Audit Logging (no request object available during system startup)
        const { logAction } = require('./utils/auditLogger');
        await logAction(superAdmin._id, 'SEED_SUPERADMIN', `Seeded default Super Admin account with email: ${email}`);

        console.log('----------------------------------------------------');
        console.log('Seeded Default Super Admin Account successfully:');
        console.log(`Email: ${email}`);
        if (isGenerated) {
          console.log(`Generated Password: ${password}`);
          console.log('⚠️ Please write down this password, it will not be displayed again!');
        } else {
          console.log('Password: [Configured in Environment Variables]');
        }
        console.log('----------------------------------------------------');
      }
    }

    // 2. Seed Default Settings if not present
    const defaultSettings = {
      festival_name: 'Sahithyolsav 2026',
      festival_theme: 'Explore the Colors of Literature',
      festival_banner: '',
      theme_color: 'indigo',
      is_live: 'true',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      const exists = await Setting.findOne({ key });
      if (!exists) {
        await Setting.create({ key, value });
      }
    }
    console.log('Default system settings checked/seeded successfully.');

    // 3. Seed Default Categories if none exist
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'General', code: 'GEN' },
        { name: 'General Category-A', code: 'CAT-A' },
        { name: 'General Category-B', code: 'CAT-B' },
        { name: 'High School', code: 'HS' },
        { name: 'Higher Secondary', code: 'HSS' },
        { name: 'Junior', code: 'JR' },
        { name: 'Lower Primary', code: 'LP' },
        { name: 'Senior', code: 'SR' },
        { name: 'Upper Primary', code: 'UP' },
      ];
      await Category.insertMany(defaultCategories);
      console.log('Default categories checked/seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding initial system data:', error);
  }
};

// Execute seeding after connection has been made
seedSystem();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL, // e.g. https://sahi-frontend.onrender.com
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health-checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/posters', posterRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/system', systemRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Sahithyolsav Result Management Platform API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
