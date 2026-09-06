const rateLimit = require("express-rate-limit");

// ============================================================
// LOGIN RATE LIMITER
// ============================================================

// Protect login endpoint against brute-force attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum 5 login requests per IP
  // within the 15-minute window.
  limit: 5,

  message: {
    success: false,
    message:
      "Too many login attempts, please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// GENERAL AUTH RATE LIMITER
// ============================================================

// Protect authentication-related endpoints
// such as register, password-related operations, etc.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum 50 requests per IP
  // within the 15-minute window.
  limit: 50,

  message: {
    success: false,
    message:
      "Too many requests, please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  loginLimiter,
  authLimiter,
};