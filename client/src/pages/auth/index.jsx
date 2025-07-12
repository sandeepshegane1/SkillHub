
import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import CommonForm from "@/components/common-form";
import ForgotPasswordForm from "@/components/auth/forgot-password";
import OTPVerification from "@/components/auth/otp-verification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInFormControls, signUpFormControls } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const {
    signInFormData,
    setSignInFormData,
    signUpFormData,
    setSignUpFormData,
    handleRegisterUser,
    handleLoginUser,
  } = useContext(AuthContext);

  function handleTabChange(value) {
    setActiveTab(value);
  }

  function handleRoleChange(value) {
    setSignUpFormData(prevData => ({
      ...prevData,
      userRole: value
    }));
  }

  // Modified handleRegisterUser to switch tabs after successful registration
  async function handleSignUp(event) {
    try {
      const success = await handleRegisterUser(event);
      if (success) {
        // Only switch to signin tab if registration was successful
        setActiveTab("signin");
      }
    } catch (error) {
      console.error("Registration failed", error);
    }
  }

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.password !== "" &&
      signUpFormData.userRole
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      <OTPVerification />
      <div className="absolute inset-0 overflow-hidden">
        {/* Each bubble has a unique color and size */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full opacity-20 animate-float-1"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-purple-400 rounded-full opacity-20 animate-float-2"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-400 rounded-full opacity-20 animate-float-3"></div>
        <div className="absolute top-1/4 right-1/3 w-56 h-56 bg-indigo-400 rounded-full opacity-20 animate-float-4"></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-violet-400 rounded-full opacity-20 animate-float-5"></div>
        <div className="absolute top-2/3 right-1/4 w-72 h-72 bg-fuchsia-400 rounded-full opacity-15 animate-float-6"></div>
        <div className="absolute top-1/2 left-20 w-24 h-24 bg-blue-300 rounded-full opacity-20 animate-float-7"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-300 rounded-full opacity-15 animate-float-8"></div>
        <div className="absolute top-1/3 right-20 w-36 h-36 bg-pink-300 rounded-full opacity-20 animate-float-9"></div>
        <div className="absolute top-3/4 left-1/4 w-44 h-44 bg-indigo-300 rounded-full opacity-20 animate-float-10"></div>
        <div className="absolute bottom-2/3 right-1/2 w-52 h-52 bg-violet-300 rounded-full opacity-20 animate-float-11"></div>
        <div className="absolute top-1/4 left-2/3 w-28 h-28 bg-fuchsia-300 rounded-full opacity-20 animate-float-12"></div>
        <div className="absolute top-2/3 left-1/3 w-60 h-60 bg-blue-200 rounded-full opacity-15 animate-float-13"></div>
        <div className="absolute bottom-1/2 right-1/4 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-float-14"></div>
        <div className="absolute top-1/2 right-2/3 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-float-15"></div>
        <div className="absolute bottom-1/3 left-1/2 w-68 h-68 bg-indigo-200 rounded-full opacity-15 animate-float-16"></div>
        <div className="absolute top-3/4 right-1/3 w-40 h-40 bg-violet-200 rounded-full opacity-20 animate-float-17"></div>
        <div className="absolute bottom-1/4 left-1/4 w-76 h-76 bg-fuchsia-200 rounded-full opacity-15 animate-float-18"></div>
        <div className="absolute top-1/4 right-1/2 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-float-19"></div>
        <div className="absolute bottom-2/3 left-2/3 w-44 h-44 bg-purple-100 rounded-full opacity-20 animate-float-20"></div>
      </div>

      <header className="relative z-10 px-4 lg:px-6 h-14 flex items-center border-b bg-white/60 backdrop-blur-sm shadow-sm">
        <Link to={"/"} className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold text-xl">SkillHub</span>
        </Link>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Tabs
          value={activeTab}
          defaultValue="signin"
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            {showForgotPassword ? (
              <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
            ) : (
              <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>Sign in to your account</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CommonForm
                    formControls={signInFormControls}
                    buttonText={"Sign In"}
                    formData={signInFormData}
                    setFormData={setSignInFormData}
                    isButtonDisabled={!checkIfSignInFormIsValid()}
                    handleSubmit={handleLoginUser}
                  />
                </CardContent>
                <CardFooter className="flex justify-end pt-2 pb-0">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="signup">
            <Card className="p-6 space-y-4 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Create a new account</CardTitle>
                <CardDescription>
                  Enter your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <Select
                    value={signUpFormData?.userRole || ""}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <CommonForm
                  formControls={signUpFormControls}
                  buttonText={"Sign Up"}
                  formData={signUpFormData}
                  setFormData={setSignUpFormData}
                  isButtonDisabled={!checkIfSignUpFormIsValid()}
                  handleSubmit={handleSignUp}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx="true">{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(120px, 60px) rotate(180deg); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-100px, 80px) rotate(-180deg); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(90px, -60px) rotate(180deg); }
        }

        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-80px, -40px) rotate(-180deg); }
        }

        @keyframes float-5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(70px, 50px) rotate(180deg); }
        }

        @keyframes float-6 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-60px, -70px) rotate(-180deg); }
        }

        @keyframes float-7 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(50px, -40px) rotate(180deg); }
        }

        @keyframes float-8 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-40px, 60px) rotate(-180deg); }
        }

        @keyframes float-9 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(60px, -50px) rotate(180deg); }
        }

        @keyframes float-10 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, 40px) rotate(-180deg); }
        }

        @keyframes float-11 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(110px, -70px) rotate(180deg); }
        }

        @keyframes float-12 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-90px, 65px) rotate(-180deg); }
        }

        @keyframes float-13 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(75px, -85px) rotate(180deg); }
        }

        @keyframes float-14 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-95px, -55px) rotate(-180deg); }
        }

        @keyframes float-15 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(85px, 75px) rotate(180deg); }
        }

        @keyframes float-16 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-70px, -90px) rotate(-180deg); }
        }

        @keyframes float-17 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(65px, -45px) rotate(180deg); }
        }

        @keyframes float-18 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-55px, 80px) rotate(-180deg); }
        }

        @keyframes float-19 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(100px, -60px) rotate(180deg); }
        }

        @keyframes float-20 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-85px, 70px) rotate(-180deg); }
        }

        .animate-float-1 { animation: float-1 20s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 23s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 25s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 22s ease-in-out infinite; }
        .animate-float-5 { animation: float-5 24s ease-in-out infinite; }
        .animate-float-6 { animation: float-6 21s ease-in-out infinite; }
        .animate-float-7 { animation: float-7 26s ease-in-out infinite; }
        .animate-float-8 { animation: float-8 19s ease-in-out infinite; }
        .animate-float-9 { animation: float-9 27s ease-in-out infinite; }
        .animate-float-10 { animation: float-10 21s ease-in-out infinite; }
        .animate-float-11 { animation: float-11 24s ease-in-out infinite; }
        .animate-float-12 { animation: float-12 22s ease-in-out infinite; }
        .animate-float-13 { animation: float-13 25s ease-in-out infinite; }
        .animate-float-14 { animation: float-14 23s ease-in-out infinite; }
        .animate-float-15 { animation: float-15 26s ease-in-out infinite; }
        .animate-float-16 { animation: float-16 20s ease-in-out infinite; }
        .animate-float-17 { animation: float-17 27s ease-in-out infinite; }
        .animate-float-18 { animation: float-18 22s ease-in-out infinite; }
        .animate-float-19 { animation: float-19 25s ease-in-out infinite; }
        .animate-float-20 { animation: float-20 24s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default AuthPage;