const env = require("../config/environment");
const { ZodError } = require("zod");

const errorHandler = (err, req, res, next) => {
  // =========================
  // LOG ERROR
  // =========================

  console.error("🔥 Error:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // =========================
  // ZOD VALIDATION ERROR
  // =========================

  if (err instanceof ZodError) {
    const issues = err.issues || err.errors || [];

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: issues.map((issue) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message,
      })),
    });
  }

  // =========================
  // MONGODB INVALID OBJECT ID
  // =========================

  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found with ID: ${err.value}`;
  }

  // =========================
  // DUPLICATE KEY
  // =========================

  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    statusCode = 400;
    message = field
      ? `${field} already exists.`
      : "Duplicate value already exists.";
  }

  // =========================
  // MONGOOSE VALIDATION
  // =========================

  else if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors || {})
      .map((error) => error.message)
      .join(", ");
  }

  // =========================
  // INVALID JWT
  // =========================

  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authorization token.";
  }

  // =========================
  // EXPIRED JWT
  // =========================

  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authorization token expired.";
  }

  // =========================
  // INVALID JSON
  // =========================

  else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    message = "Invalid JSON payload.";
  }

  // =========================
  // MULTER ERRORS
  // =========================

  else if (err.name === "MulterError") {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size is too large.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected file field: ${err.field || "unknown"}`;
    } else {
      message = err.message || "File upload failed.";
    }
  }

  // =========================
  // FINAL RESPONSE
  // =========================

  return res.status(statusCode).json({
    success: false,
    message,

    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;