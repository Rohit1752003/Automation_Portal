const jwt = require("jsonwebtoken");
const env = require("../config/environment");

const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

module.exports = generateToken;