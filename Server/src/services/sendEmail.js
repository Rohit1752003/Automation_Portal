const nodemailer = require("nodemailer");
const env = require("../config/environment");
const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html: message,
    });

    console.log("Email sent successfully ✅");
  } catch (error) {
    console.log("Email error:", error);
  }
};

module.exports = sendEmail;