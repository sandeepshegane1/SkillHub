const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const htmlPdf = require("html-pdf");
const Certificate = require("../../models/Certificate");
const CourseProgress = require("../../models/CourseProgress");
const Course = require("../../models/Course");
const User = require("../../models/User");
const Rating = require("../../models/Rating");

// Generate a certificate for a completed course
const generateCertificate = async (req, res) => {
  try {
    console.log("Certificate generation request received:", req.body);
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      console.log("Missing required fields:", { userId, courseId });
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    console.log(`Processing certificate request for user: ${userId}, course: ${courseId}`);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if course exists
    let course;
    try {
      course = await Course.findById(courseId);
    } catch (error) {
      console.log(`Error in direct course lookup: ${error.message}`);
    }

    if (!course) {
      try {
        console.log('Trying string-based course lookup...');
        const allCourses = await Course.find({});
        course = allCourses.find(c => c._id.toString().trim() === courseId.toString().trim());
      } catch (error) {
        console.log(`Error in string-based course lookup: ${error.message}`);
      }
    }

    if (!course) {
      console.log(`Course not found with ID: ${courseId}`);
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    console.log(`Found course: ${course.title} with ID: ${course._id}`);

    // Check if the instructor exists
    const instructor = await User.findById(course.instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Check if the course is completed
    const progress = await CourseProgress.findOne({ userId, courseId });
    console.log("Course progress:", progress);

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "No progress found for this course",
      });
    }

    // If progress exists but not marked as completed, check if all lectures are viewed
    if (!progress.completed) {
      // Get course details to check curriculum length
      const courseDetails = await Course.findById(courseId);
      if (!courseDetails || !courseDetails.curriculum) {
        return res.status(400).json({
          success: false,
          message: "Course curriculum not found",
        });
      }

      // Check if all lectures are viewed
      const allLecturesViewed =
        progress.lecturesProgress.length === courseDetails.curriculum.length &&
        progress.lecturesProgress.every(item => item.viewed);

      if (allLecturesViewed) {
        // Mark the course as completed if all lectures are viewed
        progress.completed = true;
        progress.completionDate = new Date();
        await progress.save();
        console.log("Course marked as completed based on lecture progress");
      } else {
        return res.status(400).json({
          success: false,
          message: "Course not completed yet. Please complete all lectures.",
        });
      }
    }

    // Check if certificate already exists - but allow regeneration
    const existingCertificate = await Certificate.findOne({ userId, courseId });
    console.log("Existing certificate:", existingCertificate ? existingCertificate._id : "None");

    // We'll still use the existing certificate ID if it exists, but allow regeneration
    let certificateId;
    if (existingCertificate) {
      console.log(`Using existing certificate ID: ${existingCertificate.certificateId}`);
      certificateId = existingCertificate.certificateId;
    } else {
      // Generate a new certificate ID if none exists
      certificateId = uuidv4();
      console.log(`Generated new certificate ID: ${certificateId}`);

      // Create a new certificate record
      const newCertificate = new Certificate({
        userId,
        userName: user.userName,
        courseId,
        courseTitle: course.title,
        instructorId: course.instructorId,
        instructorName: instructor.userName,
        certificateId,
        issueDate: new Date(),
      });

      await newCertificate.save();
      console.log(`New certificate record saved with ID: ${certificateId}`);
    }

    // Generate PDF certificate using HTML template
    const pdfBuffer = await createCertificateHTML(
      user.userName,
      course.title,
      instructor.userName,
      certificateId,
      new Date()
    );

    // Log success before sending response
    console.log(`Certificate generated successfully for user: ${userId}, course: ${courseId}, certificateId: ${certificateId}`);

    // Send the PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${certificateId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error in certificate generation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: `An error occurred while generating the certificate: ${error.message}`,
    });
  }
};

// Download an existing certificate
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Find the certificate
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Get user and course details
    const user = await User.findById(certificate.userId);
    const course = await Course.findById(certificate.courseId);
    const instructor = await User.findById(certificate.instructorId);

    if (!user || !course || !instructor) {
      return res.status(404).json({
        success: false,
        message: "Required data not found",
      });
    }

    // Generate PDF certificate using HTML template
    const pdfBuffer = await createCertificateHTML(
      user.userName,
      course.title,
      instructor.userName,
      certificate.certificateId,
      certificate.issueDate
    );

    // Send the PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${certificateId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while downloading the certificate",
    });
  }
};

// Helper function to create a certificate using HTML template and convert to PDF
const createCertificateHTML = async (
  studentName,
  courseTitle,
  instructorName,
  certificateId,
  issueDate
) => {
  return new Promise((resolve, reject) => {
    try {
      // Read the HTML template
      const templatePath = path.join(__dirname, '../../certificates/certificate-template.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Format the date
      const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Replace placeholders with actual data
      htmlTemplate = htmlTemplate
        .replace('{{studentName}}', studentName)
        .replace('{{courseTitle}}', courseTitle)
        .replace('{{instructorName}}', instructorName)
        .replace('{{certificateId}}', certificateId)
        .replace('{{issueDate}}', formattedDate);

      // PDF generation options
      const options = {
        width: '800px',  // Exact width as in the image
        height: '380px', // Exact height as in the image
        border: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0'
        },
        type: 'pdf',
        timeout: 30000,
        renderDelay: 1000,
        pdfOptions: {
          printBackground: true,
          preferCSSPageSize: true
        }
      };

      // Convert HTML to PDF
      htmlPdf.create(htmlTemplate, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('Error creating PDF:', err);
          reject(err);
          return;
        }
        resolve(buffer);
      });
    } catch (error) {
      console.error('Error in certificate generation:', error);
      reject(error);
    }
  });
};

module.exports = {
  generateCertificate,
  downloadCertificate,
  createCertificateHTML
};
