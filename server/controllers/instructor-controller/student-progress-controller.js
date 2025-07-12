const CourseProgress = require("../../models/CourseProgress");
const Course = require("../../models/Course");

// Get student progress for a specific course
const getStudentProgress = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Get the course to know how many total lectures there are
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const totalLectures = course.curriculum.length;

    // Get the student's progress for this course
    const progress = await CourseProgress.findOne({
      userId: studentId,
      courseId: courseId,
    });

    if (!progress) {
      // If no progress found, return 0%
      return res.status(200).json({
        success: true,
        data: {
          progressPercentage: 0,
          completedLectures: 0,
          totalLectures: totalLectures,
          completed: false
        },
      });
    }

    // Calculate the percentage of completed lectures
    const completedLectures = progress.lecturesProgress.filter(
      (lecture) => lecture.viewed
    ).length;

    const progressPercentage = totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        progressPercentage,
        completedLectures,
        totalLectures,
        completed: progress.completed || false
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Get all students for a specific course with their progress
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get the course to know how many total lectures there are and get the student list
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const totalLectures = course.curriculum.length;
    const students = course.students || [];

    // Get progress for each student
    const studentsWithProgress = [];

    for (const student of students) {
      // Get the student's progress for this course
      const progress = await CourseProgress.findOne({
        userId: student.studentId,
        courseId: courseId,
      });

      let progressData = {
        progressPercentage: 0,
        completedLectures: 0,
        totalLectures: totalLectures,
        completed: false
      };

      if (progress) {
        // Calculate the percentage of completed lectures
        const completedLectures = progress.lecturesProgress.filter(
          (lecture) => lecture.viewed
        ).length;

        const progressPercentage = totalLectures > 0
          ? Math.round((completedLectures / totalLectures) * 100)
          : 0;

        progressData = {
          progressPercentage,
          completedLectures,
          totalLectures,
          completed: progress.completed || false
        };
      }

      studentsWithProgress.push({
        ...student.toObject(),
        progress: progressData
      });
    }

    res.status(200).json({
      success: true,
      data: {
        courseTitle: course.title,
        courseImage: course.image,
        pricing: course.pricing,
        totalStudents: students.length,
        students: studentsWithProgress
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getStudentProgress,
  getCourseStudents,
};
