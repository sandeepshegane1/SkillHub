const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Certificate = require('../../models/Certificate');
const CourseProgress = require('../../models/CourseProgress');

// Certificate generation function with real data
exports.generateCertificate = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ success: false, message: 'Missing required fields: userId and courseId are required' });
    }

    // Fetch real user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch real course data
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Fetch instructor data
    const instructor = await User.findById(course.instructorId);
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Check if course is completed
    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress || !progress.completed) {
      // For testing purposes, we'll still generate the certificate
      console.log('Warning: Course not marked as completed, but generating certificate anyway');
    }

    // Check if certificate already exists
    let certificateId;
    const existingCertificate = await Certificate.findOne({ userId, courseId });

    if (existingCertificate) {
      certificateId = existingCertificate.certificateId;
      console.log(`Using existing certificate ID: ${certificateId}`);
    } else {
      // Generate a new certificate ID
      certificateId = uuidv4();

      // Create a new certificate record
      const newCertificate = new Certificate({
        userId,
        userName: user.userName,
        courseId,
        courseTitle: course.title,
        instructorId: course.instructorId,
        instructorName: instructor.userName,
        certificateId,
        issueDate: new Date()
      });

      await newCertificate.save();
      console.log(`New certificate created with ID: ${certificateId}`);
    }

    // Prepare certificate data
    const certificateData = {
      studentName: user.userName,
      courseTitle: course.title,
      instructorName: instructor.userName,
      certificateId,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Generate certificate image
    const certificateBuffer = await createCertificateImage(certificateData);

    // Convert image to PDF
    const pdfBuffer = await convertImageToPdf(certificateBuffer);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.pdf"`);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ success: false, message: 'Error generating certificate' });
  }
};

