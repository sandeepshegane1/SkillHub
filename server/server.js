require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const instructorStudentProgressRoutes = require("./routes/instructor-routes/student-progress-routes");
const instructorActivityRoutes = require("./routes/instructor-routes/activity-routes");
const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");
const studentRatingRoutes = require("./routes/student-routes/rating-routes");
const studentCartRoutes = require("./routes/student-routes/cart-routes");
const studentCertificateRoutes = require("./routes/student-routes/certificate-routes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI; // Use this variable consistently

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.static('public'));
console.log("MongoDB URL:", MONGO_URI); // Log the correct variable

mongoose
  .connect(MONGO_URI) // Remove deprecated options
  .then(() => console.log("MongoDB is connected"))
  .catch((e) => console.log("MongoDB connection error:", e));

// Routes configuration
app.use("/auth", authRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/instructor/student-progress", instructorStudentProgressRoutes);
app.use("/instructor/activity", instructorActivityRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);
app.use("/student/rating", studentRatingRoutes);
app.use("/student/cart", studentCartRoutes);
app.use("/student/certificate", studentCertificateRoutes);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});
console.log("CLIENT_URL:", process.env.CLIENT_URL);

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});
