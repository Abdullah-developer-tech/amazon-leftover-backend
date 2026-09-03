const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  // Tamam formats allow: jpg, jpeg, png, webp, gif, svg, avif, bmp, tiff, heic, heif
  const allowed = /\.(jpeg|jpg|png|webp|gif|svg|avif|bmp|tiff|heic|heif)$/i;
  const isExtAllowed = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream';

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPG, PNG, WEBP, SVG, AVIF, GIF, etc.)'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

module.exports = upload;