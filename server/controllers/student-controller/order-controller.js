const paypal = require("../../helpers/paypal");
const razorpay = require("../../helpers/razorpay");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");
const Activity = require("../../models/Activity");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      paymentId,
      payerId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
      amount, // Add support for amount parameter
    } = req.body;

    // Use amount if provided, otherwise use coursePricing
    const finalPricing = amount || coursePricing;

    console.log('Received order request with payment method:', paymentMethod);
    console.log('Course pricing:', finalPricing, 'Type:', typeof finalPricing);

    // Check if the course should be free (null, 0, or invalid pricing)
    console.log('Original course pricing:', finalPricing, 'Type:', typeof finalPricing);
    console.log('Original payment method:', paymentMethod);

    // Convert to number for comparison
    const numericPrice = Number(finalPricing);
    console.log('Numeric price:', numericPrice, 'isNaN:', isNaN(numericPrice));

    if (finalPricing === null || finalPricing === undefined || finalPricing === '' ||
        isNaN(numericPrice) || numericPrice <= 0) {
      console.log('Course has null/invalid pricing, treating as free');
      // Use let variable for finalPricing
      let updatedPricing = '0';
      let updatedMethod = 'free';
      console.log('Updated payment method to:', updatedMethod);

      // Create a new order with the updated values
      const newlyCreatedCourseOrder = new Order({
        userId,
        userName,
        userEmail,
        orderStatus,
        paymentMethod: updatedMethod,
        paymentStatus,
        orderDate,
        paymentId,
        payerId,
        instructorId,
        instructorName,
        courseImage,
        courseTitle,
        courseId,
        coursePricing: updatedPricing,
      });

      await newlyCreatedCourseOrder.save();

      // Process free course enrollment
      console.log('Processing free course enrollment');

      // For free courses, we'll directly update the student courses and course schema
      // Update student courses
      const studentCourses = await StudentCourses.findOne({
        userId: newlyCreatedCourseOrder.userId,
      });

      if (studentCourses) {
        studentCourses.courses.push({
          courseId: newlyCreatedCourseOrder.courseId,
          title: newlyCreatedCourseOrder.courseTitle,
          instructorId: newlyCreatedCourseOrder.instructorId,
          instructorName: newlyCreatedCourseOrder.instructorName,
          dateOfPurchase: newlyCreatedCourseOrder.orderDate,
          courseImage: newlyCreatedCourseOrder.courseImage,
        });

        await studentCourses.save();
      } else {
        const newStudentCourses = new StudentCourses({
          userId: newlyCreatedCourseOrder.userId,
          courses: [
            {
              courseId: newlyCreatedCourseOrder.courseId,
              title: newlyCreatedCourseOrder.courseTitle,
              instructorId: newlyCreatedCourseOrder.instructorId,
              instructorName: newlyCreatedCourseOrder.instructorName,
              dateOfPurchase: newlyCreatedCourseOrder.orderDate,
              courseImage: newlyCreatedCourseOrder.courseImage,
            },
          ],
        });

        await newStudentCourses.save();
      }

      // Update the course schema students
      const updatedCourse = await Course.findByIdAndUpdate(newlyCreatedCourseOrder.courseId, {
        $addToSet: {
          students: {
            studentId: newlyCreatedCourseOrder.userId,
            studentName: newlyCreatedCourseOrder.userName,
            studentEmail: newlyCreatedCourseOrder.userEmail,
            paidAmount: newlyCreatedCourseOrder.coursePricing,
          },
        },
      }, { new: true });

      // Create activity record for this enrollment
      const newActivity = new Activity({
        type: "enrollment",
        userId: newlyCreatedCourseOrder.userId,
        userName: newlyCreatedCourseOrder.userName,
        userEmail: newlyCreatedCourseOrder.userEmail,
        instructorId: updatedCourse.instructorId,
        courseId: newlyCreatedCourseOrder.courseId,
        courseTitle: newlyCreatedCourseOrder.courseTitle,
        date: new Date()
      });
      await newActivity.save();

      // Update order status to confirmed
      newlyCreatedCourseOrder.paymentStatus = "paid";
      newlyCreatedCourseOrder.orderStatus = "confirmed";
      await newlyCreatedCourseOrder.save();

      // Return success response with more information
      return res.status(200).json({
        success: true,
        message: "Free course enrollment successful",
        data: {
          orderId: newlyCreatedCourseOrder._id,
          courseId: newlyCreatedCourseOrder.courseId,
          courseTitle: newlyCreatedCourseOrder.courseTitle,
          isFree: true,
          redirectUrl: "/student-courses"
        },
      });
    }

    // Create a new order in the database
    const newlyCreatedCourseOrder = new Order({
      userId,
      userName,
      userEmail,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      paymentId,
      payerId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing: finalPricing, // Use finalPricing instead of coursePricing
    });

    await newlyCreatedCourseOrder.save();

    // Handle different payment methods
    console.log('Final payment method before processing:', paymentMethod);

    // Check if this is a free course (either explicitly marked as free or has zero/invalid pricing)
    if (paymentMethod === "free" || Number(finalPricing) <= 0) {
      console.log('Processing as a free course');
      // Handle free courses
      console.log('Processing free course enrollment');

      // For free courses, we'll directly update the student courses and course schema
      // Update student courses
      const studentCourses = await StudentCourses.findOne({
        userId: newlyCreatedCourseOrder.userId,
      });

      if (studentCourses) {
        studentCourses.courses.push({
          courseId: newlyCreatedCourseOrder.courseId,
          title: newlyCreatedCourseOrder.courseTitle,
          instructorId: newlyCreatedCourseOrder.instructorId,
          instructorName: newlyCreatedCourseOrder.instructorName,
          dateOfPurchase: newlyCreatedCourseOrder.orderDate,
          courseImage: newlyCreatedCourseOrder.courseImage,
        });

        await studentCourses.save();
      } else {
        const newStudentCourses = new StudentCourses({
          userId: newlyCreatedCourseOrder.userId,
          courses: [
            {
              courseId: newlyCreatedCourseOrder.courseId,
              title: newlyCreatedCourseOrder.courseTitle,
              instructorId: newlyCreatedCourseOrder.instructorId,
              instructorName: newlyCreatedCourseOrder.instructorName,
              dateOfPurchase: newlyCreatedCourseOrder.orderDate,
              courseImage: newlyCreatedCourseOrder.courseImage,
            },
          ],
        });

        await newStudentCourses.save();
      }

      // Update the course schema students
      const updatedCourse = await Course.findByIdAndUpdate(newlyCreatedCourseOrder.courseId, {
        $addToSet: {
          students: {
            studentId: newlyCreatedCourseOrder.userId,
            studentName: newlyCreatedCourseOrder.userName,
            studentEmail: newlyCreatedCourseOrder.userEmail,
            paidAmount: newlyCreatedCourseOrder.coursePricing,
          },
        },
      }, { new: true });

      // Create activity record for this enrollment
      const newActivity = new Activity({
        type: "enrollment",
        userId: newlyCreatedCourseOrder.userId,
        userName: newlyCreatedCourseOrder.userName,
        userEmail: newlyCreatedCourseOrder.userEmail,
        instructorId: updatedCourse.instructorId,
        courseId: newlyCreatedCourseOrder.courseId,
        courseTitle: newlyCreatedCourseOrder.courseTitle,
        date: new Date()
      });
      await newActivity.save();

      // Update order status to confirmed
      newlyCreatedCourseOrder.paymentStatus = "paid";
      newlyCreatedCourseOrder.orderStatus = "confirmed";
      await newlyCreatedCourseOrder.save();

      // Return success response with more information
      return res.status(200).json({
        success: true,
        message: "Free course enrollment successful",
        data: {
          orderId: newlyCreatedCourseOrder._id,
          courseId: newlyCreatedCourseOrder.courseId,
          courseTitle: newlyCreatedCourseOrder.courseTitle,
          isFree: true,
          redirectUrl: "/student-courses"
        },
      });
    } else if (paymentMethod === "paypal") {
      // PayPal payment flow
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${process.env.CLIENT_URL}/payment-return`,
          cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: courseTitle,
                  sku: courseId,
                  price: coursePricing,
                  currency: "INR",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "INR",
              total: coursePricing.toFixed(2),
            },
            description: courseTitle,
          },
        ],
      };

      paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            success: false,
            message: "Error while creating PayPal payment!",
          });
        } else {
          const approveUrl = paymentInfo.links.find(
            (link) => link.rel == "approval_url"
          ).href;

          res.status(201).json({
            success: true,
            data: {
              approveUrl,
              orderId: newlyCreatedCourseOrder._id,
              paymentMethod: "paypal"
            },
          });
        }
      });
    } else if (paymentMethod === "razorpay" || paymentMethod === "upi") {
      // Razorpay payment flow (includes UPI)
      console.log(`Creating ${paymentMethod} order with Razorpay`);

      // Ensure course pricing is a valid number and at least 1 (for testing)
      let amount = Number(coursePricing);
      if (isNaN(amount) || amount <= 0) {
        console.log('Invalid course pricing:', coursePricing, 'Setting default amount of 100');
        amount = 100; // Default to 100 rupees for testing if price is invalid
      }

      const options = {
        amount: amount * 100, // Razorpay amount in paise
        currency: "INR",
        receipt: `receipt_${newlyCreatedCourseOrder._id}`,
        payment_capture: 1, // Auto-capture payment
      };

      console.log('Razorpay order options:', options);

      try {
        console.log('Creating Razorpay order...');
        const razorpayOrder = await razorpay.orders.create(options);
        console.log('Razorpay order created:', razorpayOrder);

        const responseData = {
          orderId: newlyCreatedCourseOrder._id,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          paymentMethod: paymentMethod,
          key: process.env.RAZORPAY_KEY_ID,
          courseTitle,
          userEmail,
          userName
        };

        console.log('Sending response to client:', responseData);

        res.status(201).json({
          success: true,
          data: responseData,
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          message: "Error while creating Razorpay order!",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const capturePaymentAndFinalizeOrder = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    await order.save();

    //update out student course model
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });

    if (studentCourses) {
      studentCourses.courses.push({
        courseId: order.courseId,
        title: order.courseTitle,
        instructorId: order.instructorId,
        instructorName: order.instructorName,
        dateOfPurchase: order.orderDate,
        courseImage: order.courseImage,
      });

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [
          {
            courseId: order.courseId,
            title: order.courseTitle,
            instructorId: order.instructorId,
            instructorName: order.instructorName,
            dateOfPurchase: order.orderDate,
            courseImage: order.courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    //update the course schema students
    const updatedCourse = await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    }, { new: true });

    // Create activity record for this enrollment
    const newActivity = new Activity({
      type: "enrollment",
      userId: order.userId,
      userName: order.userName,
      userEmail: order.userEmail,
      instructorId: updatedCourse.instructorId,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      date: new Date()
    });
    await newActivity.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    console.log('Verifying Razorpay payment:', req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Find the order in our database
    let order = await Order.findById(orderId);

    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: "Order cannot be found",
      });
    }

    console.log('Order found:', order);

    // Verify the payment signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log('Generated signature:', generatedSignature);
    console.log('Received signature:', razorpay_signature);

    // If signature verification fails
    if (generatedSignature !== razorpay_signature) {
      console.log('Signature verification failed');
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    console.log('Signature verification successful');

    // Update order status
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = razorpay_payment_id;
    order.payerId = razorpay_order_id; // Using this field to store Razorpay order ID

    await order.save();

    // Update student courses
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });

    if (studentCourses) {
      studentCourses.courses.push({
        courseId: order.courseId,
        title: order.courseTitle,
        instructorId: order.instructorId,
        instructorName: order.instructorName,
        dateOfPurchase: order.orderDate,
        courseImage: order.courseImage,
      });

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [
          {
            courseId: order.courseId,
            title: order.courseTitle,
            instructorId: order.instructorId,
            instructorName: order.instructorName,
            dateOfPurchase: order.orderDate,
            courseImage: order.courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    // Update the course schema students
    const updatedCourse = await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    }, { new: true });

    // Create activity record for this enrollment
    const newActivity = new Activity({
      type: "enrollment",
      userId: order.userId,
      userName: order.userName,
      userEmail: order.userEmail,
      instructorId: updatedCourse.instructorId,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      date: new Date()
    });
    await newActivity.save();

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed",
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = { createOrder, capturePaymentAndFinalizeOrder, verifyRazorpayPayment };
