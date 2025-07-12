const User = require("../../models/User");
const nodemailer = require("nodemailer");

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
const createTransporter = async () => {
  try {
    // In production, use your actual SMTP credentials
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error("Error creating/verifying email transporter:", error);
    throw error;
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const transporter = await createTransporter();
  
  await transporter.sendMail({
    from: '"SkillHub Support" <support@skillhub.com>',
    to: email,
    subject: "Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">SkillHub Email Verification</h2>
        <p>Thank you for registering with SkillHub! Please use the following OTP to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px; font-size: 24px; letter-spacing: 5px;">
            ${otp}
          </div>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">SkillHub Learning Platform</p>
      </div>
    `
  });
};

// Send OTP during registration
const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to user document
    const user = await User.findOneAndUpdate(
      { userEmail: email },
      {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: otpExpiry,
        isEmailVerified: false
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email"
    });
  } catch (error) {
    console.error("Error sending verification OTP:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification OTP"
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      userEmail: email,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });
  }
};

module.exports = {
  sendVerificationOTP,
  verifyOTP
};