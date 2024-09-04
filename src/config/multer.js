import multer from 'multer';

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './src/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb({
      message: 'Unsupported file format'
    }, false);
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: fileFilter
}) 

export default upload;