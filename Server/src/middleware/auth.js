const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/sendResponse")
const env = require("../config/environment");


const verifyToken = (req, res, next) => {
  let token;

  // 1. Extract Bearer token from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendResponse(res, {
      statusCode: 401,
      message: "Access denied. No token provided.",
    });
  }

  try {
    // 2. Verify token with JWT Secret
   const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // Contains id, role/isAdmin, email, etc.
    next();
  } catch (error) {
    return sendResponse(res, {
      statusCode: 401,
      message: "Invalid or expired authorization token.",
    });
  }
};

// Admin Protection Guard
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin === true)) {
    return next();
  }

  return sendResponse(res, {
    statusCode: 403,
    message: "Access forbidden. Admin rights required.",
  });
};

// Student Protection Guard
const isStudent = (req, res, next) => {
 if (
  req.user &&
  (req.user.role === "student" || req.user.isAdmin === false)
) {
    return next();
  }

  return sendResponse(res, {
    statusCode: 403,
    message: "Access forbidden. Student rights required.",
  });
};

module.exports = {
  verifyToken,
  isAdmin,
  isStudent,
};