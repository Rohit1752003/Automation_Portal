const express = require("express");

const router = express.Router();
const  {  loginLimiter, authLimiter } = require("../middleware/limiter.js");

const {
  studentLogin,
  adminLogin,
} = require("../controllers/authController");

router.post("/login",loginLimiter , studentLogin);

router.post("/admin-login", authLimiter,  adminLogin);

module.exports = router;