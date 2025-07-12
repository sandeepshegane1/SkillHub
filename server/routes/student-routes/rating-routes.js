const express = require("express");
const {
  addOrUpdateRating,
  getCourseRatings,
  getUserRatingForCourse
} = require("../../controllers/student-controller/rating-controller");

const router = express.Router();

router.post("/add", addOrUpdateRating);
router.get("/course/:courseId", getCourseRatings);
router.get("/user/:userId/:courseId", getUserRatingForCourse);

module.exports = router;
