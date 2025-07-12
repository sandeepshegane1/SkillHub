import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { captureAndFinalizePaymentService, verifyRazorpayPaymentService } from "@/services";

function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing payment...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentType = searchParams.get("type");

    console.log('Payment success page loaded');
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Payment type:', paymentType);

    const verifyPayment = async () => {
      try {
        // Check for Razorpay parameters directly in the URL
        const razorpay_payment_id = searchParams.get("razorpay_payment_id");
        const razorpay_order_id = searchParams.get("razorpay_order_id");
        const razorpay_signature = searchParams.get("razorpay_signature");

        // Get orderId from URL first, then from session storage as fallback
        let orderId = searchParams.get("orderId");
        if (!orderId) {
          try {
            orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));
            console.log('Retrieved order ID from session storage:', orderId);
          } catch (e) {
            console.error('Error retrieving order ID from session storage:', e);
          }
        }

        console.log('Payment verification parameters:', {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          orderId
        });

        // Check if we have all required parameters
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          console.error('Missing Razorpay parameters');
          setMessage("Missing payment parameters. Please try again or contact support.");
          return;
        }

        if (!orderId) {
          console.error('Missing order ID');
          setMessage("Order information not found. Please contact support.");
          return;
        }

        // All parameters are present, proceed with verification
        console.log('Verifying Razorpay payment...');
        const response = await verifyRazorpayPaymentService({
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          orderId
        });

        if (response?.success) {
          setIsSuccess(true);
          setMessage("Payment successful! Redirecting to your courses...");
          // Clear the order ID from session storage
          sessionStorage.removeItem("currentOrderId");
          setTimeout(() => {
            navigate("/student-courses");
          }, 2000);
        } else {
          console.error('Payment verification failed:', response);
          setMessage("Payment verification failed. Please contact support.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setMessage("An error occurred during payment verification.");
      }
    };

    verifyPayment();
  }, [location, navigate]);

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className={isSuccess ? "text-green-600" : "text-blue-600"}>
          {isSuccess ? "Payment Successful!" : "Processing Payment"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{message}</p>
        {isSuccess && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">You will be redirected to your courses shortly.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentSuccessPage;
