const express = require("express");
const path = require("path");

const {
  generateCertificate,
  generateTestCertificate,
} = require("../../controllers/student-controller/png-certificate-controller");

const router = express.Router();

// PNG certificate routes
router.post("/generate", generateCertificate);

// Test route for PNG certificate
router.get("/test", generateTestCertificate);

module.exports = router;
