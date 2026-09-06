const authService = require("../services/authService");
const sendResponse = require("../utils/sendResponse");
const asyncHandler = require("../middleware/asyncHandler");
exports.studentLogin = asyncHandler(async (req, res) => {
  const { token, student } = await authService.studentLogin(req.body);

  sendResponse(res, {
    message: "Login successful",
    data: {
      token,
      student: {
        student_id: student.student_id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        department: student.department,
        className: student.className,
        division: student.division,
        roll_no: student.roll_no,
        temp_address: student.temp_address,
      },
    },
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { token, admin } = await authService.adminLogin(req.body);

  sendResponse(res, {
    message: "Login successful",
    data: {
      token,
      admin: {
        admin_id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        address: admin.address,
      },
    },
  });
});