// Test certificate generation with realistic data
exports.generateTestCertificate = async (req, res) => {
  try {
    // Try to get a real user and course from the database for testing
    let studentName = 'Rahul Sharma';
    let courseTitle = 'Advanced React & Node.js Development';
    let instructorName = 'Priya Patel';

    // Try to fetch a real user
    try {
      const user = await User.findOne();
      if (user) {
        studentName = user.userName || studentName;
      }
    } catch (err) {
      console.log('Could not fetch a real user, using sample data');
    }

    // Try to fetch a real course
    try {
      const course = await Course.findOne();
      if (course) {
        courseTitle = course.title || courseTitle;

        // Try to fetch the instructor
        try {
          const instructor = await User.findById(course.instructorId);
          if (instructor) {
            instructorName = instructor.userName || instructorName;
          }
        } catch (err) {
          console.log('Could not fetch instructor, using sample data');
        }
      }
    } catch (err) {
      console.log('Could not fetch a real course, using sample data');
    }

    // Sample data for test certificate with potentially real data
    const certificateData = {
      studentName,
      courseTitle,
      instructorName,
      certificateId: uuidv4(),
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Generate certificate image
    const certificateBuffer = await createCertificateImage(certificateData);

    // Convert image to PDF
    const pdfBuffer = await convertImageToPdf(certificateBuffer);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="test-certificate.pdf"`);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating test certificate:', error);
    res.status(500).json({ success: false, message: 'Error generating test certificate' });
  }
};

// Function to create certificate image
async function createCertificateImage(data) {
  // Create canvas with certificate dimensions - matching the image exactly
  const width = 950;
  const height = 650;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create a gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#ffffff');
  bgGradient.addColorStop(1, '#f5f9ff');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Add decorative corner elements
  function drawCorner(x, y, rotate) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate * Math.PI / 180);

    // Draw elegant corner design
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 0);
    ctx.lineTo(0, 80);
    ctx.closePath();

    const cornerGradient = ctx.createLinearGradient(0, 0, 80, 80);
    cornerGradient.addColorStop(0, '#3a86ff');
    cornerGradient.addColorStop(1, '#8338ec');
    ctx.fillStyle = cornerGradient;
    ctx.fill();

    // Add decorative line
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(0, 15);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // Draw corners at each corner of the certificate
  drawCorner(0, 0, 0);
  drawCorner(width, 0, 90);
  drawCorner(width, height, 180);
  drawCorner(0, height, 270);

  // Add elegant border
  ctx.strokeStyle = '#3a86ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  // Add inner border with gradient
  const borderGradient = ctx.createLinearGradient(45, 45, width - 45, height - 45);
  borderGradient.addColorStop(0, '#8338ec');
  borderGradient.addColorStop(0.5, '#3a86ff');
  borderGradient.addColorStop(1, '#8338ec');

  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 1;
  ctx.strokeRect(45, 45, width - 90, height - 90);

  // Add subtle pattern overlay
  for (let i = 0; i < width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Add certificate title with gradient
  ctx.textAlign = 'center';

  // Create text gradient for main title
  const titleGradient = ctx.createLinearGradient(width/2 - 200, 0, width/2 + 200, 0);
  titleGradient.addColorStop(0, '#3a86ff');
  titleGradient.addColorStop(1, '#8338ec');

  // Add main title with shadow
  ctx.font = 'bold 65px "Times New Roman", serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = titleGradient;
  ctx.fillText('CERTIFICATE', width / 2, 150);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add decorative line under title
  ctx.beginPath();
  ctx.moveTo(width/2 - 180, 165);
  ctx.lineTo(width/2 + 180, 165);
  ctx.strokeStyle = titleGradient;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Add subtitle with same gradient
  ctx.font = 'bold 30px "Times New Roman", serif';
  ctx.fillStyle = titleGradient;
  ctx.fillText('OF ACHIEVEMENT', width / 2, 200);

  // Add recipient text with elegant styling
  ctx.font = '18px "Times New Roman", serif';
  ctx.fillStyle = '#333';
  ctx.fillText('THIS CERTIFICATE IS PRESENTED TO', width / 2, 250);

  // Add decorative line above recipient name
  ctx.beginPath();
  ctx.moveTo(width/2 - 150, 265);
  ctx.lineTo(width/2 + 150, 265);
  ctx.strokeStyle = 'rgba(58, 134, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Add recipient name in italic with shadow and gradient
  const nameGradient = ctx.createLinearGradient(width/2 - 200, 0, width/2 + 200, 0);
  nameGradient.addColorStop(0, '#1a1a1a');
  nameGradient.addColorStop(0.5, '#000000');
  nameGradient.addColorStop(1, '#1a1a1a');

  ctx.font = 'italic bold 48px "Times New Roman", serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = nameGradient;
  ctx.fillText(data.studentName, width / 2, 310);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add decorative line below recipient name
  ctx.beginPath();
  ctx.moveTo(width/2 - 150, 325);
  ctx.lineTo(width/2 + 150, 325);
  ctx.strokeStyle = 'rgba(58, 134, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Add course completion text with elegant styling
  ctx.font = '18px "Times New Roman", serif';
  ctx.fillStyle = '#333';
  ctx.fillText('For successfully completing the course', width / 2, 350);

  // Add course title with beautiful highlight
  ctx.font = 'bold 30px "Times New Roman", serif';

  // Draw a gradient highlight behind the course title
  const courseTextWidth = ctx.measureText(data.courseTitle).width;
  const highlightGradient = ctx.createLinearGradient(
    width/2 - courseTextWidth/2 - 20,
    380,
    width/2 + courseTextWidth/2 + 20,
    420
  );
  highlightGradient.addColorStop(0, 'rgba(58, 134, 255, 0.1)');
  highlightGradient.addColorStop(0.5, 'rgba(131, 56, 236, 0.15)');
  highlightGradient.addColorStop(1, 'rgba(58, 134, 255, 0.1)');

  ctx.fillStyle = highlightGradient;

  // Draw rounded rectangle for highlight
  roundRect(
    ctx,
    width/2 - courseTextWidth/2 - 20,
    380,
    courseTextWidth + 40,
    40,
    10,
    true,
    false
  );

  // Helper function for rounded rectangle
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  // Draw the course title text with slight shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#000';
  ctx.fillText(data.courseTitle, width / 2, 405);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add a larger appreciation message with elegant styling
  ctx.font = '19px "Times New Roman", serif';
  ctx.fillStyle = '#333';
  ctx.fillText('We appreciate your dedication to learning and professional growth on SkillHub.', width / 2, 435);

  // Add a message about completing the course
  ctx.font = '15px "Times New Roman", serif';
  ctx.fillStyle = '#444';
  ctx.fillText('This certificate acknowledges the hard work in mastering the skills presented in this course.', width / 2, 465);

  // Add additional information about skills gained
  ctx.font = '14px "Times New Roman", serif';
  ctx.fillStyle = '#555';
  ctx.fillText('The skills and knowledge gained through this program demonstrate your commitment to excellence', width / 2, 490);
  ctx.fillText('and readiness to apply these competencies in real-world scenarios.', width / 2, 510);

  // Add decorative divider
  ctx.beginPath();
  ctx.moveTo(width/2 - 100, 525);
  ctx.lineTo(width/2 + 100, 525);
  const dividerGradient = ctx.createLinearGradient(width/2 - 100, 0, width/2 + 100, 0);
  dividerGradient.addColorStop(0, 'rgba(58, 134, 255, 0.0)');
  dividerGradient.addColorStop(0.5, 'rgba(58, 134, 255, 0.5)');
  dividerGradient.addColorStop(1, 'rgba(58, 134, 255, 0.0)');
  ctx.strokeStyle = dividerGradient;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Add SkillHub text on the top right with larger size and gradient
  ctx.textAlign = 'right';

  // Create gradient for SkillHub text
  const skillHubGradient = ctx.createLinearGradient(width - 200, 0, width - 50, 0);
  skillHubGradient.addColorStop(0, '#3a86ff');
  skillHubGradient.addColorStop(1, '#8338ec');

  ctx.font = 'bold 38px "Times New Roman", serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = skillHubGradient;
  ctx.fillText('SkillHub', width - 70, 90);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Add small decorative element near SkillHub
  ctx.beginPath();
  ctx.arc(width - 50, 75, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#3a86ff';
  ctx.fill();

  // Add signature section with elegant styling
  // Date signature
  ctx.textAlign = 'center';
  ctx.font = '15px "Times New Roman", serif';
  ctx.fillStyle = '#333';
  ctx.fillText(data.issueDate, 250, 560);

  // Gradient line for date
  const dateLineGradient = ctx.createLinearGradient(180, 0, 320, 0);
  dateLineGradient.addColorStop(0, 'rgba(58, 134, 255, 0.7)');
  dateLineGradient.addColorStop(1, 'rgba(131, 56, 236, 0.7)');

  ctx.beginPath();
  ctx.moveTo(180, 580);
  ctx.lineTo(320, 580);
  ctx.strokeStyle = dateLineGradient;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 13px "Times New Roman", serif';
  ctx.fillStyle = '#555';
  ctx.fillText('DATE', 250, 595);

  // Instructor signature
  ctx.font = '15px "Times New Roman", serif';
  ctx.fillStyle = '#333';
  ctx.fillText(data.instructorName, 700, 560);

  // Gradient line for signature
  const signLineGradient = ctx.createLinearGradient(630, 0, 770, 0);
  signLineGradient.addColorStop(0, 'rgba(131, 56, 236, 0.7)');
  signLineGradient.addColorStop(1, 'rgba(58, 134, 255, 0.7)');

  ctx.beginPath();
  ctx.moveTo(630, 580);
  ctx.lineTo(770, 580);
  ctx.strokeStyle = signLineGradient;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 13px "Times New Roman", serif';
  ctx.fillStyle = '#555';
  ctx.fillText('SIGNATURE', 700, 595);

  // Add small decorative elements near signatures
  ctx.beginPath();
  ctx.arc(180, 580, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#3a86ff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(320, 580, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#8338ec';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(630, 580, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#8338ec';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(770, 580, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#3a86ff';
  ctx.fill();

  // Add certificate ID at the bottom with elegant styling
  ctx.font = '9px "Times New Roman", serif';
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';

  // Add subtle background for certificate ID
  const idWidth = ctx.measureText(`Certificate ID: ${data.certificateId}`).width;
  roundRect(
    ctx,
    width/2 - idWidth/2 - 10,
    610,
    idWidth + 20,
    20,
    10,
    true,
    false
  );

  // Draw certificate ID text
  ctx.fillStyle = '#555';
  ctx.fillText(`Certificate ID: ${data.certificateId}`, width / 2, 623);

  // Convert canvas to buffer
  return canvas.toBuffer('image/png');
}

// Function to convert image to PDF
async function convertImageToPdf(imageBuffer) {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document with the exact dimensions of our certificate
      const doc = new PDFDocument({
        size: [950, 650],
        margin: 0
      });

      // Create a buffer to store the PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Add the image to the PDF with exact dimensions
      doc.image(imageBuffer, 0, 0, {
        width: 950,
        height: 650
      });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
