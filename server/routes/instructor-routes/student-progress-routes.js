const express = require("express");
const {
  getStudentProgress,
  getCourseStudents,
} = require("../../controllers/instructor-controller/student-progress-controller");

const router = express.Router();

router.get("/:courseId/:studentId", getStudentProgress);
router.get("/course-students/:courseId", getCourseStudents);

module.exports = router;
