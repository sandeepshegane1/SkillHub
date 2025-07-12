const express = require("express");
const {
  getInstructorActivities,
  markActivitiesAsRead,
  getUnreadCount
} = require("../../controllers/instructor-controller/activity-controller");

const router = express.Router();

router.get("/get/:instructorId", getInstructorActivities);
router.post("/mark-read", markActivitiesAsRead);
router.get("/unread-count/:instructorId", getUnreadCount);

module.exports = router;
