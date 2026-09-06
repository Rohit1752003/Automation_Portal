const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "Bonafide",
        "Leaving Certificate",
        "Exam Form",
        "Internship Letter",
        "Aadhar Card Submission",
        "NOC",
        "Other",
      ],
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    formData: {
      type: Object,
      default: {},
    },

    uploadedFile: {
      type: String,
      default: "",
    },

    generatedPdf: {
      type: String,
      default: "",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvedDate: {
      type: String,
      default: null,
    },
    certificateNumber: {
  type: String,
  default: "",
},

verificationId: {
  type: String,
  unique: true,
  sparse: true,
  index: true,
},
aiReview: {
  confidence: {
    type: Number,
    default: 0,
  },

  recommendation: {
    type: String,
    enum: [
      "APPROVE",
      "REVIEW",
      "REJECT",
    ],
    default: "REVIEW",
  },

  reason: {
    type: String,
    default: "",
  },

  reviewedAt: {
    type: Date,
    default: null,
  },
},
hiddenForAdmin: {
  type: Boolean,
  default: false,
},

hiddenForStudent: {
  type: Boolean,
  default: false,
},
    
  },
  
  {
    timestamps: true,
  },
  

  


);

module.exports = mongoose.model("Request", requestSchema);