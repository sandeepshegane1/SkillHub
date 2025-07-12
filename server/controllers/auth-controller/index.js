

const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { userName, userEmail, password, role } = req.body;

  // Check if email already exists
  const existingEmail = await User.findOne({ userEmail });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: "Email address is already registered",
    });
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ userName });
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      message: "Username is already taken",
    });
  }

  // Password validation
  const missingRequirements = [];
  if (password.length < 8) missingRequirements.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) missingRequirements.push("an uppercase letter");
  if (!/[a-z]/.test(password)) missingRequirements.push("a lowercase letter");
  if (!/\d/.test(password)) missingRequirements.push("a number");
  if (!/[@$!%*?&]/.test(password)) missingRequirements.push("a special character (@$!%*?&)");

  if (missingRequirements.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Password is missing: ${missingRequirements.join(", ")}`
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    userName,
    userEmail,
    role,
    password: hashPassword,
    });

    await newUser.save();

    // Send verification OTP
    const { sendVerificationOTP } = require('./email-verification-controller');
    await sendVerificationOTP({ body: { email: userEmail } }, { status: () => ({ json: () => {} }) });

    return res.status(201).json({
      success: true,
      message: "User registered successfully! Please check your email for verification OTP.",
    });
};

const loginUser = async (req, res) => {
  const { userEmail, password } = req.body;

  const checkUser = await User.findOne({ userEmail });

  if (!checkUser || !(await bcrypt.compare(password, checkUser.password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Check if email is verified
  if (!checkUser.isEmailVerified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your email address before logging in."
    });
  }

  const accessToken = jwt.sign(
    {
      _id: checkUser._id,
      userName: checkUser.userName,
      userEmail: checkUser.userEmail,
      role: checkUser.role,
    },
    "JWT_SECRET",
    { expiresIn: "120m" }
  );

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: {
        _id: checkUser._id,
        userName: checkUser.userName,
        userEmail: checkUser.userEmail,
        role: checkUser.role,
      },
    },
  });
};

module.exports = { registerUser, loginUser };
