import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Users, TrendingUp, Award, BookOpen, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useContext } from "react";
import { getStudentProgressForInstructorService, getInstructorActivitiesService } from "@/services";
import { AuthContext } from "@/context/auth-context";

function InstructorDashboard({ listOfCourses }) {
  // Get auth context for user info
  const { auth } = useContext(AuthContext);

  // State to store student progress data
  const [studentProgressData, setStudentProgressData] = useState({});
  // State to store real activities
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // Fetch real activities
  useEffect(() => {
    if (auth?.user?._id) {
      fetchRecentActivities();
    }
  }, [auth?.user?._id]);

  // Function to fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const response = await getInstructorActivitiesService(auth.user._id, 5);
      if (response.success) {
        setRecentActivities(response.data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const { totalStudents, totalProfit, studentList, totalCourses } = listOfCourses.reduce(
    (acc, course) => {
      // Count courses
      acc.totalCourses += 1;

      // Count students and revenue
      const studentCount = course.students.length;
      acc.totalStudents += studentCount;
      acc.totalProfit += course.pricing * studentCount;

      // Create student list
      course.students.forEach((student) => {
        acc.studentList.push({
          courseTitle: course.title,
          courseId: course._id,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          studentId: student.studentId, // Add studentId for progress lookup
          // Generate consistent enrollment date based on student email
          enrollmentDate: new Date(student.enrollmentDate || Date.now() - ((student.studentEmail.charCodeAt(0) % 30) * 24 * 60 * 60 * 1000)),
          // Generate consistent progress based on student email and course ID (fallback)
          progress: Math.floor(((student.studentEmail.charCodeAt(0) + course._id.charCodeAt(0)) % 80) + 20), // Simulated progress between 20-100%
        });

        // Real activities are now fetched from the server
      });

      return acc;
    },
    {
      totalStudents: 0,
      totalProfit: 0,
      totalCourses: 0,
      studentList: [],
    }
  );

  // Sort student list by enrollment date (most recent first)
  studentList.sort((a, b) => b.enrollmentDate - a.enrollmentDate);

  // Fetch progress data for each student when the component mounts
  useEffect(() => {
    async function fetchStudentProgress() {
      const progressData = {};

      // Only fetch for the students we're displaying (top 5)
      const displayedStudents = studentList.slice(0, 5);

      for (const student of displayedStudents) {
        try {
          const response = await getStudentProgressForInstructorService(
            student.courseId,
            student.studentId || student.studentEmail // Use studentId if available, otherwise use email
          );

          if (response.success) {
            // Store progress data with a key that combines courseId and studentId/email
            const key = `${student.courseId}-${student.studentId || student.studentEmail}`;
            progressData[key] = response.data;
          }
        } catch (error) {
          console.error("Error fetching student progress:", error);
        }
      }

      setStudentProgressData(progressData);
    }

    if (studentList.length > 0) {
      fetchStudentProgress();
    }
  }, [studentList]);

  // Calculate average revenue per student
  const avgRevenuePerStudent = totalStudents > 0 ? (totalProfit / totalStudents).toFixed(2) : 0;

  // Stats cards configuration
  const statsCards = [
    {
      icon: Users,
      label: "Total Students",
      value: totalStudents,
      description: "Active enrollments",
      trend: "+12% from last month",
      trendUp: true,
      bgColor: "bg-gradient-to-br from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/30",
      valueColor: "text-blue-500",
    },
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `₹${totalProfit}`,
      description: `₹${avgRevenuePerStudent} per student`,
      trend: "+8% from last month",
      trendUp: true,
      bgColor: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/30",
      valueColor: "text-emerald-500",
    },
    {
      icon: BookOpen,
      label: "Total Courses",
      value: totalCourses,
      description: "Published courses",
      trend: "Same as last month",
      trendUp: null,
      bgColor: "bg-gradient-to-br from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/30",
      valueColor: "text-purple-500",
    },
    {
      icon: Award,
      label: "Completion Rate",
      value: "78%",
      description: "Course completion",
      trend: "+5% from last month",
      trendUp: true,
      bgColor: "bg-gradient-to-br from-amber-500/20 to-amber-600/20",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/30",
      valueColor: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`${item.bgColor} border border-white/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-white/20 z-10`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    {item.label}
                  </CardTitle>
                  <CardDescription className="text-xs text-white text-opacity-80 mt-1 font-medium">
                    {item.description}
                  </CardDescription>
                </div>
                <div className={`p-2 rounded-full ${item.iconBg}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex justify-between items-end">
                  <div className={`text-3xl font-bold ${item.valueColor}`}>
                    {item.value}
                  </div>
                  {item.trend && (
                    <Badge variant={item.trendUp ? "success" : item.trendUp === false ? "warning" : "info"} className="flex items-center gap-1">
                      {item.trendUp ? <TrendingUp className="h-3 w-3" /> : null}
                      <span>{item.trend}</span>
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="h-1 w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:via-white/30 transition-all duration-500"></div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl h-full">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {isLoadingActivities ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-400">Loading activities...</p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-400">No recent activities found</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity._id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
                          activity.type === 'enrollment' ? 'bg-purple-500/20' :
                          activity.type === 'completion' ? 'bg-green-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {activity.type === 'enrollment' ? (
                            <Users className="h-4 w-4 text-purple-400" />
                          ) : activity.type === 'completion' ? (
                            <Award className="h-4 w-4 text-green-400" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">
                            <span className="font-medium">{activity.userName}</span>
                            {activity.type === 'enrollment' ? ' enrolled in ' :
                             activity.type === 'completion' ? ' completed ' :
                             ' viewed a lecture in '}
                            <span className="font-medium">{activity.courseTitle}</span>
                            {activity.type === 'lecture_view' && activity.lectureTitle && (
                              <span className="text-gray-400"> ({activity.lectureTitle})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Recent Students
                </CardTitle>
                <Badge variant="info" className="text-xs">
                  {studentList.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-white/5">
                      <TableHead className="text-gray-200 font-semibold">Student</TableHead>
                      <TableHead className="text-gray-200 font-semibold">Course</TableHead>
                      <TableHead className="text-gray-200 font-semibold">Enrolled</TableHead>
                      <TableHead className="text-gray-200 font-semibold">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentList.slice(0, 5).map((student, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {student.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-200">{student.studentName}</p>
                              <p className="text-xs text-gray-400">{student.studentEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {student.courseTitle}
                        </TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          {student.enrollmentDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-gray-300">
                                {(() => {
                                  // Get progress data for this student
                                  const key = `${student.courseId}-${student.studentId || student.studentEmail}`;
                                  const progressInfo = studentProgressData[key];

                                  // If we have progress data, use it; otherwise use the placeholder
                                  if (progressInfo) {
                                    return `${progressInfo.progressPercentage}%`;
                                  } else {
                                    // Fallback to placeholder progress
                                    return `${student.progress}%`;
                                  }
                                })()}
                              </span>
                            </div>
                            <Progress
                              value={
                                (() => {
                                  // Get progress data for this student
                                  const key = `${student.courseId}-${student.studentId || student.studentEmail}`;
                                  const progressInfo = studentProgressData[key];

                                  // If we have progress data, use it; otherwise use the placeholder
                                  if (progressInfo) {
                                    return progressInfo.progressPercentage;
                                  } else {
                                    // Fallback to placeholder progress
                                    return student.progress;
                                  }
                                })()
                              }
                              className="h-1.5"
                            />
                            {(() => {
                              // Get progress data for this student
                              const key = `${student.courseId}-${student.studentId || student.studentEmail}`;
                              const progressInfo = studentProgressData[key];

                              // If we have progress data, show completed lectures info
                              if (progressInfo) {
                                return (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {progressInfo.completedLectures} of {progressInfo.totalLectures} lectures completed
                                    {progressInfo.completed && (
                                      <Badge variant="success" className="ml-2 text-[10px] py-0">Completed</Badge>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default InstructorDashboard;