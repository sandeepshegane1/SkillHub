const StudentCourses = require("../../models/StudentCourses");
const CourseProgress = require("../../models/CourseProgress");
const Course = require("../../models/Course");

const getCoursesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentBoughtCourses = await StudentCourses.findOne({
      userId: studentId,
    });

    if (!studentBoughtCourses || !studentBoughtCourses.courses || studentBoughtCourses.courses.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get all course IDs
    const courseIds = studentBoughtCourses.courses.map(course => course.courseId);

    // Fetch all course progress records for this student in one query
    const progressRecords = await CourseProgress.find({
      userId: studentId,
      courseId: { $in: courseIds }
    });

    // Create a map for quick lookup
    const progressMap = {};
    progressRecords.forEach(record => {
      progressMap[record.courseId] = record;
    });

    // Fetch all courses to get curriculum length
    const courseDetails = await Course.find({
      _id: { $in: courseIds }
    });

    // Create a map for quick lookup
    const courseDetailsMap = {};
    courseDetails.forEach(course => {
      courseDetailsMap[course._id.toString()] = course;
    });

    // Log course IDs for debugging
    console.log('Course IDs in StudentCourses:', studentBoughtCourses.courses.map(c => c.courseId));
    console.log('Course IDs in progressMap:', Object.keys(progressMap));
    console.log('Course IDs in courseDetailsMap:', Object.keys(courseDetailsMap));

    // Log course titles for debugging
    console.log('Course titles in StudentCourses:', studentBoughtCourses.courses.map(c => ({ id: c.courseId, title: c.title })));
    console.log('Course titles in courseDetailsMap:', Object.keys(courseDetailsMap).map(key => ({
      id: key,
      title: courseDetailsMap[key].title
    })));

    // Track if we need to update the StudentCourses record with new image URLs
    let needsStudentCoursesUpdate = false;
    const courseUpdates = [];

    // Enhance courses with progress information
    const enhancedCourses = studentBoughtCourses.courses.map(course => {
      // Ensure consistent ID format
      const courseId = course.courseId.toString().trim();

      // Try different lookup methods for progress
      let progress = progressMap[courseId];
      if (!progress) {
        // Try to find by iterating through keys
        const progressKey = Object.keys(progressMap).find(key =>
          key.toString().trim() === courseId);
        if (progressKey) progress = progressMap[progressKey];
      }

      // Try different lookup methods for course details
      let details = courseDetailsMap[courseId];
      if (!details) {
        // Try to find by iterating through keys
        const detailsKey = Object.keys(courseDetailsMap).find(key =>
          key.toString().trim() === courseId);
        if (detailsKey) details = courseDetailsMap[detailsKey];
      }

      // Check if the course image needs to be updated in StudentCourses
      if (details?.image && details.image !== course.courseImage) {
        needsStudentCoursesUpdate = true;
        courseUpdates.push({
          courseId: courseId,
          oldImage: course.courseImage,
          newImage: details.image
        });
      }

      // Calculate progress percentage and completed lectures
      let progressPercentage = 0;
      let completedLectures = 0;
      let totalLectures = details?.curriculum?.length || 0;

      if (progress && details) {
        completedLectures = progress.lecturesProgress.filter(lecture => lecture.viewed).length;
        progressPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
      }

      // Get the course title from either the StudentCourses record or the Course details
      const courseTitle = course.title || details?.title || "Untitled Course";

      // Always prioritize the Course model's image for the most up-to-date thumbnail
      // This ensures that when an instructor updates the course image, it's reflected in My Learning
      const courseImage = details?.image || course.courseImage || null;

      // Log image information for debugging
      console.log(`Course ${courseId} image info:`, {
        fromCourseDetails: details?.image,
        fromStudentCourses: course.courseImage,
        finalImage: courseImage,
        usingUpdatedImage: details?.image !== course.courseImage && details?.image !== null
      });

      return {
        ...course,
        courseId: courseId, // Ensure courseId is explicitly included and properly formatted
        title: courseTitle, // Ensure title is explicitly included
        courseImage: courseImage, // Ensure courseImage is explicitly included
        image: courseImage, // Add image field as fallback
        progress: progressPercentage,
        completedLectures: completedLectures,
        totalLectures: totalLectures,
        completed: progress?.completed || false
      };
    });

    // Update StudentCourses with the latest course images if needed
    if (needsStudentCoursesUpdate && courseUpdates.length > 0) {
      console.log('Updating StudentCourses with latest course images:', courseUpdates);

      try {
        // Update each course image in the StudentCourses record
        for (const update of courseUpdates) {
          const courseIndex = studentBoughtCourses.courses.findIndex(
            c => c.courseId.toString().trim() === update.courseId
          );

          if (courseIndex !== -1) {
            console.log(`Updating image for course ${update.courseId} from ${update.oldImage} to ${update.newImage}`);
            studentBoughtCourses.courses[courseIndex].courseImage = update.newImage;
          }
        }

        // Save the updated StudentCourses record
        await studentBoughtCourses.save();
        console.log('StudentCourses record updated with latest course images');
      } catch (updateError) {
        console.error('Error updating StudentCourses with latest images:', updateError);
        // Continue with the response even if the update fails
      }
    }

    res.status(200).json({
      success: true,
      data: enhancedCourses,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = { getCoursesByStudentId };
