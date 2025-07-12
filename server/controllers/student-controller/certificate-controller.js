const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

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

    // Check if course exists - try multiple methods to find the course
    let course;
    try {
      // First try direct lookup
      course = await Course.findById(courseId);
    } catch (error) {
      console.log(`Error in direct course lookup: ${error.message}`);
    }

    // If not found, try string-based lookup
    if (!course) {
      try {
        console.log('Trying string-based course lookup...');
        // Try to find by string comparison
        const allCourses = await Course.find({});
        course = allCourses.find(c => c._id.toString().trim() === courseId.toString().trim());

        if (course) {
          console.log(`Found course using string comparison: ${course.title}`);
        }
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

    // Check if the user has provided feedback
    // We'll make this optional for now to help with testing
    const rating = await Rating.findOne({ userId, courseId });
    if (!rating) {
      console.log("User has not provided feedback yet, but proceeding with certificate generation");
      // We'll continue without requiring feedback for now
      // Uncomment the following code to enforce feedback requirement
      /*
      return res.status(400).json({
        success: false,
        message: "Please provide feedback for the course before generating a certificate",
      });
      */
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

    // Certificate ID is now handled above

    // Generate PDF certificate
    const pdfBuffer = await createCertificatePDF(
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

    // Generate PDF certificate
    const pdfBuffer = await createCertificatePDF(
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

// Get all certificates for a user
const getUserCertificates = async (req, res) => {
  try {
    const { userId } = req.params;

    const certificates = await Certificate.find({ userId }).sort({
      issueDate: -1,
    });

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching certificates",
    });
  }
};

// Helper function to create a PDF certificate using PDFKit
const createCertificatePDF = async (
  studentName,
  courseTitle,
  instructorName,
  certificateId,
  issueDate
) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document matching the HTML template dimensions
      const doc = new PDFDocument({
        size: [800, 600],  // Match the HTML template dimensions
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        },
        layout: "landscape", // Landscape orientation
      });

      // Buffer to store PDF data
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Set background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");

      // Add border (20px solid #333 like in the HTML)
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(20)
        .stroke("#333333");

      // Add inner border (2px solid #eee like in the HTML)
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(2)
        .stroke("#eeeeee");

      // Define fixed positions for better layout control matching HTML template
      const centerX = doc.page.width / 2;
      const titleY = 80;
      const contentY = 180;
      const signatureY = 450;
      const sealX = 120; // Left position for seal

      // Add certificate title at the top center matching HTML template
      doc.font("Helvetica-Bold")
        .fontSize(40)
        .fill("#000000")
        .text("CERTIFICATE", 0, titleY, {
          align: "center",
          width: doc.page.width
        });

      doc.font("Helvetica-Bold")
        .fontSize(18)
        .fill("#000000")
        .text("OF ACHIEVEMENT", 0, titleY + 50, {
          align: "center",
          width: doc.page.width
        });

      // Add seal on the left side matching HTML template
      const sealRadius = 50; // Match HTML template size
      doc.circle(sealX, contentY + 50, sealRadius).fill("#ffc107");
      doc.circle(sealX, contentY + 50, sealRadius + 5)
        .lineWidth(2)
        .dash(5, 5)
        .stroke("#ff9800");

      doc.font("Helvetica-Bold")
        .fontSize(16)
        .fill("#603600")
        .text("AWARD", sealX - sealRadius, contentY + 45, {
          align: "center",
          width: sealRadius * 2
        });

      // Add recipient details matching HTML template
      doc.font("Helvetica")
        .fontSize(16)
        .fill("#000000")
        .text("THIS CERTIFICATE IS PRESENTED TO", 0, contentY, {
          align: "center",
          width: doc.page.width
        });

      doc.font("Helvetica-Bold")
        .fontSize(30)
        .fill("#000000")
        .text(studentName, 0, contentY + 40, {
          align: "center",
          width: doc.page.width
        });

      // Add course details matching HTML template
      doc.font("Helvetica")
        .fontSize(16)
        .fill("#000000")
        .text("For successfully completing the course", 0, contentY + 90, {
          align: "center",
          width: doc.page.width
        });

      doc.font("Helvetica-Bold")
        .fontSize(24)
        .fill("#000000")
        .text(courseTitle, 0, contentY + 120, {
          align: "center",
          width: doc.page.width
        });

      // Add description matching HTML template
      doc.font("Helvetica")
        .fontSize(14)
        .fill("#444444")
        .text(
          "This certificate acknowledges the dedication and hard work demonstrated in mastering the skills and knowledge presented in this course. SkillHub recognizes this achievement and the commitment to continuous learning and professional development.",
          doc.page.width / 2 - 300, contentY + 160, {
            align: "center",
            width: 600
          }
        );

      // Create two columns for signatures matching HTML template
      const signatureWidth = 180;
      const leftSignatureX = doc.page.width / 4 - signatureWidth / 2;
      const rightSignatureX = (doc.page.width * 3) / 4 - signatureWidth / 2;

      // Left column for date
      doc.font("Helvetica")
        .fontSize(12)
        .text(
          new Date(issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          leftSignatureX, // x position
          signatureY - 20, // y position
          {
            align: "center",
            width: signatureWidth
          }
        );

      // Draw line under date
      doc.moveTo(leftSignatureX, signatureY)
         .lineTo(leftSignatureX + signatureWidth, signatureY)
         .stroke();

      // Add DATE label
      doc.font("Helvetica")
        .fontSize(12)
        .text("DATE", leftSignatureX, signatureY + 10, {
          align: "center",
          width: signatureWidth
        });

      // Right column for signature
      // Add instructor name
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .text(instructorName,
          rightSignatureX,
          signatureY - 20,
          {
            align: "center",
            width: signatureWidth
          }
        );

      // Draw line under signature
      doc.moveTo(rightSignatureX, signatureY)
         .lineTo(rightSignatureX + signatureWidth, signatureY)
         .stroke();

      // Add SIGNATURE label
      doc.font("Helvetica")
        .fontSize(12)
        .text("SIGNATURE", rightSignatureX, signatureY + 10, {
          align: "center",
          width: signatureWidth
        });

      // Add certificate ID at the bottom (matching HTML template)
      doc.font("Helvetica")
        .fontSize(8)
        .fill("#999999")
        .text(
          `Certificate ID: ${certificateId}`,
          0, doc.page.height - 60, {
            align: "center",
            width: doc.page.width
          }
        );

      // Add platform name
      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fill("#000000")
        .text("SkillHub", 0, doc.page.height - 40, {
          align: "center",
          width: doc.page.width
        });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificate,
  downloadCertificate,
  getUserCertificates,
};
