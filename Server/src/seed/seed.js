require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("../config/database");

const Student = require("../models/Student");
const Admin = require("../models/Admin");

const { students } = require("../../data");
const { admins } = require("../../admindata");

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Student.deleteMany();
    await Admin.deleteMany();

    // Seed Students
    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 10);

      await Student.create({
        ...student,
        password: hashedPassword,
      });
    }

    // Seed Admins
    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await Admin.create({
        ...admin,
        password: hashedPassword,
      });
    }

    console.log("Database Seeded Successfully ✅");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();