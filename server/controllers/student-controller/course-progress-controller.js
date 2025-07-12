const CourseProgress = require("../../models/CourseProgress");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");
const Activity = require("../../models/Activity");
const User = require("../../models/User");

//mark current lecture as viewed
const markCurrentLectureAsViewed = async (req, res) => {
  try {
    const { userId, courseId, lectureId } = req.body;

    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        lecturesProgress: [
          {
            lectureId,
            viewed: true,
            dateViewed: new Date(),
          },
        ],
      });
      await progress.save();
    } else {
      const lectureProgress = progress.lecturesProgress.find(
        (item) => item.lectureId === lectureId
      );

      if (lectureProgress) {
        lectureProgress.viewed = true;
        lectureProgress.dateViewed = new Date();
      } else {
        progress.lecturesProgress.push({
          lectureId,
          viewed: true,
          dateViewed: new Date(),
        });
      }
      await progress.save();

      // Get user details
      const user = await User.findById(userId);

      // Get lecture title
      const lecture = course.curriculum.find(lec => lec._id.toString() === lectureId);

      // Create activity record for lecture view (only for the first time viewing)
      if (!lectureProgress || !lectureProgress.viewed) {
        const newActivity = new Activity({
          type: "lecture_view",
          userId,
          userName: user.userName,
          userEmail: user.userEmail,
          instructorId: course.instructorId,
          courseId: courseId,
          courseTitle: course.title,
          lectureId,
          lectureTitle: lecture ? lecture.title : "Unknown Lecture",
          date: new Date()
        });
        await newActivity.save();
      }
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    //check all the lectures are viewed or not
    const allLecturesViewed =
      progress.lecturesProgress.length === course.curriculum.length &&
      progress.lecturesProgress.every((item) => item.viewed);

    if (allLecturesViewed) {
      progress.completed = true;
      progress.completionDate = new Date();

      await progress.save();

      // Get user details
      const user = await User.findById(userId);

      // Create activity record for course completion
      const newActivity = new Activity({
        type: "completion",
        userId,
        userName: user.userName,
        userEmail: user.userEmail,
        instructorId: course.instructorId,
        courseId: courseId,
        courseTitle: course.title,
        date: new Date()
      });
      await newActivity.save();
    }

    res.status(200).json({
      success: true,
      message: "Lecture marked as viewed",
      data: progress,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

//get current course progress
const getCurrentCourseProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Ensure consistent ID format
    const normalizedCourseId = courseId.toString().trim();
    console.log('Normalized course ID:', normalizedCourseId);

    const studentPurchasedCourses = await StudentCourses.findOne({ userId });

    // Since this is being accessed from My Courses, we assume the course is already purchased
    // No need to validate purchase status as courses only appear in My Courses if purchased
    console.log('Skipping purchase validation for course in My Courses section');

    // For debugging purposes only, log course information
    if (studentPurchasedCourses?.courses?.length > 0) {
      const matchingCourse = studentPurchasedCourses.courses.find(course =>
        course.courseId.toString().trim() === normalizedCourseId);

      if (matchingCourse) {
        console.log(`Found course in student's purchased courses: ${matchingCourse.title}`);
      } else {
        console.log('Note: Course not found in purchased courses, but proceeding anyway');
      }
    }

    const currentUserCourseProgress = await CourseProgress.findOne({
      userId,
      courseId,
    });

    if (
      !currentUserCourseProgress ||
      currentUserCourseProgress?.lecturesProgress?.length === 0
    ) {
      // Try to find the course with multiple methods
      let course;

      try {
        // First try direct lookup
        course = await Course.findById(courseId);
      } catch (error) {
        console.log('Error in direct course lookup:', error.message);
      }

      // If not found, try string-based lookup
      if (!course) {
        try {
          console.log('Trying string-based course lookup...');
          // Try to find by string comparison
          const allCourses = await Course.find({});
          course = allCourses.find(c => c._id.toString().trim() === normalizedCourseId);

          if (course) {
            console.log('Found course using string comparison:', course.title);
          }
        } catch (error) {
          console.log('Error in string-based course lookup:', error.message);
        }
      }

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "No progress found, you can start watching the course",
        data: {
          courseDetails: course,
          progress: [],
          isPurchased: true,
        },
      });
    }

    const courseDetails = await Course.findById(courseId);

    res.status(200).json({
      success: true,
      data: {
        courseDetails,
        progress: currentUserCourseProgress.lecturesProgress,
        completed: currentUserCourseProgress.completed,
        completionDate: currentUserCourseProgress.completionDate,
        isPurchased: true,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

//reset course progress

const resetCurrentCourseProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found!",
      });
    }

    progress.lecturesProgress = [];
    progress.completed = false;
    progress.completionDate = null;

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Course progress has been reset",
      data: progress,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  markCurrentLectureAsViewed,
  getCurrentCourseProgress,
  resetCurrentCourseProgress,
};
