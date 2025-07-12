import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordForm({ onBack }) {
  const { handleForgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const success = await handleForgotPassword(email);
      setStatus({ success, error: success ? null : "Failed to send reset email. Please try again." });
    } catch (error) {
      setStatus({ success: false, error: error.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2" 
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Reset Password</CardTitle>
        </div>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start mb-4">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Reset link sent!</p>
              <p className="text-green-700 text-sm mt-1">
                Please check your email for instructions to reset your password.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !email || status.success}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
