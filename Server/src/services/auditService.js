const AuditLogRepository = require(
  "../repositories/AuditLogRepository"
);

const logAction = async ({
  requestId,
  action,
  performedBy,
  role,
  oldStatus,
  newStatus,
  remarks = "",
}) => {
  return await AuditLogRepository.create({
    requestId,
    action,
    performedBy,
    role,
    oldStatus,
    newStatus,
    remarks,
  });
};
const getRequestHistory = async (requestId) => {
  return await AuditLogRepository.findByRequestId(
    requestId
  );
};

module.exports = {
  logAction,
  getRequestHistory,
};