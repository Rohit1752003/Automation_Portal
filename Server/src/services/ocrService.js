const fs = require("fs");
const path = require("path");
const os = require("os");
const dns = require("dns");

const axios = require("axios");
const Tesseract = require("tesseract.js");
const { pdf } = require("pdf-to-img");

// ============================================================
// CONFIG
// ============================================================

const OCR_TIMEOUT = 60000;

const MAX_DOWNLOAD_SIZE =
  20 * 1024 * 1024;

// Prefer IPv4.
// This avoids the Cloudinary IPv6 timeout problem that
// happened on your machine.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  console.warn(
    "Unable to set DNS result order:",
    error.message
  );
}

// ============================================================
// GET EXTENSION FROM URL
// ============================================================

const getExtensionFromUrl = (
  fileUrl
) => {
  try {
    const url =
      new URL(fileUrl);

    return path
      .extname(url.pathname)
      .toLowerCase();
  } catch {
    return "";
  }
};

// ============================================================
// GET EXTENSION FROM CONTENT TYPE
// ============================================================

const getExtensionFromContentType = (
  contentType = ""
) => {
  const type =
    contentType.toLowerCase();

  if (
    type.includes(
      "application/pdf"
    )
  ) {
    return ".pdf";
  }

  if (
    type.includes("jpeg") ||
    type.includes("jpg")
  ) {
    return ".jpg";
  }

  if (
    type.includes("png")
  ) {
    return ".png";
  }

  if (
    type.includes("webp")
  ) {
    return ".webp";
  }

  return "";
};

// ============================================================
// DETERMINE FILE TYPE
// ============================================================

const getFileType = (
  extension = "",
  contentType = ""
) => {
  const normalizedExtension =
    extension.toLowerCase();

  const normalizedContentType =
    contentType.toLowerCase();

  // ==========================================================
  // PDF
  // ==========================================================

  if (
    normalizedExtension === ".pdf" ||
    normalizedContentType.includes(
      "application/pdf"
    )
  ) {
    return "pdf";
  }

  // ==========================================================
  // IMAGE
  // ==========================================================

  if (
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ].includes(
      normalizedExtension
    ) ||
    normalizedContentType.startsWith(
      "image/"
    )
  ) {
    return "image";
  }

  return "unknown";
};

// ============================================================
// DOWNLOAD REMOTE FILE
// ============================================================

const downloadTemporaryFile = async (
  fileUrl
) => {
  if (!fileUrl) {
    throw new Error(
      "Remote file URL is required."
    );
  }

  let extension =
    getExtensionFromUrl(
      fileUrl
    );

  console.log(
    "Downloading remote document..."
  );

  try {
    const response =
      await axios.get(
        fileUrl,
        {
          responseType:
            "arraybuffer",

          timeout:
            OCR_TIMEOUT,

          maxContentLength:
            MAX_DOWNLOAD_SIZE,

          maxBodyLength:
            MAX_DOWNLOAD_SIZE,

          // Force IPv4 at the HTTP request level.
          family: 4,

          maxRedirects: 5,

          validateStatus:
            (status) =>
              status >= 200 &&
              status < 300,
        }
      );

    // ========================================================
    // CONTENT TYPE
    // ========================================================

    const contentType =
      response.headers[
        "content-type"
      ] || "";

    // ========================================================
    // DETERMINE EXTENSION
    // ========================================================

    if (!extension) {
      extension =
        getExtensionFromContentType(
          contentType
        );
    }

    if (!extension) {
      throw new Error(
        `Unable to determine document type. Content-Type: ${
          contentType ||
          "unknown"
        }`
      );
    }

    // ========================================================
    // CREATE TEMP FILE
    // ========================================================

    const tempFilePath =
      path.join(
        os.tmpdir(),
        `college-doc-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${extension}`
      );

    await fs.promises.writeFile(
      tempFilePath,
      response.data
    );

    console.log(
      "Remote document downloaded successfully."
    );

    return {
      path: tempFilePath,
      temporary: true,
      contentType,
    };
  } catch (error) {
    let message =
      error.message ||
      "Unknown download error";

    // ========================================================
    // FRIENDLY NETWORK ERRORS
    // ========================================================

    if (
      error.code ===
      "ETIMEDOUT"
    ) {
      message =
        "Cloudinary connection timed out. Check your internet connection or network.";
    }

    if (
      error.code ===
      "ENETUNREACH"
    ) {
      message =
        "Cloudinary network is unreachable.";
    }

    if (
      error.code ===
      "ECONNRESET"
    ) {
      message =
        "Connection to Cloudinary was reset.";
    }

    if (
      error.code ===
      "ECONNREFUSED"
    ) {
      message =
        "Connection to Cloudinary was refused.";
    }

    console.error(
      "Remote document download failed:",
      message
    );

    throw new Error(
      `Unable to download document from Cloudinary: ${message}`
    );
  }
};

// ============================================================
// GET LOCAL OR REMOTE FILE
// ============================================================

