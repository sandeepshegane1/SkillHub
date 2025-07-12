const Activity = require("../../models/Activity");
const Course = require("../../models/Course");
const CourseProgress = require("../../models/CourseProgress");

// Get recent activities for an instructor
const getInstructorActivities = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    // Get all courses by this instructor
    const instructorCourses = await Course.find({ instructorId });
    const courseIds = instructorCourses.map(course => course._id.toString());

    // Find activities related to these courses
    const activities = await Activity.find({
      courseId: { $in: courseIds }
    })
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructor activities"
    });
  }
};

// Mark activities as read
const markActivitiesAsRead = async (req, res) => {
  try {
    const { activityIds } = req.body;

    console.log('Marking activities as read:', activityIds);

    if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No activity IDs provided"
      });
    }

    const result = await Activity.updateMany(
      { _id: { $in: activityIds } },
      { $set: { read: true } }
    );

    console.log('Update result:', result);

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} activities marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.log('Error marking activities as read:', error);
    res.status(500).json({
      success: false,
      message: "Error marking activities as read"
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Get all courses by this instructor
    const instructorCourses = await Course.find({ instructorId });
    const courseIds = instructorCourses.map(course => course._id.toString());

    // Count unread activities
    const unreadCount = await Activity.countDocuments({
      courseId: { $in: courseIds },
      read: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count"
    });
  }
};

module.exports = {
  getInstructorActivities,
  markActivitiesAsRead,
  getUnreadCount
};
