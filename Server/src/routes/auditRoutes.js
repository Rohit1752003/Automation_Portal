const express = require("express");

const router = express.Router();

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

const {
  getRequestHistory,
} = require("../controllers/auditController");

router.get(
  "/audit/:requestId",
  verifyToken,
  isAdmin,
  getRequestHistory
);

module.exports = router;