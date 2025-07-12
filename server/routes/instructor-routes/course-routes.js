const express = require("express");
const {
  addNewCourse,
  getAllCourses,
  getCourseDetailsByID,
  updateCourseByID,
  updateCoursePublishStatus,
  updateCourseDiscountStatus,
  deleteCourse,
} = require("../../controllers/instructor-controller/course-controller");
const router = express.Router();

router.post("/add", addNewCourse);
router.get("/get", getAllCourses);
router.get("/get/details/:id", getCourseDetailsByID);
router.put("/update/:id", updateCourseByID);
router.put("/update-publish-status/:id", updateCoursePublishStatus);
router.put("/update-discount-status/:id", updateCourseDiscountStatus);
router.delete("/delete/:id", deleteCourse);

module.exports = router;
