const requestService = require("../services/requestService");
const asyncHandler = require("../middleware/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const BadRequestError = require("../errors/BadRequestError");

const uploadToCloudinary = require("../utils/cloudinaryUpload");

const {
  createRequestSchema,
} = require("../schemas/requestSchema");

// ======================================================
// CREATE REQUEST
// ======================================================

exports.createRequest = asyncHandler(async (req, res) => {
  // =========================
  // PARSE FORM DATA
  // =========================

  let formData = req.body.formData;

  if (typeof formData === "string") {
    try {
      formData = JSON.parse(formData);
    } catch (error) {
      throw new BadRequestError(
        "Invalid formData. Expected valid JSON."
      );
    }
  }

  // =========================
  // UPLOAD FILE
  // =========================

  let uploadedFile = "";

  if (req.file) {
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    uploadedFile =
      result.secure_url ||
      result.url ||
      "";

    if (!uploadedFile) {
      throw new BadRequestError(
        "File uploaded but Cloudinary URL was not returned"
      );
    }
  }

  // =========================
  // BUILD REQUEST BODY
  // =========================

  const requestBody = {
    type: req.body.type,
    formData,
    uploadedFile,
  };

  // =========================
  // VALIDATE
  // =========================

  const validatedData =
    createRequestSchema.parse(requestBody);

  // =========================
  // CREATE REQUEST
  // =========================

  const request =
    await requestService.createRequest({
      user: req.user,
      body: validatedData,
    });

  // =========================
  // RESPONSE
  // =========================

  sendResponse(res, {
    statusCode: 201,
    message: "Request Created Successfully",
    data: request,
  });
});

// ======================================================
// GET ALL REQUESTS - ADMIN
// ======================================================

exports.getAllRequests = asyncHandler(async (req, res) => {
  const requests =
    await requestService.getAllRequests(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: "Requests fetched successfully",
    data: requests,
  });
});

// ======================================================
// GET STUDENT REQUESTS
// ======================================================

exports.getStudentRequests = asyncHandler(
  async (req, res) => {
    const requests =
      await requestService.getStudentRequests(req.user);

    sendResponse(res, {
      statusCode: 200,
      message: "Student requests fetched successfully",
      data: requests,
    });
  }
);

// ======================================================
// GET REQUEST BY ID
// ======================================================

exports.getRequestById = asyncHandler(
  async (req, res) => {
    const request =
      await requestService.getRequestById(
        req.params.id,
        req.user
      );

    sendResponse(res, {
      statusCode: 200,
      message: "Request details fetched successfully",
      data: request,
    });
  }
);

// ======================================================
// RUN AI REVIEW
// ======================================================

exports.runAIReview = asyncHandler(
  async (req, res) => {
    const request =
      await requestService.runAIReview(
        req.params.id,
        req.user
      );

    sendResponse(res, {
      statusCode: 200,
      message: "AI review completed successfully",
      data: request,
    });
  }
);

// ======================================================
// APPROVE REQUEST
// ======================================================

exports.approveRequest = asyncHandler(
  async (req, res) => {
    const request =
      await requestService.approveRequest(
        req.params.id,
        req.user
      );

    sendResponse(res, {
      statusCode: 200,
      message: "Request Approved Successfully",
      data: request,
    });
  }
);

// ======================================================
// REJECT REQUEST
// ======================================================

exports.rejectRequest = asyncHandler(
  async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return sendResponse(res, {
        statusCode: 400,
        message: "Rejection reason is required",
      });
    }

    const request =
      await requestService.rejectRequest(
        req.params.id,
        reason.trim(),
        req.user
      );

    sendResponse(res, {
      statusCode: 200,
      message: "Request Rejected Successfully",
      data: request,
    });
  }
);

// ======================================================
// DELETE REQUEST - SOFT DELETE
// ======================================================

exports.deleteRequest = asyncHandler(
  async (req, res) => {
    await requestService.deleteRequest(
      req.params.id,
      req.user
    );

    sendResponse(res, {
      statusCode: 200,
      message: "Request removed successfully",
    });
  }
);

// ======================================================
// RESUBMIT REQUEST
// ======================================================

exports.resubmitRequest = asyncHandler(
  async (req, res) => {
    // =========================
    // CHECK FILE
    // =========================

    if (!req.file) {
      return sendResponse(res, {
        statusCode: 400,
        message: "Corrected document is required",
      });
    }

    // =========================
    // UPLOAD TO CLOUDINARY
    // =========================

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const uploadedFile =
      result.secure_url ||
      result.url ||
      "";

    if (!uploadedFile) {
      throw new BadRequestError(
        "File uploaded but Cloudinary URL was not returned"
      );
    }

    // =========================
    // RESUBMIT REQUEST
    // =========================

    const request =
      await requestService.resubmitRequest(
        req.params.id,
        req.user,
        uploadedFile
      );

    // =========================
    // RESPONSE
    // =========================

    sendResponse(res, {
      statusCode: 200,
      message: "Request resubmitted successfully",
      data: request,
    });
  }
);