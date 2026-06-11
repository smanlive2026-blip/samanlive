const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config - managers ke liye alag folder
const managerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/uploads/managers');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.fieldname + '-' + Date.now();
        cb(null, name + ext);
    }
});

// General upload ke liye - jo pehle se tha
const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.fieldname + '-' + Date.now();
        cb(null, name + ext);
    }
});

// Manager upload - 10MB limit
const managerUpload = multer({
    storage: managerStorage,
    limits: { 
        fileSize: 10 * 1024 * 1024,  // 10MB per file
        fieldSize: 25 * 1024  // 25MB total
    },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF allowed'));
        }
    }
});

// Normal upload - 5MB limit
const upload = multer({ 
    storage: generalStorage,
    limits: { fileSize: 5 * 1024 }
});

module.exports = { managerUpload, upload };