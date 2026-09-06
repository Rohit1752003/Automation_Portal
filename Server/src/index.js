require("dotenv").config();

const dns = require("dns");

// ============================================================
// NETWORK CONFIGURATION
// ============================================================

// Prefer IPv4 connections.
// Some local networks have unreliable IPv6 connectivity.
dns.setDefaultResultOrder("ipv4first");

// ============================================================
// IMPORTS
// ============================================================

const app = require("./app");

const env = require("./config/environment");

const connectDB = require("./config/database");

// ============================================================
// SERVER
// ============================================================

const PORT = env.PORT;

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    // Connect to MongoDB first.
    await connectDB();

    // Start Express server only after
    // database connection succeeds.
    app.listen(PORT, () => {
      console.log(
        `🚀 DocuFlow Server running in ${env.NODE_ENV} mode on port ${PORT}`
      );
    });

  } catch (error) {

    console.error(
      "❌ Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();