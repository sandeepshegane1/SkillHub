import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

export default function OTPVerification() {
  const { otpVerification, setOtpVerification, handleVerifyOTP, handleResendOTP } = useContext(AuthContext);

  if (!otpVerification.show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
        <p className="text-gray-600 mb-6">
          Please enter the verification code sent to {otpVerification.email}
        </p>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter OTP"
            value={otpVerification.otp}
            onChange={(e) =>
              setOtpVerification((prev) => ({ ...prev, otp: e.target.value }))
            }
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
          <div className="flex gap-3">
            <Button
              className="w-full"
              onClick={handleVerifyOTP}
              disabled={otpVerification.loading || !otpVerification.otp}
            >
              {otpVerification.loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={otpVerification.loading}
            >
              Resend OTP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}