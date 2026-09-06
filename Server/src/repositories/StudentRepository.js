const Student = require("../models/Student");

const findByStudentId = async (studentId) => {
    return await Student.findOne({
        student_id: studentId,
    });
};

module.exports = {
    findByStudentId,
};