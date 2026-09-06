const Request = require("../models/Request");

// =========================
// CREATE
// =========================

const create = async (data) => {
  return await Request.create(data);
};

// =========================
// FIND BY ID
// =========================

const findById = async (id) => {
  return await Request.findById(id).populate(
    "student",
    "student_id name email phone department className division roll_no temp_address"
  );
};

// =========================
// FIND ALL - ADMIN
// =========================

const findAll = async ({
  page = 1,
  limit = 10,
  status,
  type,
  search,
} = {}) => {
  const query = {
    hiddenForAdmin: { $ne: true },
  };

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by document type
  if (type) {
    query.type = type;
  }

  const mongoQuery = Request.find(query)
    .populate(
      "student",
      "student_id name email phone department className division roll_no temp_address"
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const requests = await mongoQuery;

  let filteredRequests = requests;

  // =========================
  // SEARCH
  // =========================

  if (search) {
    const searchText = search.toLowerCase();

    filteredRequests = requests.filter((request) => {
      const student = request.student;

      return (
        request.type
          ?.toLowerCase()
          .includes(searchText) ||
        student?.name
          ?.toLowerCase()
          .includes(searchText) ||
        student?.student_id
          ?.toLowerCase()
          .includes(searchText)
      );
    });
  }

  // =========================
  // TOTAL
  // =========================

  const total = await Request.countDocuments(query);

  return {
    requests: filteredRequests,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// =========================
// FIND NOT HIDDEN - ADMIN
// =========================

const findNotHiddenForAdmin = async () => {
  return await findAll();
};

// =========================
// FIND BY STUDENT
// =========================

const findByStudentId = async (studentObjectId) => {
  return await Request.find({
    student: studentObjectId,
    hiddenForStudent: { $ne: true },
  })
    .populate(
      "student",
      "student_id name email phone department"
    )
    .sort({ createdAt: -1 });
};

// =========================
// SAVE
// =========================

const save = async (request) => {
  return await request.save();
};

// =========================
// UPDATE BY ID
// =========================

const updateById = async (id, updateData) => {
  return await Request.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
    }
  );
};

// =========================
// FIND BY VERIFICATION ID
// =========================

const findByVerificationId = async (
  verificationId
) => {
  return await Request.findOne({
    verificationId,
  }).populate(
    "student",
    "student_id name email phone department className division roll_no temp_address"
  );
};

// =========================
// STATISTICS
// =========================

const getStats = async () => {
  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
  ] = await Promise.all([
    Request.countDocuments(),
    Request.countDocuments({
      status: "Pending",
    }),
    Request.countDocuments({
      status: "Approved",
    }),
    Request.countDocuments({
      status: "Rejected",
    }),
  ]);

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
  };
};

// =========================
// EXPORTS
// =========================

module.exports = {
  create,
  findById,
  findByVerificationId,
  findAll,
  findNotHiddenForAdmin,
  findByStudentId,
  save,
  updateById,
  getStats,
};