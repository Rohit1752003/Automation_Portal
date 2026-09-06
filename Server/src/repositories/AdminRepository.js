const Student = require("../models/Student");
const Admin = require("../models/Admin");

const findAllStudents = async () => {
  return await Student.find().select("-password");
};

const findAdminByAdminId = async (adminId) => {
  return await Admin.findOne({
    admin_id: adminId,
  }).select("-password");
};

module.exports = {
  findAllStudents,
  findAdminByAdminId,
};