const RequestRepository = require("../repositories/RequestRepository");
const asyncHandler = require("../middleware/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const verifyDocument = asyncHandler(async (req, res) => {
  const { verificationId } = req.params;

  const request =
    await RequestRepository.findByVerificationId(
      verificationId
    );

  if (!request || request.status !== "Approved") {
    return sendResponse(res, {
      statusCode: 404,
      message: "Document is invalid, unapproved, or fraudulent.",
      data: {
        valid: false,
      },
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    message: "Document verified successfully.",
    data: {
      valid: true,
      certificateNumber: request.certificateNumber,
      documentType: request.type,
      issuedTo: request.student?.name || "N/A",
      department: request.student?.department || "N/A",
      approvedDate: request.approvedDate,
      downloadUrl: request.generatedPdf,
    },
  });
});

module.exports = {
  verifyDocument,
};