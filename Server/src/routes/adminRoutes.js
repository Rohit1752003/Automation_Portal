const express = require("express");
const router = express.Router();

const {
  getStudents,
  getAdminProfile,
  getDashboardStats,
} = require("../controllers/adminController");

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

router.get(
  "/students",
  verifyToken,
  isAdmin,
  getStudents
);

router.get(
  "/admin/:id",
  verifyToken,
  isAdmin,
  getAdminProfile
);

router.get(
  "/dashboard/stats",
  verifyToken,
  isAdmin,
  getDashboardStats
);

module.exports = router;