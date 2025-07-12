import InstructorCourses from "@/components/instructor-view/courses";
import InstructorDashboard from "@/components/instructor-view/dashboard";
import StudentManagement from "@/components/instructor-view/students";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import { fetchInstructorCourseListService, getInstructorActivitiesService, getUnreadActivitiesCountService, markActivitiesAsReadService } from "@/services";
import { BarChart, Book, LogOut, Settings, Users, PlusCircle, HelpCircle, Bell, Award, UserCircle } from "lucide-react";
import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function InstructorDashboardpage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { resetCredentials, auth } = useContext(AuthContext);
  const { instructorCoursesList, setInstructorCoursesList } =
    useContext(InstructorContext);
  const navigate = useNavigate();

  // Handle click outside to close notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  async function fetchAllCourses() {
    if (!auth?.user?._id) return;

    const response = await fetchInstructorCourseListService(auth.user._id);
    if (response?.success) setInstructorCoursesList(response?.data);
  }

  useEffect(() => {
    // Only fetch courses and notifications when auth is available
    if (auth?.user?._id) {
      fetchAllCourses();
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [auth?.user?._id]);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!auth?.user?._id) return;

    try {
      setIsLoadingNotifications(true);
      const response = await getInstructorActivitiesService(auth.user._id, 10);
      if (response.success) {
        setNotifications(response.data);
        setNotificationsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Function to fetch unread count
  const fetchUnreadCount = async () => {
    if (!auth?.user?._id) return;

    try {
      const response = await getUnreadActivitiesCountService(auth.user._id);
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const menuItems = [
    {
      icon: BarChart,
      label: "Dashboard",
      value: "dashboard",
      component: <InstructorDashboard listOfCourses={instructorCoursesList} />,
    },
    {
      icon: Book,
      label: "Courses",
      value: "courses",
      component: <InstructorCourses listOfCourses={instructorCoursesList} />,
    },
    {
      icon: Users,
      label: "Students",
      value: "students",
      component: <StudentManagement listOfCourses={instructorCoursesList} />,
    },
  ];

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markActivitiesAsReadService([notificationId]);

      if (response.success) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId ?
              { ...notification, read: true } :
              notification
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;

    try {
      // Get IDs of all unread notifications
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification._id);

      if (unreadIds.length === 0) return;

      console.log("Marking as read:", unreadIds);

      // Call API to mark as read
      const response = await markActivitiesAsReadService(unreadIds);

      if (response.success) {
        console.log("Successfully marked as read");

        // Update local state to mark all notifications as read
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            read: true
          }))
        );

        // Update unread count
        setUnreadCount(0);

        // Close the notification dropdown
        setShowNotifications(false);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  function handleLogout() {
    // Clear session storage first
    sessionStorage.removeItem('accessToken');
    sessionStorage.clear();

    // Then reset credentials
    resetCredentials();

    // Use window.location for a hard redirect
    window.location.href = '/auth';
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!auth?.user?.userName) return "I";
    return auth.user.userName.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-full min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_100px,rgba(120,119,198,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_600px,rgba(78,161,255,0.1),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-72 bg-white/5 backdrop-blur-md hidden md:block border-r border-white/10 z-10"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Book className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Instructor Hub</h2>
          </div>

          <nav className="space-y-1 flex-1">
            <div className="mb-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
            {menuItems.slice(0, 2).map((menuItem) => (
              <button
                key={menuItem.value}
                onClick={() => setActiveTab(menuItem.value)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  activeTab === menuItem.value
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <menuItem.icon className="h-5 w-5" />
                <span>{menuItem.label}</span>
              </button>
            ))}

            <div className="mb-4 mt-8 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</div>
            {menuItems.slice(2).map((menuItem) => (
              <button
                key={menuItem.value}
                onClick={() => setActiveTab(menuItem.value)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  activeTab === menuItem.value
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <menuItem.icon className="h-5 w-5" />
                <span>{menuItem.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Need help?</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Contact our support team for assistance with your courses.</p>
            </div>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="sticky top-0 z-10 bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-4"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              {activeTab === "dashboard" ? "Dashboard Overview" : "Course Management"}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Notification button with dropdown */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-300 hover:text-white hover:bg-white/10 relative"
                  onClick={() => {
                    if (!showNotifications) {
                      // Refresh notifications when opening the dropdown
                      fetchNotifications();
                    }
                    setShowNotifications(!showNotifications);
                  }}
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {/* Notification indicator */}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 ring-2 ring-white/10 flex items-center justify-center text-xs text-white font-medium">
                    {unreadCount}
                  </span>
                )}

                {/* Notification dropdown - rendered at the root level */}
                {showNotifications && createPortal(
                  <div className="fixed right-12 top-16 w-80 rounded-md shadow-lg py-1 bg-gray-800/95 backdrop-blur-md border border-white/20 max-h-[400px] overflow-y-auto" style={{ maxHeight: '70vh', zIndex: 99999 }}>
                    <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-white">Notifications</h3>
                      <Badge variant="info" className="text-xs">{notifications.length} Total</Badge>
                    </div>

                    {isLoadingNotifications ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-400">Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-3 hover:bg-white/5 transition-colors ${!notification.read ? 'bg-white/5' : ''}`}
                            onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
                                notification.type === 'enrollment' ? 'bg-blue-500/20' :
                                notification.type === 'completion' ? 'bg-green-500/20' :
                                'bg-purple-500/20'
                              }`}>
                                {notification.type === 'enrollment' ? (
                                  <Users className="h-4 w-4 text-blue-400" />
                                ) : notification.type === 'completion' ? (
                                  <Award className="h-4 w-4 text-green-400" />
                                ) : (
                                  <BookOpen className="h-4 w-4 text-purple-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-200">
                                  <span className="font-medium">{notification.userName}</span>
                                  {notification.type === 'enrollment' ? ' enrolled in ' :
                                   notification.type === 'completion' ? ' completed ' :
                                   ' viewed a lecture in '}
                                  <span className="font-medium">{notification.courseTitle}</span>
                                  {notification.type === 'lecture_view' && notification.lectureTitle && (
                                    <span className="text-gray-400"> ({notification.lectureTitle})</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.date).toLocaleDateString()} at {new Date(notification.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-400">No notifications yet</p>
                        <p className="text-xs text-gray-400">When students enroll or complete courses, you'll see notifications here.</p>
                      </div>
                    )}

                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-white/10">
                        <button
                          className="text-xs text-blue-400 hover:text-blue-300 w-full text-center py-1 px-2 rounded hover:bg-white/5 transition-colors"
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>,
                  document.body
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs border border-white/20 hover:border-white/40 transition-colors cursor-pointer">
                      {auth?.user?.profilePicture ? (
                        <img
                          src={auth.user.profilePicture}
                          alt={auth.user.userName || 'Instructor'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      )}
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800/95 backdrop-blur-md border border-white/10 text-white shadow-xl">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <UserCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{auth?.user?.userName || 'Instructor'}</p>
                        <p className="text-xs text-white/60 leading-none mt-1">{auth?.user?.userEmail || 'instructor@example.com'}</p>
                      </div>
                    </div>
                    <div className="p-2 text-xs bg-white/5 mx-2 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Account Type:</span>
                        <span className="text-white font-medium">Instructor</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Courses:</span>
                        <span className="text-white font-medium">{instructorCoursesList?.length || 0}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      onClick={() => navigate('/instructor/profile-settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-red-400 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="relative z-10"
          >
            {menuItems.map((menuItem) => (
              menuItem.component && (
                <TabsContent
                  key={menuItem.value}
                  value={menuItem.value}
                  className="mt-0 animate-in fade-in-50 duration-300"
                >
                  {menuItem.component}
                </TabsContent>
              )
            ))}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

export default InstructorDashboardpage;