const getLocalFile = async (
  filePath
) => {
  if (!filePath) {
    throw new Error(
      "File path or URL is required for OCR."
    );
  }

  // ==========================================================
  // REMOTE URL
  // ==========================================================

  if (
    typeof filePath === "string" &&
    /^https?:\/\//i.test(
      filePath
    )
  ) {
    return await downloadTemporaryFile(
      filePath
    );
  }

  // ==========================================================
  // LOCAL FILE
  // ==========================================================

  if (
    typeof filePath === "string" &&
    fs.existsSync(filePath)
  ) {
    return {
      path: filePath,
      temporary: false,
      contentType: "",
    };
  }

  throw new Error(
    `Document not found: ${filePath}`
  );
};

// ============================================================
// IMAGE OCR
// ============================================================

const extractTextFromImage = async (
  filePath
) => {
  console.log(
    "Starting image OCR..."
  );

  try {
    const result =
      await Tesseract.recognize(
        filePath,
        "eng",
        {
          logger: (info) => {
            if (
              info.status ===
              "recognizing text"
            ) {
              console.log(
                `OCR progress: ${Math.round(
                  info.progress * 100
                )}%`
              );
            }
          },
        }
      );

    const text =
      result?.data?.text?.trim() ||
      "";

    console.log(
      "Image OCR completed."
    );

    console.log(
      "Extracted characters:",
      text.length
    );

    return text;
  } catch (error) {
    console.error(
      "Image OCR failed:",
      error.message
    );

    throw new Error(
      `Image OCR failed: ${error.message}`
    );
  }
};

// ============================================================
// PDF OCR
// ============================================================

const extractTextFromPdf = async (
  filePath
) => {
  console.log(
    "Starting PDF OCR..."
  );

  let extractedText = "";

  try {
    const document =
      await pdf(
        filePath,
        {
          scale: 2,
        }
      );

    let pageNumber = 0;

    for await (
      const image of document
    ) {
      pageNumber++;

      console.log(
        `OCR processing PDF page ${pageNumber}...`
      );

      try {
        const result =
          await Tesseract.recognize(
            image,
            "eng"
          );

        const pageText =
          result?.data?.text?.trim() ||
          "";

        extractedText +=
          `\n\n--- Page ${pageNumber} ---\n\n`;

        extractedText +=
          pageText;
      } catch (error) {
        console.error(
          `OCR failed on PDF page ${pageNumber}:`,
          error.message
        );

        extractedText +=
          `\n\n--- Page ${pageNumber} ---\n\n`;

        extractedText +=
          "[OCR failed for this page]";
      }
    }

    console.log(
      `PDF OCR completed. Pages: ${pageNumber}`
    );

    console.log(
      "Extracted characters:",
      extractedText.length
    );

    return extractedText.trim();
  } catch (error) {
    console.error(
      "PDF OCR failed:",
      error.message
    );

    throw new Error(
      `PDF OCR failed: ${error.message}`
    );
  }
};

// ============================================================
// MAIN OCR FUNCTION
// ============================================================

const extractTextFromDocument = async (
  filePath
) => {
  let fileInfo = null;

  try {
    // ========================================================
    // GET FILE
    // ========================================================

    fileInfo =
      await getLocalFile(
        filePath
      );

    const localFilePath =
      fileInfo.path;

    const contentType =
      fileInfo.contentType ||
      "";

    // ========================================================
    // DETERMINE EXTENSION
    // ========================================================

    const extension =
      path
        .extname(
          localFilePath
        )
        .toLowerCase();

    const fileType =
      getFileType(
        extension,
        contentType
      );

    console.log(
      "=========================================="
    );

    console.log(
      "OCR DOCUMENT"
    );

    console.log(
      "Extension:",
      extension
    );

    console.log(
      "Content-Type:",
      contentType ||
        "unknown"
    );

    console.log(
      "Detected type:",
      fileType
    );

    console.log(
      "=========================================="
    );

    // ========================================================
    // IMAGE
    // ========================================================

    if (
      fileType ===
      "image"
    ) {
      return await extractTextFromImage(
        localFilePath
      );
    }

    // ========================================================
    // PDF
    // ========================================================

    if (
      fileType ===
      "pdf"
    ) {
      return await extractTextFromPdf(
        localFilePath
      );
    }

    // ========================================================
    // UNSUPPORTED
    // ========================================================

    throw new Error(
      `Unsupported document format: ${
        extension ||
        contentType ||
        "unknown"
      }`
    );
  } finally {
    // ========================================================
    // DELETE TEMP FILE
    // ========================================================

    if (
      fileInfo?.temporary &&
      fileInfo?.path
    ) {
      try {
        await fs.promises.unlink(
          fileInfo.path
        );

        console.log(
          "Temporary OCR file deleted."
        );
      } catch (error) {
        console.warn(
          "Unable to delete temporary OCR file:",
          error.message
        );
      }
    }
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  extractTextFromDocument,
};