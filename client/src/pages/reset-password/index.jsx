import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleResetPassword, resetPasswordStatus } = useContext(AuthContext);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: false, error: null });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setStatus({ 
        success: false, 
        error: "Invalid or missing reset token. Please request a new password reset link." 
      });
    }
  }, [location.search]);

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    
    setLoading(true);
    try {
      const success = await handleResetPassword(token, newPassword);
      setStatus({ 
        success, 
        error: success ? null : "Failed to reset password. The link may have expired." 
      });
      
      if (success) {
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      }
    } catch (error) {
      setStatus({ 
        success: false, 
        error: error.message || "An error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background bubbles (same as auth page) */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full opacity-20 animate-float-1"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-purple-400 rounded-full opacity-20 animate-float-2"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-400 rounded-full opacity-20 animate-float-3"></div>
        <div className="absolute top-1/4 right-1/3 w-56 h-56 bg-indigo-400 rounded-full opacity-20 animate-float-4"></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-violet-400 rounded-full opacity-20 animate-float-5"></div>
      </div>

      <header className="relative z-10 px-4 lg:px-6 h-14 flex items-center border-b bg-white/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold text-xl">SkillHub</span>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm shadow-lg max-w-md w-full">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 mr-2" 
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Reset Your Password</CardTitle>
            </div>
            <CardDescription>
              Create a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start mb-4">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">Password Reset Successful!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your password has been reset successfully. You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>
            ) : status.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start mb-4">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{status.error}</p>
                </div>
              </div>
            ) : null}

            {!status.success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading || status.success}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || status.success}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !token || status.success}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-0">
            <Button 
              variant="link" 
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
