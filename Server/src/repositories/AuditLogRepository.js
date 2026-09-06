const AuditLog = require("../models/AuditLog");

const create = async (data) => {
  return await AuditLog.create(data);
};

const findByRequestId = async (requestId) => {
  return await AuditLog.find({ requestId })
    .sort({ createdAt: -1 });
};


module.exports = {
  create,
  findByRequestId,
};