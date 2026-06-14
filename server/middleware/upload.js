const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== HELPER: Folder Create ====================
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ==================== HELPER: Filename Generate ====================
const generateFilename = (req, file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${file.fieldname}-${timestamp}-${random}${ext}`;
};

// ==================== STORAGE CONFIG ====================

// 1. Manager Documents - 10MB limit
const managerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/managers');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(req, file));
  }
});

// 2. Shop Images - 5MB limit
const shopStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = path.join(__dirname, '../../public/uploads/shops');
    if (file.fieldname === 'banner') {
      dir = path.join(__dirname, '../../public/banners');
    }
    if (file.fieldname === 'logo') {
      dir = path.join(__dirname, '../../public/logos');
    }
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(req, file));
  }
});

// 3. Videos - 50MB limit
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/videos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(req, file));
  }
});

// 4. General Upload - 5MB limit
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(req, file));
  }
});

// ==================== FILE FILTERS ====================

// Images + PDF only - Manager ke liye
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  }
};

// Images only - Shop/Banner/Logo ke liye
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
};

// Videos only
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video/.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, MOV, AVI, MKV, WEBM videos are allowed'), false);
  }
};

// ==================== MULTER INSTANCES ====================

// 1. Manager Documents Upload - 10MB
const managerUpload = multer({
  storage: managerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    fieldSize: 25 * 1024 // 25MB total
  },
  fileFilter: documentFilter
});

// 2. Shop Images Upload - 5MB
const shopUpload = multer({
  storage: shopStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFilter
});

// 3. Video Upload - 50MB
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: videoFilter
});

// 4. General Upload - 5MB
const upload = multer({
  storage: generalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB - FIX: Pehle 5KB tha
  },
  fileFilter: imageFilter
});

// ==================== ERROR HANDLER ====================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Check size limits.'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

module.exports = {
  managerUpload,
  shopUpload,
  videoUpload,
  upload,
  handleMulterError
};