import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { 
  checkAuthService, 
  loginService, 
  registerService, 
  forgotPasswordService, 
  resetPasswordService,
  verifyOTPService,
  sendVerificationOTPService 
} from "@/services";
import { createContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const { toast } = useToast();
  const [signInFormData, setSignInFormData] = useState({
    ...initialSignInFormData,
    rememberMe: false
  });
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [otpVerification, setOtpVerification] = useState({
    show: false,
    email: "",
    otp: "",
    loading: false
  });
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetPasswordStatus, setResetPasswordStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

  async function handleRegisterUser(event) {
    event.preventDefault();
    try {
      const data = await registerService(signUpFormData);
      if (data.success) {
        setOtpVerification(prev => ({
          ...prev,
          show: true,
          email: signUpFormData.userEmail
        }));
        toast({
          title: "Success",
          description: data.message,
        });
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    }
  }

  async function handleVerifyOTP() {
    try {
      setOtpVerification(prev => ({ ...prev, loading: true }));
      console.log('Verifying OTP:', { email: otpVerification.email, otp: otpVerification.otp });
      const data = await verifyOTPService(otpVerification.email, otpVerification.otp);
      if (data.success) {
        toast({
          title: "Success",
          description: "Email verified successfully! Please sign in.",
        });
        setOtpVerification({
          show: false,
          email: "",
          otp: "",
          loading: false
        });
        return true;
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      const errorMessage = error.response?.data?.message || "OTP verification failed. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    } finally {
      setOtpVerification(prev => ({ ...prev, loading: false }));
    }
  }

  async function handleResendOTP() {
    try {
      console.log('Resending OTP to:', otpVerification.email);
      const data = await sendVerificationOTPService(otpVerification.email);
      if (data.success) {
        toast({
          title: "Success",
          description: "OTP sent successfully!",
        });
        return true;
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      const errorMessage = error.response?.data?.message || "Failed to send OTP. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    }
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    const data = await loginService(signInFormData);
    console.log(data, "datadatadatadatadataaaaaaaa");

    if (data.success) {
      // Store token in localStorage if rememberMe is checked, otherwise in sessionStorage
      const storage = signInFormData.rememberMe ? localStorage : sessionStorage;

      storage.setItem(
        "accessToken",
        JSON.stringify(data.data.accessToken)
      );

      setAuth({
        authenticate: true,
        user: data.data.user,
      });
    } else {
      setAuth({
        authenticate: false,
        user: null,
      });
    }
  }

  //check auth user

  async function checkAuthUser() {
    try {
      const data = await checkAuthService();
      if (data.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
        setLoading(false);
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      if (!error?.response?.data?.success) {
        setAuth({
          authenticate: false,
          user: null,
        });
        setLoading(false);
      }
    }
  }

  function resetCredentials() {
    // Clear both localStorage and sessionStorage
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");

    setAuth({
      authenticate: false,
      user: null,
    });
  }

  async function handleForgotPassword(email) {
    try {
      setResetPasswordStatus({ loading: true, success: false, error: null });
      const response = await forgotPasswordService(email);
      if (response.success) {
        setResetPasswordStatus({ loading: false, success: true, error: null });
        return true;
      } else {
        setResetPasswordStatus({ loading: false, success: false, error: response.message });
        return false;
      }
    } catch (error) {
      setResetPasswordStatus({ loading: false, success: false, error: error.message || "An error occurred" });
      return false;
    }
  }

  async function handleResetPassword(token, newPassword) {
    try {
      setResetPasswordStatus({ loading: true, success: false, error: null });
      const response = await resetPasswordService(token, newPassword);
      if (response.success) {
        setResetPasswordStatus({ loading: false, success: true, error: null });
        return true;
      } else {
        setResetPasswordStatus({ loading: false, success: false, error: response.message });
        return false;
      }
    } catch (error) {
      setResetPasswordStatus({ loading: false, success: false, error: error.message || "An error occurred" });
      return false;
    }
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
          signInFormData,
          setSignInFormData,
          signUpFormData,
          setSignUpFormData,
          auth,
          setAuth,
          loading,
          handleRegisterUser,
          handleLoginUser,
          handleForgotPassword,
          handleResetPassword,
          forgotPasswordEmail,
          setForgotPasswordEmail,
          resetPasswordStatus,
          otpVerification,
          setOtpVerification,
          handleVerifyOTP,
          handleResendOTP,
        }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}
