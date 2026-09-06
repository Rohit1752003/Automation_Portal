const Student = require("../models/Student");
const Admin = require("../models/Admin");

const findStudentById = async (student_id) => {
  return await Student.findOne({ student_id });
};

const findAdminById = async (admin_id) => {
  return await Admin.findOne({ admin_id });
};

module.exports = {
  findStudentById,
  findAdminById,
};