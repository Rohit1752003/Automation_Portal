const bcrypt = require("bcryptjs");

const generateToken = require("../utils/generateToken");
const AuthRepository = require("../repositories/AuthRepository");
const BadRequestError = require("../errors/BadRequestError");
const UnauthorizedError = require("../errors/UnauthorizedError");

const studentLogin = async ({ student_id, password }) => {
  student_id = student_id?.trim();
  password = password?.trim();

  if (!student_id || !password) {
    throw new BadRequestError("Student ID and password are required");
  }

  const student = await AuthRepository.findStudentById(student_id);

  if (!student) {
    throw new UnauthorizedError("Invalid student credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    student.password
  );

  if (!isPasswordCorrect) {
    throw new UnauthorizedError("Invalid student credentials");
  }

  const token = generateToken({
  id: student._id,
  student_id: student.student_id,
  role: "student",
});

  return {
    token,
    student,
  };
};

const adminLogin = async ({ admin_id, password }) => {
  admin_id = admin_id?.trim();
  password = password?.trim();

  if (!admin_id || !password) {
    throw new BadRequestError("Admin ID and password are required");
  }

const admin = await AuthRepository.findAdminById(admin_id);

  if (!admin) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    admin.password
  );

  if (!isPasswordCorrect) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = generateToken({
  id: admin._id,
  admin_id: admin.admin_id,
  role: "admin",
});

  return {
    token,
    admin,
  };
};

module.exports = {
  studentLogin,
  adminLogin,
};