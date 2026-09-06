const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/environment");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const requestRoutes = require("./routes/requestRoutes");
const auditRoutes = require("./routes/auditRoutes");

const { verifyDocument } = require("./controllers/verifyController");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

app.use(helmet());

// ============================================================
// RATE LIMITING
// ============================================================

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT_MAX_REQUESTS,

  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again later.",
  },
});

app.use("/api", limiter);

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// ============================================================
// STATIC FILES
// ============================================================

app.use(
  "/generated",
  express.static(env.GENERATED_DIR)
);

app.use(
  "/uploads",
  (req, res, next) => {
    // Allow uploaded documents to be displayed
    // inside the admin application's iframe.

    res.removeHeader("X-Frame-Options");

    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors 'self' http://localhost:5173"
    );

    next();
  },
  express.static(env.UPLOAD_DIR)
);

// ============================================================
// API ROUTES
// ============================================================

app.use("/api", authRoutes);

app.use("/api", adminRoutes);

app.use("/api", requestRoutes);

app.use("/api", auditRoutes);

// ============================================================
// PUBLIC DOCUMENT VERIFICATION
// ============================================================

app.get(
  "/api/verify/:verificationId",
  verifyDocument
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;