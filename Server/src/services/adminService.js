const AdminRepository = require("../repositories/AdminRepository");
const NotFoundError = require("../errors/NotFoundError");

const getStudents = async () => {
  return await AdminRepository.findAllStudents();
};

const getAdminProfile = async (adminId) => {
  const admin = await AdminRepository.findAdminByAdminId(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  return admin;
};
const RequestRepository = require(
  "../repositories/RequestRepository"
);

const getDashboardStats = async () => {
  return await RequestRepository.getStats();
};
module.exports = {
  getStudents,
  getAdminProfile,
  getDashboardStats,
};