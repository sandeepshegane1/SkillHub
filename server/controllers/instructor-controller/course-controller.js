const Course = require("../../models/Course");

const addNewCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Ensure total duration is calculated correctly
    if (courseData.curriculum && courseData.curriculum.length > 0) {
      let totalDuration = 0;

      // Log lecture durations for debugging
      console.log('Course creation - lecture durations:');
      courseData.curriculum.forEach((lecture, idx) => {
        console.log(`  Lecture ${idx + 1} (${lecture.title}): duration = ${lecture.duration || 'not set'}`);
        if (lecture.duration && !isNaN(lecture.duration)) {
          totalDuration += Number(lecture.duration);
        }
      });

      // Set the total duration
      courseData.totalDuration = totalDuration;
      console.log(`Setting total duration for new course: ${totalDuration} seconds`);
    }

    const newlyCreatedCourse = new Course(courseData);
    const saveCourse = await newlyCreatedCourse.save();

    if (saveCourse) {
      res.status(201).json({
        success: true,
        message: "Course saved successfully",
        data: saveCourse,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const { instructorId } = req.query;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: "Instructor ID is required",
      });
    }

    // Only fetch courses created by this instructor
    const coursesList = await Course.find({ instructorId });

    res.status(200).json({
      success: true,
      data: coursesList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getCourseDetailsByID = async (req, res) => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
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

const updateCourseByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourseData = req.body;

    // We'll always preserve the students array below

    // Always preserve the students array
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Create a new object with all fields from updatedCourseData
    const updateFields = { ...updatedCourseData };

    // Always preserve the existing students array
    updateFields.students = existingCourse.students;

    // Ensure total duration is calculated correctly
    if (updateFields.curriculum && updateFields.curriculum.length > 0) {
      let totalDuration = 0;

      // Log lecture durations for debugging
      console.log('Course update - lecture durations:');
      updateFields.curriculum.forEach((lecture, idx) => {
        console.log(`  Lecture ${idx + 1} (${lecture.title}): duration = ${lecture.duration || 'not set'}`);
        if (lecture.duration && !isNaN(lecture.duration)) {
          totalDuration += Number(lecture.duration);
        }
      });

      // Set the total duration
      updateFields.totalDuration = totalDuration;
      console.log(`Setting total duration for updated course: ${totalDuration} seconds`);
    }

    console.log('Preserving students array:', existingCourse.students.length, 'students');
    console.log('Update fields:', Object.keys(updateFields));

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const updateCoursePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { isPublished },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: `Course is now ${isPublished ? 'public' : 'private'}`,
      data: updatedCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const updateCourseDiscountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountActive, discountPercentage } = req.body;

    // Validate discount percentage
    const validatedPercentage = discountPercentage !== undefined ?
      Math.min(Math.max(parseFloat(discountPercentage), 0), 100) : undefined;

    // Create update object based on what was provided
    const updateObj = {};
    if (discountActive !== undefined) updateObj.discountActive = discountActive;
    if (validatedPercentage !== undefined) updateObj.discountPercentage = validatedPercentage;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateObj,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: `Discount ${updatedCourse.discountActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the course to make sure it exists
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    // Delete the course
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
    });
  }
};

module.exports = {
  addNewCourse,
  getAllCourses,
  updateCourseByID,
  getCourseDetailsByID,
  updateCoursePublishStatus,
  updateCourseDiscountStatus,
  deleteCourse,
};
