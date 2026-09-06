const adminService = require("../services/adminService");
const asyncHandler = require("../middleware/asyncHandler");
const sendResponse = require("../utils/sendResponse");

// Get All Students
exports.getStudents = asyncHandler(async (req, res) => {
  const students = await adminService.getStudents();

  sendResponse(res, {
    statusCode: 200,
    message: "Students fetched successfully",
    data: students,
  });
});

// Get Admin Profile
exports.getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await adminService.getAdminProfile(
    req.params.id
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Admin profile fetched successfully",
    data: admin,
  });
  
});
exports.getDashboardStats = asyncHandler(
  async (req, res) => {
    const stats =
      await adminService.getDashboardStats();

    sendResponse(res, {
      statusCode: 200,
      message:
        "Dashboard statistics fetched successfully",
      data: stats,
    });
  }
);