const Razorpay = require("razorpay");

console.log('Initializing Razorpay with keys:');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('Razorpay initialized');

module.exports = razorpay;
