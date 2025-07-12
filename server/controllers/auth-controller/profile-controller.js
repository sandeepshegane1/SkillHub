const User = require("../../models/User");

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, userEmail, profilePicture } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is already taken by another user
    if (userEmail !== user.userEmail) {
      const existingUser = await User.findOne({ userEmail });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        userName,
        userEmail,
        profilePicture,
      },
      { new: true }
    );

    // Return updated user without password
    const userResponse = {
      _id: updatedUser._id,
      userName: updatedUser.userName,
      userEmail: updatedUser.userEmail,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile",
    });
  }
};

module.exports = { updateUserProfile };
