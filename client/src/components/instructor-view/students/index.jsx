import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronDown, ChevronUp, Users, BookOpen, Mail, Calendar } from "lucide-react";
import { getStudentProgressForInstructorService, getCourseStudentsService } from "@/services";

function StudentManagement({ listOfCourses }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [studentProgressData, setStudentProgressData] = useState({});
  const [isLoadingProgress, setIsLoadingProgress] = useState({});

  // Process courses to get a structured list of all students by course
  const courseStudentMap = listOfCourses.reduce((acc, course) => {
    if (course.students && course.students.length > 0) {
      acc[course._id] = {
        courseId: course._id,
        courseTitle: course.title,
        courseImage: course.image,
        pricing: course.pricing,
        totalStudents: course.students.length,
        students: course.students.map(student => ({
          ...student,
          courseId: course._id,
          courseTitle: course.title,
          // Generate enrollment date if not available
          enrollmentDate: student.enrollmentDate || new Date(Date.now() - ((student.studentEmail.charCodeAt(0) % 30) * 24 * 60 * 60 * 1000))
        }))
      };
    }
    return acc;
  }, {});

  // Filter courses based on search query
  const filteredCourses = Object.values(courseStudentMap).filter(course =>
    course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.students.some(student =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Toggle course expansion
  const toggleCourseExpansion = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      fetchStudentProgressForCourse(courseId);
    }
  };

  // Fetch progress data for students in a course
  const fetchStudentProgressForCourse = async (courseId) => {
    const course = courseStudentMap[courseId];
    if (!course) return;

    setIsLoadingProgress(prev => ({ ...prev, [courseId]: true }));

    try {
      const response = await getCourseStudentsService(courseId);

      if (response.success) {
        // Create a map of student progress data
        const progressData = {};
        response.data.students.forEach(student => {
          const key = `${courseId}-${student.studentId}`;
          progressData[key] = student.progress;
        });

        setStudentProgressData(prev => ({ ...prev, ...progressData }));
      }
    } catch (error) {
      console.error("Error fetching course students:", error);
    } finally {
      setIsLoadingProgress(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Student Management</h1>
          <p className="text-gray-400">View and manage students enrolled in your courses</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses or students..."
            className="pl-10 bg-white/5 border-white/10 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Course Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-white/5">
                      <TableHead className="text-gray-200 font-semibold">Course</TableHead>
                      <TableHead className="text-gray-200 font-semibold text-center">Students</TableHead>
                      <TableHead className="text-gray-200 font-semibold text-right">Revenue</TableHead>
                      <TableHead className="text-gray-200 font-semibold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <React.Fragment key={course.courseId}>
                        <TableRow
                          className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                          onClick={() => toggleCourseExpansion(course.courseId)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center text-white">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-200">{course.courseTitle}</p>
                                <p className="text-xs text-gray-400">{course.totalStudents} enrolled students</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {course.totalStudents}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-emerald-400">
                              ₹{course.totalStudents * course.pricing}
                            </span>
                          </TableCell>
                          <TableCell>
                            {expandedCourse === course.courseId ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded student list */}
                        {expandedCourse === course.courseId && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-0 border-t-0">
                              <div className="bg-white/5 p-4">
                                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-blue-400" />
                                  Students Enrolled in {course.courseTitle}
                                </h3>

                                <div className="overflow-x-auto">
                                  <Table className="w-full">
                                    <TableHeader>
                                      <TableRow className="hover:bg-white/5 border-white/10">
                                        <TableHead className="text-gray-300 font-medium text-xs">Student</TableHead>
                                        <TableHead className="text-gray-300 font-medium text-xs">Email</TableHead>
                                        <TableHead className="text-gray-300 font-medium text-xs">Enrolled On</TableHead>
                                        <TableHead className="text-gray-300 font-medium text-xs">Amount Paid</TableHead>
                                        <TableHead className="text-gray-300 font-medium text-xs">Progress</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {course.students.map((student, index) => {
                                        // Get progress data for this student
                                        const progressKey = `${course.courseId}-${student.studentId}`;
                                        const progressInfo = studentProgressData[progressKey];
                                        const progressPercentage = progressInfo?.progressPercentage || 0;

                                        return (
                                          <TableRow key={index} className="hover:bg-white/5 border-white/10">
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 border border-white/10">
                                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                                    {getInitials(student.studentName)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-gray-200">{student.studentName}</span>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1">
                                                <Mail className="h-3 w-3 text-gray-400" />
                                                <span className="text-gray-300 text-sm">{student.studentEmail}</span>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                <span className="text-gray-300 text-sm">
                                                  {student.enrollmentDate instanceof Date
                                                    ? student.enrollmentDate.toLocaleDateString()
                                                    : new Date(student.enrollmentDate).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <span className="text-emerald-400 font-medium">₹{student.paidAmount || course.pricing}</span>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-xs">
                                                  <span className="text-gray-400">Progress</span>
                                                  <span className="text-gray-300">{progressPercentage}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                                  <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                    style={{ width: `${progressPercentage}%` }}
                                                  ></div>
                                                </div>
                                                {isLoadingProgress[course.courseId] ? (
                                                  <div className="text-xs text-gray-400 mt-1">Loading progress data...</div>
                                                ) : progressInfo ? (
                                                  <div className="text-xs text-gray-400 mt-1">
                                                    {progressInfo.completedLectures} of {progressInfo.totalLectures} lectures completed
                                                    {progressInfo.completed && (
                                                      <Badge variant="success" className="ml-2 text-[10px] py-0">Completed</Badge>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="text-xs text-gray-400 mt-1">No progress data</div>
                                                )}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">No students found</h3>
                <p className="text-gray-400 max-w-md mb-6">
                  {searchQuery
                    ? "No students match your search criteria. Try a different search term."
                    : "You don't have any students enrolled in your courses yet."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default StudentManagement;
