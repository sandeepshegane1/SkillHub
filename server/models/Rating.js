const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
RatingSchema.index({ courseId: 1 });
RatingSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", RatingSchema);
