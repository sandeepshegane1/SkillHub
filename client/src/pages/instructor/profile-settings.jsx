import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, User, Pencil, Camera, Mail, UserCircle, Shield, X, Check, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { updateUserProfileService, changePasswordService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { auth, checkAuthUser } = useContext(AuthContext);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState({
    userName: false,
    userEmail: false,
    profilePicture: false
  });
  const [profileData, setProfileData] = useState({
    userName: "",
    userEmail: "",
    profilePicture: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!profileData.userName) return "U";
    return profileData.userName.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    if (auth?.user) {
      setProfileData({
        userName: auth.user.userName || "",
        userEmail: auth.user.userEmail || "",
        profilePicture: auth.user.profilePicture || "",
      });
    }
  }, [auth?.user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleEditMode = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const cancelEdit = (field) => {
    // Reset the field to its original value
    setProfileData(prev => ({
      ...prev,
      [field]: auth.user[field] || ""
    }));

    // Turn off edit mode
    setEditMode(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePasswordService(auth.user._id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully.",
        });

        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        // Switch back to profile tab
        setActiveTab("profile");
      } else {
        toast({
          title: "Password change failed",
          description: response.message || "Failed to change password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "An error occurred while changing your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormSubmitted(true);

    try {
      console.log('Submitting profile update for user ID:', auth.user._id);
      console.log('Profile data being sent:', profileData);

      const response = await updateUserProfileService(auth.user._id, profileData);
      console.log('Profile update response:', response);

      if (response.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        // Refresh auth context to get updated user data
        await checkAuthUser();

        // Navigate back to dashboard after successful update
        setTimeout(() => {
          navigate('/instructor');
        }, 1500);
      } else {
        toast({
          title: "Update failed",
          description: response.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/instructor")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-white hidden md:block">Account Settings</h1>

          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-3"
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative group mb-4">
                    <Avatar className="h-32 w-32 border-4 border-white/10 group-hover:border-white/30 transition-all duration-300">
                      {profileData.profilePicture ? (
                        <AvatarImage src={profileData.profilePicture} alt={profileData.userName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <button
                      onClick={() => toggleEditMode('profilePicture')}
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-white mt-2">{profileData.userName || 'Instructor'}</h2>
                  <p className="text-white/60 text-sm">{profileData.userEmail || 'instructor@example.com'}</p>

                  <div className="mt-4 bg-white/10 w-full rounded-md p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Account Type</span>
                      <span className="text-white font-medium">Instructor</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <TabsList className="w-full bg-white/5 border border-white/10 flex overflow-hidden p-0.5">
                <TabsTrigger
                  value="profile"
                  className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-3 py-2"
                >
                  <UserCircle className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Profile</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-3 py-2"
                >
                  <Shield className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Security</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-9"
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  {activeTab === 'profile' ? 'Profile Information' : 'Security Settings'}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {activeTab === 'profile'
                    ? 'Update your personal information and profile picture'
                    : 'Manage your password and security preferences'}
                </CardDescription>
              </CardHeader>

              <TabsContent value="profile" className="m-0">
                <CardContent className="p-6 space-y-6">
                  {/* Profile Picture URL Field */}
                  {editMode.profilePicture && (
                    <div className="space-y-3 bg-white/10 p-4 rounded-lg border border-white/20 animate-in fade-in-50 duration-300">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="profilePicture" className="text-white font-medium">Profile Picture URL</Label>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-white/10"
                            onClick={() => cancelEdit('profilePicture')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-white/10"
                            onClick={() => toggleEditMode('profilePicture')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        id="profilePicture"
                        name="profilePicture"
                        placeholder="https://example.com/your-image.jpg"
                        value={profileData.profilePicture || ""}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        autoFocus
                      />
                      <p className="text-xs text-white/50">Enter a URL for your profile picture</p>
                    </div>
                  )}

                  {/* Username Field */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="userName" className="text-white font-medium">Username</Label>
                      {!editMode.userName ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={() => toggleEditMode('userName')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-white/10"
                            onClick={() => cancelEdit('userName')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-white/10"
                            onClick={() => toggleEditMode('userName')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editMode.userName ? (
                      <Input
                        id="userName"
                        name="userName"
                        placeholder="Your username"
                        value={profileData.userName || ""}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                        autoFocus
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                        {profileData.userName || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="userEmail" className="text-white font-medium">Email Address</Label>
                      {!editMode.userEmail ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={() => toggleEditMode('userEmail')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-white/10"
                            onClick={() => cancelEdit('userEmail')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-white/10"
                            onClick={() => toggleEditMode('userEmail')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editMode.userEmail ? (
                      <Input
                        id="userEmail"
                        name="userEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={profileData.userEmail || ""}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                        autoFocus
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-white/50" />
                        {profileData.userEmail || 'Not set'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="security" className="m-0">
                <CardContent className="p-6 space-y-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Change Password</h3>
                      <p className="text-sm text-white/70">Ensure your account is using a strong, secure password.</p>

                      {/* Current Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showPasswords.currentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPasswords.currentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-red-400 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      {/* New Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-white">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showPasswords.newPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="Enter your new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('newPassword')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPasswords.newPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-red-400 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {passwordErrors.newPassword}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="Confirm your new password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPasswords.confirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-red-400 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {passwordErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Changing Password...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Lock className="mr-2 h-4 w-4" />
                            Change Password
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </TabsContent>

              <CardFooter className="border-t border-white/10 p-6">
                <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => navigate("/instructor")}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
        </Tabs>
      </div>
    </div>
  );
}

export default ProfileSettingsPage;
