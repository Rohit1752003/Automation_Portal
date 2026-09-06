const auditService = require("./auditService");

const NotFoundError = require("../errors/NotFoundError");
const BadRequestError = require("../errors/BadRequestError");
const UnauthorizedError = require("../errors/UnauthorizedError");

const StudentRepository = require("../repositories/StudentRepository");
const RequestRepository = require("../repositories/RequestRepository");

const generatePdf = require("./pdfService");
const sendEmail = require("./sendEmail");

const crypto = require("crypto");

const {
  extractTextFromDocument,
} = require("./ocrService");

const {
  analyzeDocument,
} = require("./aiValidationService");


// ============================================================
// REQUEST TYPES THAT DO NOT REQUIRE UPLOADED DOCUMENT
// ============================================================

const DETAIL_ONLY_REQUESTS = [
  "Bonafide",
  "Leaving Certificate",
];


// ============================================================
// HELPER
// ============================================================

const isDetailOnlyRequest = (type) => {
  return DETAIL_ONLY_REQUESTS.includes(
    type
  );
};


// ============================================================
// BUILD STUDENT INFORMATION FOR AI
// ============================================================

const buildStudentDataForAI = (
  request
) => {
  const student =
    request.student || {};

  return {
    student_id:
      student.student_id || "",

    name:
      student.name || "",

    email:
      student.email || "",

    phone:
      student.phone || "",

    department:
      student.department || "",

    className:
      student.className || "",

    division:
      student.division || "",

    roll_no:
      student.roll_no || "",

    year:
      student.year || "",

    course:
      student.course || "",

    admissionYear:
      student.admissionYear || "",

    gender:
      student.gender || "",
  };
};


// ============================================================
// BUILD DETAIL-BASED AI INPUT
//
// Used for:
// - Bonafide
// - Leaving Certificate
//
// No OCR is performed.
// ============================================================

const buildDetailBasedAIInput = (
  request
) => {
  const studentData =
    buildStudentDataForAI(
      request
    );

  const formData =
    request.formData || {};

  return `
REQUEST TYPE:
${request.type || "Unknown"}

REGISTERED STUDENT INFORMATION:
${JSON.stringify(
  studentData,
  null,
  2
)}

SUBMITTED REQUEST DETAILS:
${JSON.stringify(
  formData,
  null,
  2
)}

TASK:

Compare the submitted request details
against the registered student information.

Check for:

1. Student name mismatch
2. Student ID mismatch
3. Department mismatch
4. Course mismatch
5. Class/year mismatch
6. Roll number mismatch
7. Division mismatch
8. Email mismatch
9. Phone mismatch
10. Any other important inconsistency

If all important details are consistent,
the request can receive a high confidence score.

If there are minor differences,
recommend REVIEW.

If there are serious identity/details
mismatches, recommend REJECT.

Do not invent missing information.

If information is unavailable,
recommend REVIEW rather than assuming
that it is correct.
`;
};


// ============================================================
// CREATE REQUEST
// ============================================================

const createRequest = async ({
  user,
  body,
}) => {
  const {
    type,
    formData,
    uploadedFile,
  } = body;

  // ==========================================================
  // FIND AUTHENTICATED STUDENT
  // ==========================================================

  const student =
    await StudentRepository.findByStudentId(
      user.student_id
    );

  if (!student) {
    throw new NotFoundError(
      "Student not found"
    );
  }


  // ==========================================================
  // AI REVIEW IS NOT RUN DURING CREATION
  //
  // Admin manually triggers AI review.
  // ==========================================================

  const request =
    await RequestRepository.create({
      student:
        student._id,

      type,

      formData,

      uploadedFile:
        uploadedFile || "",

      status:
        "Pending",

      hiddenForAdmin:
        false,

      hiddenForStudent:
        false,
    });


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "CREATED",

    performedBy:
      user.student_id,

    role:
      "student",

    oldStatus:
      null,

    newStatus:
      "Pending",

    remarks:
      "New request created",
  });


  return request;
};


// ============================================================
// GET ALL REQUESTS - ADMIN
// ============================================================

const getAllRequests = async (
  query = {}
) => {
  const page =
    Number(query.page) || 1;

  const limit =
    Number(query.limit) || 10;

  return await RequestRepository.findAll({
    page,

    limit,

    status:
      query.status,

    type:
      query.type,

    search:
      query.search,
  });
};


// ============================================================
// GET STUDENT REQUESTS
// ============================================================

