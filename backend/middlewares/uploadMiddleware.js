const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Local Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter (images and PDFs)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images or PDFs Only!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

const spreadsheetFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls|csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/octet-stream'
  ];
  const mimetype = mimetypes.includes(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Excel or CSV Files Only!'));
  }
};

const uploadSpreadsheet = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: spreadsheetFilter,
});

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary storage engine configured successfully.');
} else {
  console.log('Cloudinary credentials missing. Falling back to local disk storage.');
}

// Helper middleware to upload to Cloudinary after multer saves file locally
const uploadToStorage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (isCloudinaryConfigured) {
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'sahithyolsav',
        resource_type: 'auto',
      });
      
      // Delete local temporary file
      fs.unlinkSync(req.file.path);

      // Save Cloudinary details in req.file.path or URL
      req.file.location = result.secure_url;
      req.file.cloudinaryId = result.public_id;
      next();
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local file if Cloudinary fails
      req.file.location = `/uploads/${req.file.filename}`;
      next();
    }
  } else {
    // Local fallback path
    req.file.location = `/uploads/${req.file.filename}`;
    next();
  }
};

// Helper middleware to upload MULTIPLE files to storage after multer
const uploadToStorageMultiple = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'sahithyolsav',
            resource_type: 'auto',
          });
          fs.unlinkSync(file.path);
          file.location = result.secure_url;
          file.cloudinaryId = result.public_id;
        } else {
          file.location = `/uploads/${file.filename}`;
        }
      })
    );
    next();
  } catch (error) {
    console.error('Storage upload error:', error);
    // Fallback — use local paths
    req.files.forEach((f) => { if (!f.location) f.location = `/uploads/${f.filename}`; });
    next();
  }
};

const uploadPosterFields = upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'firstSymbol', maxCount: 1 },
  { name: 'secondSymbol', maxCount: 1 },
  { name: 'thirdSymbol', maxCount: 1 },
]);

const uploadPosterToStorage = async (req, res, next) => {
  if (!req.files) return next();

  try {
    const fileFields = ['backgroundImage', 'firstSymbol', 'secondSymbol', 'thirdSymbol'];
    
    for (const field of fileFields) {
      if (req.files[field] && req.files[field][0]) {
        const file = req.files[field][0];
        
        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'sahithyolsav',
            resource_type: 'auto',
          });
          fs.unlinkSync(file.path);
          file.location = result.secure_url;
          file.cloudinaryId = result.public_id;
        } else {
          file.location = `/uploads/${file.filename}`;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Poster files storage upload error:', error);
    next(error);
  }
};

module.exports = { 
  upload, 
  uploadSpreadsheet, 
  uploadToStorage, 
  uploadToStorageMultiple,
  uploadPosterFields,
  uploadPosterToStorage
};
