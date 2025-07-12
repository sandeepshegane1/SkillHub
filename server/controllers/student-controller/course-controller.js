const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

const getAllStudentViewCourses = async (req, res) => {
  try {
    const {
      category = [],
      level = [],
      primaryLanguage = [],
      sortBy = "price-lowtohigh",
    } = req.query;

    console.log(req.query, "req.query");

    let filters = {};
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }
    if (level.length) {
      filters.level = { $in: level.split(",") };
    }
    if (primaryLanguage.length) {
      filters.primaryLanguage = { $in: primaryLanguage.split(",") };
    }

    let sortParam = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sortParam.pricing = 1;

        break;
      case "price-hightolow":
        sortParam.pricing = -1;

        break;
      case "title-atoz":
        sortParam.title = 1;

        break;
      case "title-ztoa":
        sortParam.title = -1;

        break;

      default:
        sortParam.pricing = 1;
        break;
    }

    // Only show published courses to students
    const coursesList = await Course.find({ ...filters, isPublished: true }).sort(sortParam);

    // Always recalculate total duration for all courses
    for (const course of coursesList) {
      if (course.curriculum && course.curriculum.length > 0) {
        console.log(`Processing course: ${course.title}, current duration: ${course.totalDuration}`);

        let totalDuration = 0;
        let hasDurations = false;

        // Log the first few lectures' durations for debugging
        course.curriculum.slice(0, 3).forEach((lecture, idx) => {
          console.log(`  Lecture ${idx + 1} (${lecture.title}): duration = ${lecture.duration || 'not set'}`);
        });

        // Sum up all lecture durations
        course.curriculum.forEach(lecture => {
          if (lecture.duration && !isNaN(lecture.duration)) {
            totalDuration += Number(lecture.duration);
            hasDurations = true;
          }
        });

        console.log(`Calculated duration for ${course.title}: ${totalDuration} seconds, hasDurations: ${hasDurations}`);

        // Only update if the total duration has changed
        if (course.totalDuration !== totalDuration) {
          course.totalDuration = totalDuration;
          await course.save();
          console.log(`Updated course ${course.title} with new duration: ${totalDuration}`);
        } else {
          console.log(`No duration update needed for ${course.title}, current duration: ${course.totalDuration}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: coursesList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getStudentViewCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "No course details found",
        data: null,
      });
    }

    // Log the current state of durations
    console.log('Course details before calculation:', {
      id: courseDetails._id,
      title: courseDetails.title,
      totalDuration: courseDetails.totalDuration,
      curriculumCount: courseDetails.curriculum ? courseDetails.curriculum.length : 0
    });

    if (courseDetails.curriculum && courseDetails.curriculum.length > 0) {
      // Log the first few lectures' durations
      courseDetails.curriculum.slice(0, 3).forEach((lecture, index) => {
        console.log(`Lecture ${index + 1} duration:`, lecture.duration);
      });
    }

    // Always recalculate total duration to ensure it's accurate
    if (courseDetails.curriculum && courseDetails.curriculum.length > 0) {
      let totalDuration = 0;
      let hasDurations = false;

      // Log all lecture durations for debugging
      courseDetails.curriculum.forEach((lecture, idx) => {
        console.log(`  Lecture ${idx + 1} (${lecture.title}): duration = ${lecture.duration || 'not set'}`);
      });

      // Sum up all lecture durations
      courseDetails.curriculum.forEach(lecture => {
        if (lecture.duration && !isNaN(lecture.duration)) {
          totalDuration += Number(lecture.duration);
          hasDurations = true;
        }
      });

      console.log('Calculated total duration:', totalDuration, 'seconds, hasDurations:', hasDurations);

      // Only update if the total duration has changed
      if (courseDetails.totalDuration !== totalDuration) {
        courseDetails.totalDuration = totalDuration;
        await courseDetails.save();
        console.log('Updated course with new total duration:', totalDuration);
      } else {
        console.log('No duration update needed, current duration:', courseDetails.totalDuration);
      }
    }

    res.status(200).json({
      success: true,
      data: courseDetails,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const checkCoursePurchaseInfo = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
    });

    if (!studentCourses || !studentCourses.courses || studentCourses.courses.length === 0) {
      console.log('No courses found for student:', studentId);
      return res.status(200).json({
        success: true,
        data: false,
      });
    }

    // Log all course IDs for debugging
    console.log('All course IDs:', studentCourses.courses.map(c => c.courseId));
    console.log('Looking for courseId:', id);

    // Try different comparison methods for more robust matching
    let ifStudentAlreadyBoughtCurrentCourse = false;

    for (const course of studentCourses.courses) {
      // Direct comparison
      const directMatch = course.courseId === id;

      // String comparison
      const stringMatch = course.courseId.toString() === id.toString();

      // Trim comparison
      const trimMatch = course.courseId.toString().trim() === id.toString().trim();

      console.log(`Course ID: ${course.courseId}, Title: ${course.title}, Direct: ${directMatch}, String: ${stringMatch}, Trim: ${trimMatch}`);

      if (directMatch || stringMatch || trimMatch) {
        ifStudentAlreadyBoughtCurrentCourse = true;
        break;
      }
    }

    console.log('Purchase check result:', {
      studentId,
      courseId: id,
      hasPurchased: ifStudentAlreadyBoughtCurrentCourse
    });
    res.status(200).json({
      success: true,
      data: ifStudentAlreadyBoughtCurrentCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  getAllStudentViewCourses,
  getStudentViewCourseDetails,
  checkCoursePurchaseInfo,
};