const getStudentRequests =
  async (user) => {

    const student =
      await StudentRepository.findByStudentId(
        user.student_id
      );

    if (!student) {
      throw new NotFoundError(
        "Student not found"
      );
    }

    return await RequestRepository.findByStudentId(
      student._id
    );
  };


// ============================================================
// GET REQUEST BY ID
// ============================================================

const getRequestById = async (
  requestId,
  user
) => {

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  // ==========================================================
  // STUDENT AUTHORIZATION
  // ==========================================================

  if (
    user.role ===
      "student" &&
    request.student.student_id !==
      user.student_id
  ) {
    throw new UnauthorizedError(
      "Unauthorized access to this request"
    );
  }


  return request;
};


// ============================================================
// RUN AI REVIEW
// ============================================================

const runAIReview = async (
  requestId,
  adminUser
) => {

  // ==========================================================
  // FIND REQUEST
  // ==========================================================

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  // ==========================================================
  // DETERMINE REVIEW METHOD
  // ==========================================================

  const detailOnly =
    isDetailOnlyRequest(
      request.type
    );


  // ==========================================================
  // DEFAULT AI RESULT
  // ==========================================================

  let aiReview = {
    confidence:
      0,

    recommendation:
      "REVIEW",

    reason:
      "AI analysis could not be completed.",

    reviewedAt:
      new Date(),
  };


  try {

    // ========================================================
    // PATH 1
    //
    // BONAFIDE / LEAVING CERTIFICATE
    //
    // NO DOCUMENT
    // NO OCR
    // ========================================================

    if (detailOnly) {

      const aiInput =
        buildDetailBasedAIInput(
          request
        );


      /*
       * We intentionally pass the structured
       * student + submitted form information
       * to the existing AI validation service.
       *
       * This means your existing
       * analyzeDocument() function can still
       * be reused without requiring a separate
       * AI endpoint.
       */

      aiReview =
        await analyzeDocument(
          aiInput,
          request.type
        );


      aiReview.reviewedAt =
        new Date();


      // ======================================================
      // SAFETY RULE
      //
      // Very low confidence should be manually
      // reviewed instead of blindly approved.
      // ======================================================

      if (
        Number(
          aiReview.confidence
        ) < 40
      ) {

        aiReview.recommendation =
          "REVIEW";
      }
    }


    // ========================================================
    // PATH 2
    //
    // DOCUMENT BASED REQUEST
    //
    // OCR -> AI
    // ========================================================

    else {

      if (
        !request.uploadedFile
      ) {

        throw new BadRequestError(
          "No document available for AI review"
        );
      }


      // ======================================================
      // OCR
      // ======================================================

      const extractedText =
        await extractTextFromDocument(
          request.uploadedFile
        );


      // ======================================================
      // AI ANALYSIS
      // ======================================================

      aiReview =
        await analyzeDocument(
          extractedText,
          request.type
        );


      aiReview.reviewedAt =
        new Date();


      // ======================================================
      // SAFETY RULE
      //
      // Low confidence should go to REVIEW.
      // Do not automatically reject because of
      // low AI confidence.
      // ======================================================

      if (
        Number(
          aiReview.confidence
        ) < 40
      ) {

        aiReview.recommendation =
          "REVIEW";
      }
    }


  } catch (error) {

    console.error(
      "AI Review Failed:",
      error.message
    );


    // ========================================================
    // AI FAILURE MUST NEVER AUTOMATICALLY
    // REJECT A STUDENT REQUEST
    // ========================================================

    aiReview = {
      confidence:
        0,

      recommendation:
        "REVIEW",

      reason:
        "AI analysis failed. Manual verification is required.",

      reviewedAt:
        new Date(),
    };
  }


  // ==========================================================
  // SAVE AI REVIEW
  // ==========================================================

  request.aiReview =
    aiReview;


  await RequestRepository.save(
    request
  );


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "AI_REVIEWED",

    performedBy:
      adminUser.admin_id,

    role:
      "admin",

    oldStatus:
      request.status,

    newStatus:
      request.status,

    remarks:
      `AI Review: ${aiReview.recommendation} (${aiReview.confidence}%)`,
  });


  return request;
};


// ============================================================
// APPROVE REQUEST
// ============================================================

