const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createRequest,
  getAllRequests,
  getStudentRequests,
  getRequestById,
  runAIReview,
  approveRequest,
  rejectRequest,
  deleteRequest,
  resubmitRequest,
} = require("../controllers/requestController");

const {
  verifyToken,
  isAdmin,
  isStudent,
} = require("../middleware/auth");


// =========================
// STUDENT ROUTES
// =========================
router.post(
  "/requests",
  verifyToken,
  isStudent,
  upload.single("document"),
  createRequest
);
// Get Logged-in Student Requests
router.get(
  "/requests/student",
  verifyToken,
  isStudent,
  getStudentRequests
);

// Resubmit Request
router.put(
  "/requests/:id/resubmit",
  verifyToken,
  isStudent,
  upload.single("document"),
  resubmitRequest
);

// =========================
// ADMIN ROUTES
// =========================

// Get All Requests
router.get(
  "/requests",
  verifyToken,
  isAdmin,
  getAllRequests
);

// Run AI Review
router.post(
  "/requests/:id/ai-review",
  verifyToken,
  isAdmin,
  runAIReview
);

// Approve Request
router.put(
  "/requests/:id/approve",
  verifyToken,
  isAdmin,
  approveRequest
);

// Reject Request
router.put(
  "/requests/:id/reject",
  verifyToken,
  isAdmin,
  rejectRequest
);

// =========================
// COMMON ROUTES
// =========================

// Get Single Request
router.get(
  "/requests/:id",
  verifyToken,
  getRequestById
);

// Delete Request
router.delete(
  "/requests/:id",
  verifyToken,
  deleteRequest
);

module.exports = router;