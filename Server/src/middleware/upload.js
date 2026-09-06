const multer = require("multer");

const BadRequestError = require("../errors/BadRequestError");

const storage =
  multer.memoryStorage();

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    !allowedTypes.includes(
      file.mimetype
    )
  ) {
    return cb(
      new BadRequestError(
        "Only PDF, JPG and PNG files are allowed"
      )
    );
  }

  cb(null, true);
};

module.exports = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});