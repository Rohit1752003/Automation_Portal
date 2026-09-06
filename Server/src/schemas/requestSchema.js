const { z } = require("zod");

// ============================================================
// CREATE REQUEST SCHEMA
// ============================================================

const createRequestSchema = z.object({
  // ==========================================================
  // REQUEST TYPE
  // ==========================================================

  type: z.enum([
    "Bonafide",
    "Leaving Certificate",
    "Exam Form",
    "Internship Letter",
    "Aadhar Card Submission",
    "NOC",
    "Other",
  ]),

  // ==========================================================
  // FORM DATA
  // ==========================================================

  formData: z
    .record(z.any())
    .default({}),

  // ==========================================================
  // UPLOADED FILE
  // ==========================================================

  uploadedFile: z
    .string()
    .nullable()
    .optional()
    .default(""),
});

module.exports = {
  createRequestSchema,
};