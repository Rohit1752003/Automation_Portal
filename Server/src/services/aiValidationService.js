const groq = require("../config/groq");

// ============================================================
// ANALYZE DOCUMENT
// ============================================================

const analyzeDocument = async (
  extractedText,
  requestType
) => {

  // ==========================================================
  // VALIDATE OCR TEXT
  // ==========================================================

  if (
    !extractedText ||
    !extractedText.trim()
  ) {
    return {
      confidence: 0,
      recommendation: "REVIEW",
      reason:
        "No readable text could be extracted from the uploaded document.",
    };
  }

  // ==========================================================
  // CHECK AI AVAILABILITY
  // ==========================================================

  if (!groq) {
    return {
      confidence: 0,
      recommendation: "REVIEW",
      reason:
        "AI validation is currently unavailable.",
    };
  }

  // ==========================================================
  // LIMIT OCR TEXT
  // ==========================================================

  // Prevent unnecessarily large prompts.
  const documentText =
    extractedText
      .trim()
      .slice(0, 12000);

  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
You are a college document verification assistant.

Review the uploaded document and determine whether it appears appropriate for the requested document type.

Requested Document Type:
${requestType}

Extracted Document Text:
${documentText}

Evaluate:

1. Whether the document is related to the requested document type.
2. Whether it contains meaningful readable information.
3. Whether there are obvious inconsistencies.
4. Whether manual verification is required.

IMPORTANT:

- You are NOT determining legal authenticity.
- You are only evaluating whether the uploaded document appears appropriate for the requested type.
- If the requested type and actual document type clearly do not match, recommend REJECT.
- If the document appears relevant but cannot be confidently verified, recommend REVIEW.
- APPROVE only when the document appears clearly relevant and sufficiently complete.

Provide a confidence score from 0 to 100 and a short factual reason (one sentence, under 200 characters).
`;

  // ==========================================================
  // CALL GROQ
  // ==========================================================

  try {

    console.log(
      "🤖 Sending document to Groq..."
    );

    const response =
      await groq.chat.completions.create({

        model:
          "openai/gpt-oss-120b",

        temperature: 0,

        // Reduce unnecessary reasoning so the model
        // has enough completion budget for the JSON.
        reasoning_effort: "low",

        // Increased from 512 — for gpt-oss models, reasoning
        // tokens count against this same budget. 512 was too
        // tight and caused "max completion tokens reached
        // before generating a valid document" failures.
        max_completion_tokens: 1500,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        // ======================================================
        // STRICT STRUCTURED JSON
        // ======================================================

        response_format: {
          type: "json_schema",

          json_schema: {
            name: "document_validation",

            strict: true,

            schema: {
              type: "object",

              additionalProperties: false,

              properties: {

                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },

                recommendation: {
                  type: "string",
                  enum: [
                    "APPROVE",
                    "REVIEW",
                    "REJECT",
                  ],
                },

                reason: {
                  type: "string",
                  // Keeps the model from writing a long
                  // explanation that eats the token budget.
                  maxLength: 200,
                },
              },

              required: [
                "confidence",
                "recommendation",
                "reason",
              ],
            },
          },
        },
      });

    // ========================================================
    // GET RESPONSE
    // ========================================================

    const content =
      response.choices?.[0]?.message?.content?.trim();

    console.log(
      "🤖 Groq response received."
    );

    if (!content) {

      console.error(
        "Groq returned no content.",
        {
          finishReason:
            response.choices?.[0]?.finish_reason,

          usage:
            response.usage,
        }
      );

      throw new Error(
        "Empty response received from Groq."
      );
    }

    console.log(
      "AI response:",
      content
    );

    // ========================================================
    // PARSE JSON
    // ========================================================

    let result;

    try {

      result = JSON.parse(content);

    } catch (error) {

      console.error(
        "Invalid JSON returned by Groq:",
        content
      );

      throw new Error(
        "AI returned invalid JSON."
      );
    }

    // ========================================================
    // VALIDATE CONFIDENCE
    // ========================================================

    let confidence =
      Number(result.confidence);

    if (
      Number.isNaN(confidence)
    ) {
      confidence = 0;
    }

    confidence = Math.min(
      100,
      Math.max(
        0,
        confidence
      )
    );

    // ========================================================
    // VALIDATE RECOMMENDATION
    // ========================================================

    const recommendation =
      [
        "APPROVE",
        "REVIEW",
        "REJECT",
      ].includes(
        result.recommendation
      )
        ? result.recommendation
        : "REVIEW";

    // ========================================================
    // VALIDATE REASON
    // ========================================================

    const reason =
      typeof result.reason ===
        "string" &&
      result.reason.trim()
        ? result.reason.trim()
        : "No reason provided by AI.";

    // ========================================================
    // FINAL RESULT
    // ========================================================

    return {
      confidence,
      recommendation,
      reason,
    };

  } catch (error) {

    // ========================================================
    // AI FAILURE
    // ========================================================

    // Surface Groq's failed_generation (partial output) when
    // available, so failures like "max completion tokens
    // reached" are actually debuggable instead of just showing
    // a generic message.
    const failedGeneration =
      error.error?.error?.failed_generation ||
      error.response?.data?.error?.failed_generation;

    console.error(
      "AI document analysis failed:",
      error.message
    );

    if (failedGeneration) {
      console.error(
        "Partial generation before failure:",
        failedGeneration
      );
    }

    return {
      confidence: 0,
      recommendation: "REVIEW",
      reason:
        "AI analysis could not be completed. Manual verification is required.",
    };
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  analyzeDocument,
};