import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
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
  getCourseRatingsService,
  addToCartService,
} from "@/services";
import { motion } from "framer-motion";
import { CheckCircle, Globe, Lock, PlayCircle, Clock, BookOpen, Users, Star, Award, ChevronRight, Calendar, BarChart } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Utility function to format seconds into hours, minutes and seconds
function formatDuration(seconds) {
  // Convert to number if it's a string
  if (typeof seconds === 'string') {
    seconds = parseFloat(seconds);
  }

  // Handle invalid or zero duration
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    console.log('Invalid duration value:', seconds);
    return "Duration unavailable";
  }

  console.log('Formatting duration:', seconds, 'seconds');

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const seconds_remaining = Math.floor(seconds % 60);

  // If total duration is very short (less than 1 minute)
  if (hours === 0 && minutes === 0) {
    return seconds_remaining > 0 ? `${seconds_remaining} sec` : "< 1 min";
  }

  // Format the duration in a user-friendly way
  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`;
  } else {
    return `${minutes} min`;
  }
}

function ModernCourseDetailsPage() {
  const {
    studentViewCourseDetails,
    setStudentViewCourseDetails,
    currentCourseDetailsId,
    setCurrentCourseDetailsId,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);

  const { auth } = useContext(AuthContext);

  const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] = useState(null);
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [razorpayData, setRazorpayData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [courseRatings, setCourseRatings] = useState({ ratings: [], averageRating: 0, totalRatings: 0 });
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();

  async function fetchStudentViewCourseDetails() {
    try {
      setLoadingState(true);
      const response = await fetchStudentViewCourseDetailsService(currentCourseDetailsId);

      if (response?.success) {
        console.log('Course details received:', response?.data);
        console.log('Total duration:', response?.data?.totalDuration);
        if (response?.data?.curriculum && response?.data?.curriculum.length > 0) {
          console.log('First lecture duration:', response?.data?.curriculum[0]?.duration);
        }
        setStudentViewCourseDetails(response?.data);
      } else {
        setStudentViewCourseDetails(null);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setLoadingState(false);
    }
  }

  function handleSetFreePreview(curriculumItem) {
    setDisplayCurrentVideoFreePreview(curriculumItem.videoUrl);
    setShowFreePreviewDialog(true);
  }

  function handleShowPaymentOptions() {
    // Check if user is authenticated
    if (!auth?.authenticate || !auth?.user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/auth');
      return;
    }

    // For all courses, just show the payment dialog
    // The payment method will be selected in the dialog
    console.log('Showing payment options dialog');
    setShowPaymentDialog(true);
  }

  async function handleAddToCart() {
    // Check if user is authenticated
    if (!auth?.authenticate || !auth?.user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/auth');
      return;
    }

    try {
      setIsAddingToCart(true);
      const response = await addToCartService(auth.user._id, studentViewCourseDetails._id);

      if (response.success) {
        if (response.alreadyInCart) {
          // Course is already in cart - show friendly message
          toast({
            title: "Already in Cart",
            description: (
              <div>
                This course is already in your cart.{" "}
                <span
                  className="underline cursor-pointer text-blue-400"
                  onClick={() => navigate('/cart')}
                >
                  View Cart
                </span>
              </div>
            ),
          });
        } else {
          // Course was added successfully
          toast({
            title: "Added to cart",
            description: "Course has been added to your cart.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add course to cart.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  }

  async function handleCreatePayment(forcedMethod = null) {
    // Check if user is authenticated
    if (!auth?.authenticate || !auth?.user) {
      console.error('User is not authenticated');
      alert('Please login to purchase this course');
      navigate('/auth');
      return;
    }

    // Determine the payment method to use
    let methodToUse = forcedMethod || paymentMethod;
    console.log('Initial payment method:', methodToUse);

    // Ensure course pricing is a valid number
    let originalPrice = studentViewCourseDetails?.pricing;
    let coursePricing = originalPrice;
    let isFree = false;

    if (typeof coursePricing === 'string') {
      coursePricing = parseFloat(coursePricing);
      originalPrice = parseFloat(originalPrice);
    }

    // Apply discount if active
    if (studentViewCourseDetails?.discountActive &&
        studentViewCourseDetails?.discountPercentage > 0 &&
        !isNaN(coursePricing)) {
      const discountAmount = coursePricing * (studentViewCourseDetails.discountPercentage / 100);
      coursePricing = coursePricing - discountAmount;
      coursePricing = Math.round(coursePricing); // Round to nearest integer
      console.log(`Applied discount: ${studentViewCourseDetails.discountPercentage}%, ` +
                 `Original: ${originalPrice}, Discounted: ${coursePricing}`);
    }

    // Check if the course is free or price is 0 after discount
    if (isNaN(coursePricing) || coursePricing === null || coursePricing === undefined || coursePricing <= 0) {
      console.log('Course is free or has invalid pricing:', coursePricing);
      coursePricing = 0;
      isFree = true;
      // For free courses, use 'free' payment method
      methodToUse = 'free';
      // Update the state variable safely
      setPaymentMethod('free');
    }

    console.log('Payment method:', methodToUse, 'Is free:', isFree, 'Course pricing:', coursePricing);

    // Create the payment payload
    const paymentPayload = {
      userId: auth?.user?._id,
      userName: auth?.user?.userName,
      userEmail: auth?.user?.userEmail,
      orderStatus: "pending",
      paymentMethod: methodToUse, // Use the local variable instead of the state variable
      paymentStatus: "initiated",
      orderDate: new Date(),
      paymentId: "",
      payerId: "",
      courseId: studentViewCourseDetails?._id,
      courseTitle: studentViewCourseDetails?.title,
      courseImage: studentViewCourseDetails?.image,
      instructorId: studentViewCourseDetails?.instructorId,
      instructorName: studentViewCourseDetails?.instructorName,
      amount: coursePricing.toString(), // Add amount parameter for server compatibility
      coursePricing: coursePricing.toString(), // Keep coursePricing for backward compatibility
      originalPrice: originalPrice.toString(), // Store the original price
      discountPercentage: studentViewCourseDetails?.discountPercentage || 0, // Store the discount percentage
      discountActive: studentViewCourseDetails?.discountActive || false // Store if discount was active
    };

    console.log('Payment payload:', paymentPayload);

    try {
      console.log('Sending payment request with payload:', paymentPayload);
      const response = await createPaymentService(paymentPayload);
      console.log('Payment response:', response);

      if (response?.success) {
        if (isFree || methodToUse === 'free') {
          // For free courses, redirect to student courses page
          console.log('Free course enrollment successful:', response.data);
          // Show a success message before redirecting
          toast({
            title: "Enrollment Successful",
            description: "You have been enrolled in this free course.",
            variant: "default",
          });
          // Redirect to student courses page
          setTimeout(() => {
            navigate('/student-courses');
          }, 1500);
        } else if (methodToUse === 'paypal') {
          // For PayPal, redirect to PayPal approval URL
          setApprovalUrl(response?.data?.approvalUrl);
          sessionStorage.setItem("currentOrderId", JSON.stringify(response?.data?.orderId));
        } else if (methodToUse === 'razorpay' || methodToUse === 'upi') {
          // For Razorpay or UPI, open Razorpay checkout
          console.log('Payment response:', response?.data);
          setRazorpayData(response?.data);

          // Store order ID in session storage for verification later
          sessionStorage.setItem("currentOrderId", JSON.stringify(response?.data?.orderId));

          const options = {
            key: response?.data?.key,
            amount: response?.data?.amount,
            currency: response?.data?.currency,
            name: "SkillHub",
            description: `Payment for ${studentViewCourseDetails?.title}`,
            order_id: response?.data?.razorpayOrderId,
            handler: function (razorpayResponse) {
              // Handle successful payment
              console.log('Payment successful:', razorpayResponse);
              console.log('Order ID from session storage:', response?.data?.orderId);

              // Make sure the order ID is in the URL for verification
              const redirectUrl = `/payment-success?razorpay_payment_id=${razorpayResponse.razorpay_payment_id}&razorpay_order_id=${razorpayResponse.razorpay_order_id}&razorpay_signature=${razorpayResponse.razorpay_signature}&orderId=${response?.data?.orderId}`;
              window.location.href = redirectUrl;
            },
            prefill: {
              name: auth?.user?.userName,
              email: auth?.user?.userEmail,
            },
            theme: {
              color: "#3399cc",
            },
          };

          // Add UPI specific options if UPI is selected
          if (paymentMethod === 'upi') {
            options.method = 'upi';
            options.upi = {
              flow: 'collect',
              vpa: '', // User will enter their UPI ID
            };
          }

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
      }
    } catch (error) {
      console.error("Error creating payment:", error);

      // Show a user-friendly error message
      toast({
        title: "Error",
        description: "There was an error processing your enrollment. Please try again later.",
        variant: "destructive",
      });

      // If this is a free course, try to handle the error gracefully
      if (isFree || methodToUse === 'free') {
        console.log('Error enrolling in free course, but redirecting to courses page anyway');
        setTimeout(() => {
          navigate('/student-courses');
        }, 2000);
      }
    }
  }

  async function fetchCourseRatings() {
    if (!currentCourseDetailsId) return;

    try {
      setIsLoadingRatings(true);
      const response = await getCourseRatingsService(currentCourseDetailsId);
      if (response.success) {
        setCourseRatings(response.data);
      }
    } catch (error) {
      console.error("Error fetching course ratings:", error);
    } finally {
      setIsLoadingRatings(false);
    }
  }

  useEffect(() => {
    if (currentCourseDetailsId !== null) {
      fetchStudentViewCourseDetails();
      fetchCourseRatings();
    }
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

  useEffect(() => {
    if (approvalUrl !== "") {
      window.location.href = approvalUrl;
    }
  }, [approvalUrl]);

  if (loadingState) {
    return (
      <div className="min-h-screen pt-6 pb-16 relative">
        {/* Background elements - these match the instructor dashboard */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="h-64 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-xl animate-pulse mb-8 border border-white/10"></div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3 space-y-6">
              <div className="h-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-pulse"></div>
              <div className="h-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-pulse"></div>
            </div>
            <div className="w-full lg:w-1/3">
              <div className="h-96 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getIndexOfFreePreviewUrl = studentViewCourseDetails !== null
    ? studentViewCourseDetails?.curriculum?.findIndex(item => item.freePreview)
    : -1;

  return (
    <div className="min-h-screen pt-6 pb-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Hero section */}
      <div className="relative py-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0px,rgba(120,119,198,0.4),transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                {studentViewCourseDetails?.category}
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                {studentViewCourseDetails?.level?.toUpperCase()}
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {studentViewCourseDetails?.primaryLanguage}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {studentViewCourseDetails?.title}
            </h1>
            <p className="text-xl text-blue-100 mb-6">{studentViewCourseDetails?.subtitle}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-blue-100">Students</p>
                  <p className="font-bold">
                    {studentViewCourseDetails?.students?.length || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-blue-100">Lectures</p>
                  <p className="font-bold">
                    {studentViewCourseDetails?.curriculum?.length || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-blue-100">Created</p>
                  <p className="font-bold">
                    {studentViewCourseDetails?.date ? new Date(studentViewCourseDetails.date).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-blue-100">Instructor</p>
                  <p className="font-bold">
                    {studentViewCourseDetails?.instructorName}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-2/3"
          >
            {/* What you'll learn */}
            <Card className="mb-8 border border-white/10 shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5 text-blue-400" />
                  What you'll learn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentViewCourseDetails?.objectives
                    .split(",")
                    .map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-white/80">{objective.trim()}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            {/* Course Description */}
            <Card className="mb-8 border border-white/10 shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-invert max-w-none">
                  {studentViewCourseDetails?.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-white/80">{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            <Card className="mb-8 border border-white/10 shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart className="h-5 w-5 text-blue-400" />
                  Course Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-white/10">
                  {studentViewCourseDetails?.curriculum?.map(
                    (curriculumItem, index) => (
                      <motion.li
                        whileHover={{ backgroundColor: curriculumItem?.freePreview ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }}
                        className={`${curriculumItem?.freePreview ? "cursor-pointer" : "cursor-not-allowed"} flex items-center justify-between p-4`}
                        key={index}
                        onClick={() => {
                          if (curriculumItem?.freePreview) {
                            handleSetFreePreview(curriculumItem);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${curriculumItem?.freePreview ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                            {curriculumItem?.freePreview ? (
                              <PlayCircle className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Lock className="h-4 w-4 text-white/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {index + 1}. {curriculumItem?.title}
                            </p>
                            <p className="text-sm text-white/60 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(curriculumItem?.duration)}
                              {/* Debug info */}
                              {process.env.NODE_ENV === 'development' && (
                                <span className="ml-2 text-xs text-blue-400">
                                  ({curriculumItem?.duration || 0}s)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {curriculumItem?.freePreview && (
                          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none">
                            Preview
                          </Badge>
                        )}
                      </motion.li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="mb-8 border border-white/10 shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Star className="h-5 w-5 text-blue-400" />
                  Student Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingRatings ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
                  </div>
                ) : courseRatings.ratings.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-white/10 p-4 rounded-lg text-center min-w-[100px]">
                        <div className="text-3xl font-bold text-white mb-1">{courseRatings.averageRating}</div>
                        <div className="flex justify-center mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(courseRatings.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 fill-gray-400/30'}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-white/60">{courseRatings.totalRatings} {courseRatings.totalRatings === 1 ? 'rating' : 'ratings'}</div>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 mb-2">Rating Breakdown</p>
                        {[5, 4, 3, 2, 1].map(num => {
                          const count = courseRatings.ratings.filter(r => r.rating === num).length;
                          const percentage = courseRatings.totalRatings > 0 ? (count / courseRatings.totalRatings) * 100 : 0;
                          return (
                            <div key={num} className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1 w-12">
                                <span className="text-white/80">{num}</span>
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-white/60 w-10 text-right">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Recent Reviews</h3>
                      {courseRatings.ratings.slice(0, 5).map((review, index) => (
                        <div key={index} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-white">{review.userName}</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 fill-gray-400/30'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-white/60">
                              {new Date(review.date).toLocaleDateString()}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-white/80 text-sm mt-2">{review.review}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto text-white/20 mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No Reviews Yet</h3>
                    <p className="text-white/60">Be the first to review this course after enrollment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full lg:w-1/3"
          >
            <div className="sticky top-24">
              <Card className="border border-white/10 shadow-xl overflow-hidden bg-white/5 backdrop-blur-sm">
                <div className="relative aspect-video overflow-hidden border-b border-white/10">
                  <VideoPlayer
                    url={
                      getIndexOfFreePreviewUrl !== -1
                        ? studentViewCourseDetails?.curriculum[
                            getIndexOfFreePreviewUrl
                          ].videoUrl
                        : ""
                    }
                    width="100%"
                    height="100%"
                  />
                  {getIndexOfFreePreviewUrl === -1 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <Lock className="h-12 w-12 mx-auto mb-2 opacity-70" />
                        <p>Preview not available</p>
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      {parseFloat(studentViewCourseDetails?.pricing) <= 0 ? (
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          Free
                        </span>
                      ) : studentViewCourseDetails?.discountActive && studentViewCourseDetails?.discountPercentage > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              ₹{(studentViewCourseDetails?.pricing * (1 - studentViewCourseDetails?.discountPercentage / 100)).toFixed(0)}
                            </span>
                            <span className="text-lg line-through text-white/50">
                              ₹{studentViewCourseDetails?.pricing}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-green-400">
                            {studentViewCourseDetails?.discountPercentage}% off
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          ₹{studentViewCourseDetails?.pricing}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(courseRatings.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 fill-gray-400/30'}`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium text-white/80">
                        {courseRatings.averageRating > 0 ? courseRatings.averageRating : 'No ratings'}
                        {courseRatings.totalRatings > 0 && (
                          <span className="text-white/60 ml-1">({courseRatings.totalRatings})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <span className="text-white/80">
                        {studentViewCourseDetails?.curriculum?.length || 0} lectures
                        {studentViewCourseDetails?.totalDuration > 0 ?
                          `(${formatDuration(studentViewCourseDetails?.totalDuration)} total)` :
                          '(0 min total)'}
                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <span className="block text-xs text-blue-400 mt-1">
                            Raw duration: {studentViewCourseDetails?.totalDuration || 0} seconds
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-400" />
                      <span className="text-white/80">Certificate of completion</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      <span className="text-white/80">Full lifetime access</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        // Check if course is free or has a 100% discount
                        const pricing = parseFloat(studentViewCourseDetails?.pricing);
                        let isFree = isNaN(pricing) || pricing <= 0;

                        // Check if there's a 100% discount
                        if (!isFree &&
                            studentViewCourseDetails?.discountActive &&
                            studentViewCourseDetails?.discountPercentage >= 100) {
                          isFree = true;
                        }

                        if (isFree) {
                          // For free courses, directly call handleCreatePayment with 'free' parameter
                          console.log('Free course detected, enrolling directly');
                          handleCreatePayment('free');
                        } else {
                          // For paid courses, show payment options
                          handleShowPaymentOptions();
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                    >
                      {parseFloat(studentViewCourseDetails?.pricing) <= 0 ||
                       (studentViewCourseDetails?.discountActive && studentViewCourseDetails?.discountPercentage >= 100) ?
                        "Enroll for Free" :
                        "Buy Now"
                      }
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>

                    {parseFloat(studentViewCourseDetails?.pricing) > 0 &&
                     !(studentViewCourseDetails?.discountActive && studentViewCourseDetails?.discountPercentage >= 100) && (
                      <Button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        variant="outline"
                        className="w-full py-4 border-white/20 text-white hover:bg-white/10 hover:text-white"
                      >
                        {isAddingToCart ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding to Cart...
                          </span>
                        ) : (
                          <span>Add to Cart</span>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
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
        <DialogContent className="w-[800px] max-w-[90vw] bg-indigo-950/90 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Course Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
            <VideoPlayer
              url={displayCurrentVideoFreePreview}
              width="100%"
              height="100%"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowFreePreviewDialog(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Options Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowPaymentDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-indigo-950/90 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                <RadioGroupItem value="paypal" id="paypal" className="text-blue-400 border-white/30" />
                <Label htmlFor="paypal" className="flex-1 cursor-pointer text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">PayPal</span>
                    <img src="/paypal-logo.png" alt="PayPal" className="h-6" />
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                <RadioGroupItem value="razorpay" id="razorpay" className="text-blue-400 border-white/30" />
                <Label htmlFor="razorpay" className="flex-1 cursor-pointer text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Credit/Debit Card</span>
                    <img src="/razorpay-logo.png" alt="Razorpay" className="h-6" />
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                <RadioGroupItem value="upi" id="upi" className="text-blue-400 border-white/30" />
                <Label htmlFor="upi" className="flex-1 cursor-pointer text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">UPI</span>
                    <img src="/upi-logo.png" alt="UPI" className="h-6" />
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Close the dialog
                setShowPaymentDialog(false);
                // Call handleCreatePayment with the selected payment method
                handleCreatePayment(paymentMethod);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default ModernCourseDetailsPage;
