const Rating = require("../../models/Rating");
const Course = require("../../models/Course");
const Activity = require("../../models/Activity");
const User = require("../../models/User");
const CourseProgress = require("../../models/CourseProgress");
const Certificate = require("../../models/Certificate");
const axios = require("axios");

// Add or update a rating
const addOrUpdateRating = async (req, res) => {
  try {
    const { userId, courseId, rating, review } = req.body;

    if (!userId || !courseId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if user has already rated this course
    let existingRating = await Rating.findOne({ userId, courseId });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.date = new Date();
      await existingRating.save();

      return res.status(200).json({
        success: true,
        message: "Rating updated successfully",
        data: existingRating
      });
    } else {
      // Create new rating
      const newRating = new Rating({
        userId,
        userName: user.userName,
        courseId,
        rating,
        review,
        date: new Date()
      });
      await newRating.save();

      // Create activity for instructor
      const newActivity = new Activity({
        type: "rating",
        userId,
        userName: user.userName,
        userEmail: user.userEmail,
        instructorId: course.instructorId,
        courseId,
        courseTitle: course.title,
        date: new Date()
      });
      await newActivity.save();

      // Check if the course is completed
      const progress = await CourseProgress.findOne({ userId, courseId });

      // If course is completed, check if certificate exists
      if (progress && progress.completed) {
        const existingCertificate = await Certificate.findOne({ userId, courseId });

        // If no certificate exists, notify the client to generate one
        if (!existingCertificate) {
          return res.status(201).json({
            success: true,
            message: "Rating added successfully. You can now generate your certificate!",
            data: newRating,
            canGenerateCertificate: true
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: "Rating added successfully",
        data: newRating
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
};

// Get ratings for a course
const getCourseRatings = async (req, res) => {
  try {
    const { courseId } = req.params;

    const ratings = await Rating.find({ courseId }).sort({ date: -1 });

    // Calculate average rating
    let totalRating = 0;
    ratings.forEach(rating => {
      totalRating += rating.rating;
    });
    const averageRating = ratings.length > 0 ? (totalRating / ratings.length).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        ratings,
        averageRating,
        totalRatings: ratings.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
};

// Get user rating for a course
const getUserRatingForCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const rating = await Rating.findOne({ userId, courseId });

    return res.status(200).json({
      success: true,
      data: rating || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
};

module.exports = {
  addOrUpdateRating,
  getCourseRatings,
  getUserRatingForCourse
};
