const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  password: String,
  role: String,
  profilePicture: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationOTPExpires: Date
});

module.exports = mongoose.model("User", UserSchema);
