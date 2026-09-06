const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },

    action: {
  type: String,
  enum: [
    "CREATED",
    "APPROVED",
    "REJECTED",
    "RESUBMITTED",
    "DELETED",
    "AI_REVIEWED",
  ],
  required: true,
},

    performedBy: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      required: true,
    },

    oldStatus: String,

    newStatus: String,

    remarks: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);