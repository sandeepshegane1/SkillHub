import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  createPaymentService,
  fetchStudentViewCourseDetailsService,
} from "@/services";
import { motion } from "framer-motion";
import { CheckCircle, Globe, Lock, PlayCircle, Clock, BookOpen, Users, Star, Award, ChevronRight, Calendar, BarChart } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Utility function to format seconds into hours, minutes and seconds
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0 min";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`;
  } else {
    return `${minutes} min`;
  }
}

function StudentViewCourseDetailsPage() {
  const {
    studentViewCourseDetails,
    setStudentViewCourseDetails,
    currentCourseDetailsId,
    setCurrentCourseDetailsId,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);

  const { auth } = useContext(AuthContext);

  const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] =
    useState(null);
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [razorpayData, setRazorpayData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  async function fetchStudentViewCourseDetails() {
    // const checkCoursePurchaseInfoResponse =
    //   await checkCoursePurchaseInfoService(
    //     currentCourseDetailsId,
    //     auth?.user._id
    //   );

    // if (
    //   checkCoursePurchaseInfoResponse?.success &&
    //   checkCoursePurchaseInfoResponse?.data
    // ) {
    //   navigate(`/course-progress/${currentCourseDetailsId}`);
    //   return;
    // }

    const response = await fetchStudentViewCourseDetailsService(
      currentCourseDetailsId
    );

    if (response?.success) {
      setStudentViewCourseDetails(response?.data);
      setLoadingState(false);
    } else {
      setStudentViewCourseDetails(null);
      setLoadingState(false);
    }
  }

  function handleSetFreePreview(getCurrentVideoInfo) {
    console.log(getCurrentVideoInfo);
    setDisplayCurrentVideoFreePreview(getCurrentVideoInfo?.videoUrl);
  }

  function handleShowPaymentOptions() {
    console.log('Buy Now/Enroll button clicked');
    // First check if user is authenticated
    if (!auth?.authenticate) {
      alert('Please login to access this course');
      navigate('/auth');
      return;
    }

    // Check if course is free
    let coursePricing = studentViewCourseDetails?.pricing;
    if (typeof coursePricing === 'string') {
      coursePricing = parseFloat(coursePricing);
    }

    const isFree = isNaN(coursePricing) || coursePricing <= 0;

    if (isFree) {
      // For free courses, directly call handleCreatePayment
      handleCreatePayment();
    } else {
      // For paid courses, show payment options dialog
      setTimeout(() => {
        setShowPaymentDialog(true);
        console.log('Payment dialog should be visible now');
      }, 100);
    }
  }

  async function handleCreatePayment() {
    // Check if user is authenticated
    if (!auth?.authenticate || !auth?.user) {
      console.error('User is not authenticated');
      alert('Please login to purchase this course');
      navigate('/auth');
      return;
    }

    console.log('Creating payment with method:', paymentMethod);
    console.log('Course details:', studentViewCourseDetails);
    console.log('Course pricing:', studentViewCourseDetails?.pricing, 'Type:', typeof studentViewCourseDetails?.pricing);

    // Ensure course pricing is a valid number
    let coursePricing = studentViewCourseDetails?.pricing;
    let isFree = false;

    if (typeof coursePricing === 'string') {
      coursePricing = parseFloat(coursePricing);
    }

    // Check if the course is free
    if (isNaN(coursePricing) || coursePricing <= 0) {
      console.log('Course is free');
      coursePricing = 0;
      isFree = true;
    }

    const paymentPayload = {
      userId: auth?.user?._id,
      userName: auth?.user?.userName,
      userEmail: auth?.user?.userEmail,
      orderStatus: "pending",
      paymentMethod: paymentMethod,
      paymentStatus: "initiated",
      orderDate: new Date(),
      paymentId: "",
      payerId: "",
      instructorId: studentViewCourseDetails?.instructorId,
      instructorName: studentViewCourseDetails?.instructorName,
      courseImage: studentViewCourseDetails?.image,
      courseTitle: studentViewCourseDetails?.title,
      courseId: studentViewCourseDetails?._id,
      coursePricing: coursePricing, // Use the validated pricing
    };

    console.log(paymentPayload, "paymentPayload");

    // Handle free courses differently
    if (isFree) {
      console.log('Processing free course enrollment');
      // Set payment method to 'free'
      paymentPayload.paymentMethod = 'free';
      paymentPayload.paymentStatus = 'paid';
      paymentPayload.orderStatus = 'confirmed';
    }

    const response = await createPaymentService(paymentPayload);

    if (response.success) {
      // For free courses, redirect directly to courses page
      if (isFree) {
        console.log('Free course enrollment successful');
        window.location.href = '/student-courses';
        return;
      }

      sessionStorage.setItem(
        "currentOrderId",
        JSON.stringify(response?.data?.orderId)
      );

      if (paymentMethod === "paypal") {
        setApprovalUrl(response?.data?.approveUrl);
      } else if (paymentMethod === "razorpay" || paymentMethod === "upi") {
        // Handle Razorpay payment
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "LMS Course",
          description: response.data.courseTitle,
          order_id: response.data.razorpayOrderId,
          prefill: {
            name: response.data.userName,
            email: response.data.userEmail,
          },
          handler: function(razorpayResponse) {
            // Handle successful payment
            console.log('Razorpay payment successful:', razorpayResponse);
            const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));
            console.log('Order ID from session storage:', orderId);

            // Verify the payment on the server using the verifyRazorpayPaymentService
            import("@/services").then(({ verifyRazorpayPaymentService }) => {
              verifyRazorpayPaymentService({
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                orderId: orderId
              })
              .then(data => {
                console.log('Payment verification response:', data);
                if (data.success) {
                  // Payment verified successfully
                  sessionStorage.removeItem("currentOrderId");
                  window.location.href = '/student-courses';
                } else {
                  // Payment verification failed
                  alert('Payment verification failed. Please try again.');
                }
              })
              .catch(error => {
                console.error('Payment verification error:', error);
                alert('An error occurred during payment verification. Please contact support.');
              });
            });
          },
          theme: {
            color: "#3399cc",
          },
        };

        // Load Razorpay script dynamically if not already loaded
        if (window.Razorpay) {
          console.log('Razorpay already loaded, opening checkout');
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        } else {
          console.log('Loading Razorpay script');
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => {
            console.log('Razorpay script loaded');
            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
          };
          document.body.appendChild(script);
        }
      }

      setShowPaymentDialog(false);
    }
  }

  useEffect(() => {
    if (displayCurrentVideoFreePreview !== null) setShowFreePreviewDialog(true);
  }, [displayCurrentVideoFreePreview]);

  useEffect(() => {
    if (currentCourseDetailsId !== null) fetchStudentViewCourseDetails();
  }, [currentCourseDetailsId]);

  useEffect(() => {
    if (id) setCurrentCourseDetailsId(id);
  }, [id]);

  useEffect(() => {
    if (!location.pathname.includes("course/details")) {
      setStudentViewCourseDetails(null);
      setCurrentCourseDetailsId(null);
    }
  }, [location.pathname]);

  if (loadingState) return <Skeleton />;

  useEffect(() => {
    if (approvalUrl !== "") {
      window.location.href = approvalUrl;
    }
  }, [approvalUrl]);

  const getIndexOfFreePreviewUrl =
    studentViewCourseDetails !== null
      ? studentViewCourseDetails?.curriculum?.findIndex(
          (item) => item.freePreview
        )
      : -1;

  return (
    <div className=" mx-auto p-4">
      <div className="bg-gray-900 text-white p-8 rounded-t-lg">
        <h1 className="text-3xl font-bold mb-4">
          {studentViewCourseDetails?.title}
        </h1>
        <p className="text-xl mb-4">{studentViewCourseDetails?.subtitle}</p>
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <span>Created By {studentViewCourseDetails?.instructorName}</span>
          <span>Created On {studentViewCourseDetails?.date.split("T")[0]}</span>
          <span className="flex items-center">
            <Globe className="mr-1 h-4 w-4" />
            {studentViewCourseDetails?.primaryLanguage}
          </span>
          <span>
            {studentViewCourseDetails?.students.length}{" "}
            {studentViewCourseDetails?.students.length <= 1
              ? "Student"
              : "Students"}
          </span>
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {formatDuration(studentViewCourseDetails?.totalDuration)}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8 mt-8">
        <main className="flex-grow">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What you'll learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {studentViewCourseDetails?.objectives
                  .split(",")
                  .map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>{studentViewCourseDetails?.description}</CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {studentViewCourseDetails?.curriculum?.map(
                (curriculumItem, index) => (
                  <li
                    key={index}
                    className={`${
                      curriculumItem?.freePreview
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    } flex items-center justify-between mb-4 p-2 hover:bg-gray-100/5 rounded-md`}
                    onClick={
                      curriculumItem?.freePreview
                        ? () => handleSetFreePreview(curriculumItem)
                        : null
                    }
                  >
                    <div className="flex items-center">
                      {curriculumItem?.freePreview ? (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Lock className="mr-2 h-4 w-4" />
                      )}
                      <span>{curriculumItem?.title}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{formatDuration(curriculumItem?.duration || 0)}</span>
                    </div>
                  </li>
                )
              )}
            </CardContent>
          </Card>
        </main>
        <aside className="w-full md:w-[500px]">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="aspect-video mb-4 rounded-lg flex items-center justify-center">
                <VideoPlayer
                  url={
                    getIndexOfFreePreviewUrl !== -1
                      ? studentViewCourseDetails?.curriculum[
                          getIndexOfFreePreviewUrl
                        ].videoUrl
                      : ""
                  }
                  width="450px"
                  height="200px"
                />
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  {parseFloat(studentViewCourseDetails?.pricing) <= 0 ?
                    "Free" :
                    `₹${studentViewCourseDetails?.pricing}`
                  }
                </span>
              </div>
              <Button
                onClick={handleShowPaymentOptions}
                className="w-full"
              >
                {parseFloat(studentViewCourseDetails?.pricing) <= 0 ?
                  "Enroll for Free" :
                  "Buy Now"
                }
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      {/* Free Preview Dialog */}
      <Dialog
        open={showFreePreviewDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowFreePreviewDialog(false);
            setDisplayCurrentVideoFreePreview(null);
          }
        }}
      >
        <DialogContent className="w-[800px]">
          <DialogHeader>
            <DialogTitle>Course Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video rounded-lg flex items-center justify-center">
            <VideoPlayer
              url={displayCurrentVideoFreePreview}
              width="450px"
              height="200px"
            />
          </div>
          <div className="flex flex-col gap-2">
            {studentViewCourseDetails?.curriculum
              ?.filter((item) => item.freePreview)
              .map((filteredItem) => (
                <p
                  onClick={() => handleSetFreePreview(filteredItem)}
                  className="cursor-pointer text-[16px] font-medium"
                >
                  {filteredItem?.title}
                </p>
              ))}
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          console.log('Dialog open state changed to:', open);
          setShowPaymentDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center cursor-pointer">
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-6 mr-2" />
                  PayPal
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="razorpay" id="razorpay" />
                <Label htmlFor="razorpay" className="flex items-center cursor-pointer">
                  <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-6 mr-2" />
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center cursor-pointer">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6 mr-2" />
                  UPI
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button onClick={handleCreatePayment} className="w-full">
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseDetailsPage;