const approveRequest = async (
  requestId,
  adminUser
) => {

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  if (!request.student) {
    throw new NotFoundError(
      "Student not found"
    );
  }


  if (
    request.status !==
    "Pending"
  ) {

    throw new BadRequestError(
      `Cannot approve ${request.status} request`
    );
  }


  const oldStatus =
    request.status;


  // ==========================================================
  // GENERATE CERTIFICATE NUMBER
  // ==========================================================

  request.certificateNumber =
    `SKNCOE-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;


  // ==========================================================
  // GENERATE VERIFICATION ID
  // ==========================================================

  request.verificationId =
    crypto
      .randomBytes(16)
      .toString("hex");


  // ==========================================================
  // APPROVAL DATE
  // ==========================================================

  request.approvedDate =
    new Date();


  // ==========================================================
  // GENERATE PDF
  // ==========================================================

  const pdfPath =
    await generatePdf(
      request
    );

  if (!pdfPath) {
    throw new BadRequestError(
      "Unable to generate PDF"
    );
  }


  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  request.status =
    "Approved";

  request.generatedPdf =
    pdfPath;

  request.rejectionReason =
    "";


  // ==========================================================
  // VISIBILITY
  // ==========================================================

  request.hiddenForAdmin =
    false;

  request.hiddenForStudent =
    false;


  // ==========================================================
  // SAVE
  // ==========================================================

  await RequestRepository.save(
    request
  );


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "APPROVED",

    performedBy:
      adminUser.admin_id,

    role:
      "admin",

    oldStatus,

    newStatus:
      request.status,

    remarks:
      "Request approved",
  });


  // ==========================================================
  // EMAIL STUDENT
  // ==========================================================

  await sendEmail(
    request.student.email,

    `${request.type} Approved ✅`,

    `
      Dear ${request.student.name},<br><br>

      Your <b>${request.type}</b> request has been approved.<br><br>

      You can now login to the portal and download your document.<br><br>

      Regards,<br>
      College Administration
    `
  );


  return request;
};


// ============================================================
// REJECT REQUEST
// ============================================================

const rejectRequest = async (
  requestId,
  reason,
  adminUser
) => {

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  if (
    request.status !==
    "Pending"
  ) {

    throw new BadRequestError(
      `Cannot reject ${request.status} request`
    );
  }


  const oldStatus =
    request.status;


  request.status =
    "Rejected";


  request.rejectionReason =
    reason;


  request.generatedPdf =
    "";


  request.approvedDate =
    null;


  // ==========================================================
  // REJECTED REQUEST REMAINS VISIBLE TO ADMIN
  // ==========================================================

  request.hiddenForAdmin =
    false;


  await RequestRepository.save(
    request
  );


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "REJECTED",

    performedBy:
      adminUser.admin_id,

    role:
      "admin",

    oldStatus,

    newStatus:
      "Rejected",

    remarks:
      reason,
  });


  // ==========================================================
  // EMAIL STUDENT
  // ==========================================================

  if (
    request.student &&
    request.student.email
  ) {

    await sendEmail(
      request.student.email,

      `${request.type} Rejected ❌`,

      `
        Dear ${request.student.name},<br><br>

        Your <b>${request.type}</b> request has been rejected.<br><br>

        <b>Reason:</b><br>
        ${reason}<br><br>

        Please correct the document and resubmit it through the portal.<br><br>

        Regards,<br>
        College Administration
      `
    );
  }


  return request;
};


// ============================================================
// DELETE REQUEST - SOFT DELETE
// ============================================================

const deleteRequest = async (
  requestId,
  user
) => {

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  // ==========================================================
  // ADMIN DELETE
  // ==========================================================

  if (
    user.role ===
    "admin"
  ) {

    request.hiddenForAdmin =
      true;
  }


  // ==========================================================
  // STUDENT DELETE
  // ==========================================================

  else if (
    user.role ===
    "student"
  ) {

    if (
      !request.student ||
      request.student.student_id !==
        user.student_id
    ) {

      throw new UnauthorizedError(
        "Unauthorized action"
      );
    }


    request.hiddenForStudent =
      true;
  }


  // ==========================================================
  // INVALID ROLE
  // ==========================================================

  else {

    throw new UnauthorizedError(
      "Unauthorized action"
    );
  }


  const actor =
    user.role ===
    "admin"
      ? user.admin_id
      : user.student_id;


  // ==========================================================
  // SAVE SOFT DELETE
  // ==========================================================

  await RequestRepository.save(
    request
  );


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "DELETED",

    performedBy:
      actor,

    role:
      user.role,

    oldStatus:
      request.status,

    newStatus:
      request.status,

    remarks:
      "Soft deleted",
  });


  return request;
};


// ============================================================
// RESUBMIT REQUEST
// ============================================================

const resubmitRequest = async (
  requestId,
  user,
  uploadedFile
) => {

  const request =
    await RequestRepository.findById(
      requestId
    );

  if (!request) {
    throw new NotFoundError(
      "Request not found"
    );
  }


  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

  if (
    user.role ===
      "student" &&
    (
      !request.student ||
      request.student.student_id !==
        user.student_id
    )
  ) {

    throw new UnauthorizedError(
      "Unauthorized action"
    );
  }


  // ==========================================================
  // ONLY REJECTED REQUESTS
  // ==========================================================

  if (
    request.status !==
    "Rejected"
  ) {

    throw new BadRequestError(
      "Only rejected requests can be resubmitted"
    );
  }


  // ==========================================================
  // DETERMINE REQUEST TYPE
  // ==========================================================

  const detailOnly =
    isDetailOnlyRequest(
      request.type
    );


  // ==========================================================
  // FILE REQUIRED ONLY FOR
  // DOCUMENT-BASED REQUESTS
  // ==========================================================

  if (
    !detailOnly &&
    !uploadedFile
  ) {

    throw new BadRequestError(
      "Corrected document is required"
    );
  }


  const oldStatus =
    request.status;


  // ==========================================================
  // DEFAULT AI RESULT
  // ==========================================================

  let aiReview = {
    confidence:
      0,

    recommendation:
      "REVIEW",

    reason:
      "AI analysis could not be completed.",

    reviewedAt:
      new Date(),
  };


  try {

    // ========================================================
    // BONAFIDE / LC
    //
    // No OCR
    // ========================================================

    if (detailOnly) {

      const aiInput =
        buildDetailBasedAIInput(
          request
        );


      aiReview =
        await analyzeDocument(
          aiInput,
          request.type
        );


      aiReview.reviewedAt =
        new Date();


      if (
        Number(
          aiReview.confidence
        ) < 40
      ) {

        aiReview.recommendation =
          "REVIEW";
      }
    }


    // ========================================================
    // DOCUMENT REQUEST
    //
    // OCR -> AI
    // ========================================================

    else {

      const extractedText =
        await extractTextFromDocument(
          uploadedFile
        );


      aiReview =
        await analyzeDocument(
          extractedText,
          request.type
        );


      aiReview.reviewedAt =
        new Date();


      if (
        Number(
          aiReview.confidence
        ) < 40
      ) {

        aiReview.recommendation =
          "REVIEW";
      }
    }


  } catch (error) {

    console.error(
      "AI Validation Failed During Resubmission:",
      error.message
    );


    aiReview = {
      confidence:
        0,

      recommendation:
        "REVIEW",

      reason:
        "AI analysis failed. Manual verification is required.",

      reviewedAt:
        new Date(),
    };
  }


  // ==========================================================
  // UPDATE FILE
  //
  // Only replace uploadedFile when a new file exists.
  // This is important for Bonafide / LC.
  // ==========================================================

  if (
    uploadedFile
  ) {

    request.uploadedFile =
      uploadedFile;
  }


  // ==========================================================
  // RESET REQUEST
  // ==========================================================

  request.status =
    "Pending";


  request.rejectionReason =
    "";


  request.hiddenForAdmin =
    false;


  request.hiddenForStudent =
    false;


  request.approvedDate =
    null;


  request.generatedPdf =
    "";


  // ==========================================================
  // REPLACE PREVIOUS AI REVIEW
  // ==========================================================

  request.aiReview =
    aiReview;


  // ==========================================================
  // SAVE
  // ==========================================================

  await RequestRepository.save(
    request
  );


  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  await auditService.logAction({
    requestId:
      request._id,

    action:
      "RESUBMITTED",

    performedBy:
      user.student_id,

    role:
      "student",

    oldStatus,

    newStatus:
      "Pending",

    remarks:
      detailOnly
        ? "Request resubmitted and AI validation re-run using student/request details"
        : "Request resubmitted and AI validation re-run using uploaded document",
  });


  return request;
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createRequest,

  getAllRequests,

  getStudentRequests,

  getRequestById,

  runAIReview,

  approveRequest,

  rejectRequest,

  deleteRequest,

  resubmitRequest,
};