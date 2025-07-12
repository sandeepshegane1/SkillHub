import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthContext } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getUserCartService, removeFromCartService, clearCartService, createPaymentService } from "@/services";
import { motion } from "framer-motion";
import { ShoppingCart, Trash, X, ChevronLeft, CreditCard, Percent } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

function CartPage() {
  const { auth } = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate total price and discounted price
  const cartTotals = cart?.items?.reduce((totals, item) => {
    const originalPrice = parseFloat(item.pricing) || 0;
    let discountedPrice = originalPrice;

    // Apply discount if active
    if (item.discountActive && item.discountPercentage > 0) {
      discountedPrice = originalPrice * (1 - item.discountPercentage / 100);
      discountedPrice = Math.round(discountedPrice); // Round to nearest integer
    }

    return {
      originalTotal: totals.originalTotal + originalPrice,
      discountedTotal: totals.discountedTotal + discountedPrice,
      savedAmount: totals.savedAmount + (originalPrice - discountedPrice)
    };
  }, { originalTotal: 0, discountedTotal: 0, savedAmount: 0 }) || { originalTotal: 0, discountedTotal: 0, savedAmount: 0 };

  const totalPrice = cartTotals.discountedTotal;

  async function fetchCart() {
    if (!auth?.user?._id) return;

    try {
      setIsLoading(true);
      const response = await getUserCartService(auth.user._id);

      if (response.success) {
        setCart(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load cart. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading your cart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveFromCart(courseId) {
    try {
      setIsRemoving(true);
      const response = await removeFromCartService(auth.user._id, courseId);

      if (response.success) {
        setCart(response.data);
        toast({
          title: "Removed from cart",
          description: "Course has been removed from your cart.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove course from cart.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "An error occurred while removing from cart.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleClearCart() {
    try {
      setIsClearing(true);
      const response = await clearCartService(auth.user._id);

      if (response.success) {
        setCart(response.data);
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to clear cart.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "An error occurred while clearing your cart.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  }

  async function handleCheckout() {
    if (!auth?.authenticate || !auth?.user) {
      navigate('/auth');
      return;
    }

    if (!cart?.items?.length) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add courses before checkout.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentDialog(true);
  }

  async function processPayment() {
    try {
      setIsProcessingPayment(true);

      // Process each cart item as a separate order
      for (const item of cart.items) {
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
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          courseImage: item.courseImage,
          instructorId: item.instructorId,
          instructorName: item.instructorName,
          amount: item.pricing,
          coursePricing: item.pricing
        };

        const response = await createPaymentService(paymentPayload);

        if (response.success) {
          if (paymentMethod === 'paypal') {
            // For PayPal, redirect to PayPal approval URL
            setApprovalUrl(response?.data?.approvalUrl);
            sessionStorage.setItem("currentOrderId", JSON.stringify(response?.data?.orderId));
            // Break after first item for PayPal (will handle one at a time)
            break;
          } else if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
            // For Razorpay or UPI, open Razorpay checkout
            const options = {
              key: response?.data?.key,
              amount: response?.data?.amount,
              currency: response?.data?.currency,
              name: "SkillHub",
              description: `Payment for ${item.courseTitle}`,
              order_id: response?.data?.razorpayOrderId,
              handler: function (razorpayResponse) {
                // Handle successful payment
                console.log('Payment successful:', razorpayResponse);
                console.log('Order ID from session storage:', response?.data?.orderId);

                // Store order ID in session storage for verification
                sessionStorage.setItem("currentOrderId", JSON.stringify(response?.data?.orderId));

                // Redirect to payment success page with verification data
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
              const razorpayInstance = new window.Razorpay(options);
              razorpayInstance.open();
            } else {
              const script = document.createElement("script");
              script.src = "https://checkout.razorpay.com/v1/checkout.js";
              script.async = true;
              script.onload = () => {
                const razorpayInstance = new window.Razorpay(options);
                razorpayInstance.open();
              };
              document.body.appendChild(script);
            }

            // Break after first item for Razorpay (will handle one at a time)
            break;
          }
        }
      }

      // Close the dialog
      setShowPaymentDialog(false);

      // Clear the cart after successful checkout
      await handleClearCart();

    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  useEffect(() => {
    if (auth?.user?._id) {
      fetchCart();
    } else {
      setIsLoading(false);
    }
  }, [auth?.user?._id]);

  useEffect(() => {
    if (approvalUrl !== "") {
      window.location.href = approvalUrl;
    }
  }, [approvalUrl]);

  if (!auth?.authenticate) {
    return (
      <div className="min-h-screen pt-12 pb-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <h1 className="text-2xl font-bold text-white mb-2">Your Cart</h1>
            <p className="text-white/70 mb-6">Please sign in to view your cart</p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-16 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <h1 className="text-3xl font-bold text-white">Your Cart</h1>

            {cart?.items?.length > 0 && (
              <Button
                variant="outline"
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleClearCart}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Clearing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Trash className="mr-2 h-4 w-4" />
                    Clear Cart
                  </span>
                )}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
            </div>
          ) : cart?.items?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-xl text-white">
                      {cart.items.length} {cart.items.length === 1 ? 'Course' : 'Courses'} in Cart
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-white/10">
                      {cart.items.map((item, index) => (
                        <motion.li
                          key={item.courseId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-4"
                        >
                          <div className="flex gap-4">
                            <div className="w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={item.courseImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'}
                                alt={item.courseTitle}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <Link
                                to={`/course/details/${item.courseId}`}
                                className="text-lg font-medium text-white hover:text-blue-400 transition-colors"
                              >
                                {item.courseTitle}
                              </Link>
                              <p className="text-sm text-white/60">By {item.instructorName}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div>
                                  {item.discountActive && item.discountPercentage > 0 ? (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-blue-400">
                                          ₹{Math.round(item.pricing * (1 - item.discountPercentage / 100))}
                                        </p>
                                        <p className="text-sm line-through text-white/50">
                                          ₹{item.pricing}
                                        </p>
                                      </div>
                                      <div className="flex items-center text-xs text-green-400 gap-1">
                                        <Percent className="h-3 w-3" /> {item.discountPercentage}% off
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="font-bold text-blue-400">₹{item.pricing}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/60 hover:text-red-400 hover:bg-white/5"
                                  onClick={() => handleRemoveFromCart(item.courseId)}
                                  disabled={isRemoving}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden sticky top-24">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-xl text-white">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Subtotal</span>
                        <span className="text-white font-medium">₹{cartTotals.originalTotal.toFixed(2)}</span>
                      </div>

                      {cartTotals.savedAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-400 flex items-center gap-1">
                            <Percent className="h-4 w-4" /> Discount
                          </span>
                          <span className="text-green-400 font-medium">-₹{cartTotals.savedAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <Separator className="bg-white/10" />

                      <div className="flex justify-between items-center text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-blue-400">₹{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-white/10 p-4">
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Checkout
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-white/30" />
              <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
              <p className="text-white/70 mb-6">Looks like you haven't added any courses to your cart yet.</p>
              <Button
                onClick={() => navigate('/courses')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </div>

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
              onClick={processPayment}
              disabled={isProcessingPayment}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
            >
              {isProcessingPayment ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CartPage;
