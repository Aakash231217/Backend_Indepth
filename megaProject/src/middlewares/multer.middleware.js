import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFields = ['avatar', 'coverImage'];
  if (allowedFields.includes(file.fieldname)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});
