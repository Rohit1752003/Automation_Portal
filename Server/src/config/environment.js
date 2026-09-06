const path = require("path");

const config = {
  // ==========================
  // Server
  // ==========================
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
  FRONTEND_URL:
  process.env.FRONTEND_URL ||
  "http://localhost:5173",

  // ==========================
  // Database
  // ==========================
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME || "college_document_portal",

  // ==========================
  // Authentication
  // ==========================
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",
  JWT_ISSUER: process.env.JWT_ISSUER || "CollegeDoc",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "CollegeDocUsers",

  // ==========================
  // CORS
  // ==========================
CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  // ==========================
  // File Upload
  // ==========================
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ["pdf", "jpg", "jpeg", "png"],
  UPLOAD_DIR: path.join(
    process.cwd(),
    process.env.UPLOAD_DIR || "uploads"
  ),

  GENERATED_DIR: path.join(
    process.cwd(),
    process.env.GENERATED_DIR || "generated"
  ),

  // ==========================
  // Email
  // ==========================
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,

  // ==========================
  // AI
  // ==========================
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  // ==========================
// Cloudinary
// ==========================
CLOUDINARY_CLOUD_NAME:
  process.env.CLOUDINARY_CLOUD_NAME,

CLOUDINARY_API_KEY:
  process.env.CLOUDINARY_API_KEY,

CLOUDINARY_API_SECRET:
  process.env.CLOUDINARY_API_SECRET,

  // ==========================
  // Logging
  // ==========================
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // ==========================
  // Security
  // ==========================
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 10,

  RATE_LIMIT_WINDOW:
    (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,

  RATE_LIMIT_MAX_REQUESTS:
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // ==========================
  // Feature Flags
  // ==========================
  ENABLE_EMAIL_VERIFICATION:
    process.env.ENABLE_EMAIL_VERIFICATION === "true",

  ENABLE_2FA:
    process.env.ENABLE_2FA === "true",

  ENABLE_API_DOCS:
    process.env.ENABLE_API_DOCS !== "false",

  // ==========================
  // Environment Helpers
  // ==========================
  isDevelopment() {
    return this.NODE_ENV === "development";
  },

  isProduction() {
    return this.NODE_ENV === "production";
  },

  isTest() {
    return this.NODE_ENV === "test";
  },
};

// Validate required environment variables
if (!config.isTest()) {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "GROQ_API_KEY",
    "EMAIL_USER",
    "EMAIL_PASS",
  ];

  const missing = required.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}


module.exports = Object.freeze(config);