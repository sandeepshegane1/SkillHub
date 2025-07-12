const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["enrollment", "completion", "lecture_view"],
    required: true
  },
  userId: String,
  userName: String,
  userEmail: String,
  instructorId: String,
  courseId: String,
  courseTitle: String,
  lectureId: String,
  lectureTitle: String,
  date: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Add index for faster queries
ActivitySchema.index({ instructorId: 1, date: -1 });
ActivitySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Activity", ActivitySchema);
