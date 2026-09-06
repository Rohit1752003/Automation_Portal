const Groq = require("groq-sdk");
const { Agent } = require("undici");
const env = require("./environment");

// ============================================================
// FORCE IPV4 FOR GROQ REQUESTS
// ============================================================

const ipv4Dispatcher = new Agent({
  connect: {
    family: 4,
  },
});

// ============================================================
// GROQ CLIENT
// ============================================================

const groq = env.GROQ_API_KEY
  ? new Groq({
      apiKey: env.GROQ_API_KEY,

      fetchOptions: {
        dispatcher: ipv4Dispatcher,
      },
    })
  : null;

module.exports = groq;