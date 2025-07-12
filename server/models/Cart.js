const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  courseImage: {
    type: String,
    required: false
  },
  instructorId: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  pricing: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
CartSchema.index({ userId: 1 });

module.exports = mongoose.model("Cart", CartSchema);
