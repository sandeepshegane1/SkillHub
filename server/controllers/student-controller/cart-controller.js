const Cart = require("../../models/Cart");
const Course = require("../../models/Course");

// Get user's cart
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = new Cart({
        userId,
        items: []
      });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (err) {
    console.error("Error getting user cart:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get cart. Please try again."
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Find user's cart
    let cart = await Cart.findOne({ userId });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({
        userId,
        items: []
      });
    }

    // Check if course is already in cart
    const courseExists = cart.items.some(item => item.courseId === courseId);
    if (courseExists) {
      return res.status(200).json({
        success: true,
        alreadyInCart: true,
        message: "Course is already in your cart",
        data: cart
      });
    }

    // Add course to cart
    cart.items.push({
      courseId: course._id,
      courseTitle: course.title,
      courseImage: course.image,
      instructorId: course.instructorId,
      instructorName: course.instructorName,
      pricing: course.pricing.toString()
    });

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Course added to cart",
      data: cart
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add to cart. Please try again."
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Remove course from cart
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.courseId !== courseId);

    // Check if any item was removed
    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Course not found in cart"
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Course removed from cart",
      data: cart
    });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({
      success: false,
      message: "Failed to remove from cart. Please try again."
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Clear cart items
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: cart
    });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart. Please try again."
    });
  }
};

module.exports = {
  getUserCart,
  addToCart,
  removeFromCart,
  clearCart
};
