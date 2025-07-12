const express = require("express");
const {
  createOrder,
  capturePaymentAndFinalizeOrder,
  verifyRazorpayPayment,
} = require("../../controllers/student-controller/order-controller");

const router = express.Router();

router.post("/create", createOrder);
router.post("/capture", capturePaymentAndFinalizeOrder);
router.post("/verify-razorpay", verifyRazorpayPayment);

module.exports = router;
