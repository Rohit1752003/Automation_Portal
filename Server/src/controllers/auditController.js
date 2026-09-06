const asyncHandler = require("../middleware/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const auditService = require("../services/auditService");

exports.getRequestHistory = asyncHandler(
  async (req, res) => {
    const logs =
      await auditService.getRequestHistory(
        req.params.requestId
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Request history fetched successfully",
      data: logs,
    });
  }
);