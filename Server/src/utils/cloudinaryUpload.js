const cloudinary = require("../config/cloudinary");

const sanitizePublicId = (originalName = "document") => {
  return originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 150);
};

const uploadToCloudinary = (
  fileBuffer,
  originalName,
  mimetype
) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(
        new Error("File buffer is required")
      );
    }

    const isPdf =
      mimetype === "application/pdf";

    const resourceType = isPdf
      ? "image"
      : "image";

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: "college-docs/uploads",

          /*
           * PDFs are intentionally uploaded as
           * Cloudinary image assets.
           *
           * This allows Cloudinary to deliver the
           * original PDF and also generate page
           * previews.
           */
          resource_type: resourceType,

          public_id:
            sanitizePublicId(
              originalName
            ),

          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },

        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (
            !result ||
            !result.secure_url
          ) {
            return reject(
              new Error(
                "Cloudinary upload completed but no secure URL was returned"
              )
            );
          }

          resolve(result);
        }
      );

    uploadStream.end(fileBuffer);
  });
};

module.exports =
  uploadToCloudinary;