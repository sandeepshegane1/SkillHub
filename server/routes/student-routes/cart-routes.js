const express = require("express");
const {
  getUserCart,
  addToCart,
  removeFromCart,
  clearCart
} = require("../../controllers/student-controller/cart-controller");
const router = express.Router();

router.get("/:userId", getUserCart);
router.post("/:userId/add", addToCart);
router.delete("/:userId/remove/:courseId", removeFromCart);
router.delete("/:userId/clear", clearCart);

module.exports = router;
