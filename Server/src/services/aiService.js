const Groq = require("groq-sdk");
const env = require("../config/environment");

// ============================================================
// GROQ CLIENT
// ============================================================

const groq = env.GROQ_API_KEY
  ? new Groq({
      apiKey: env.GROQ_API_KEY,
      timeout: 120000,
    })
  : null;

// ============================================================
// CERTIFICATE CONTENT GENERATOR
// ============================================================

const generateCertificateContent = async (
  request
) => {
  const student =
    request.student || {};

  const type =
    request.type;

  // ==========================================================
  // FALLBACK
  // ==========================================================

  const fallbackText = `
This is to certify that ${
    student.name ||
    "the student"
  } (ID: ${
    student.student_id ||
    "N/A"
  }), pursuing studies in the ${
    student.department ||
    "Engineering"
  } department, is a bonafide student of Smt. Kashibai Navale College of Engineering. This document is issued upon request for official purposes.
  `.trim();

  if (!groq) {
    return fallbackText;
  }

  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
Write a formal and concise body paragraph for an official college document.

Document Type:
${type}

Student Name:
${student.name || "N/A"}

Student ID:
${student.student_id || "N/A"}

Department:
${student.department || "N/A"}

Rules:
- Write only the body paragraph.
- No greeting.
- No signature.
- No title.
- No subject line.
- Do not invent student information.
- Keep the language formal and suitable for an official college document.
`;

  // ==========================================================
  // AI GENERATION
  // ==========================================================

  try {
    const response =
      await groq.chat.completions.create({
        model:
          "openai/gpt-oss-120b",

        temperature: 0.2,

        max_tokens: 300,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    return (
      response
        ?.choices?.[0]
        ?.message
        ?.content
        ?.trim() ||
      fallbackText
    );

  } catch (error) {
    console.error(
      "Groq AI Generation Warning:",
      error.message
    );

    return fallbackText;
  }
};

module.exports =
  generateCertificateContent;