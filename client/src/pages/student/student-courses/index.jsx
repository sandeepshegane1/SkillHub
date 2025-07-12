import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import { fetchStudentBoughtCoursesService } from "@/services";
import { generateCertificateService } from "@/services/certificate-service";
import { Award, BookOpen, Clock, Play, ChevronRight, Check } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Progress } from "@/components/ui/progress";

function StudentCoursesPage() {
  const { auth } = useContext(AuthContext);
  const { studentBoughtCoursesList, setStudentBoughtCoursesList } =
    useContext(StudentContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [generatingCertificateFor, setGeneratingCertificateFor] = useState(null);

  async function fetchStudentBoughtCourses() {
    try {
      setIsLoading(true);
      console.log('Fetching courses for user:', auth?.user?._id);
      const response = await fetchStudentBoughtCoursesService(auth?.user?._id);

      if (response?.success) {
        console.log('Courses fetched successfully:', response.data);
        // Log each course ID for debugging
        if (response.data && response.data.length > 0) {
          console.log('Course IDs from response:');
          response.data.forEach((course, index) => {
            console.log(`Course ${index + 1}: ID=${course.courseId}, Type=${typeof course.courseId}, Title=${course.title}`);
            console.log(`Course ${index + 1} image info:`, {
              courseImage: course.courseImage,
              image: course.image,
              hasImage: Boolean(course.courseImage || course.image)
            });

            // Check if title is missing
            if (!course.title) {
              console.error(`Course ${index + 1} is missing title:`, course);
            }

            // Check if image is missing
            if (!course.courseImage && !course.image) {
              console.error(`Course ${index + 1} is missing image:`, course);
            }
          });

          // Log the first course object in detail
          console.log('First course object details:', JSON.stringify(response.data[0], null, 2));
        }

        setStudentBoughtCoursesList(response?.data);
      } else {
        console.error('Failed to fetch courses:', response?.message);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Refresh course list when component mounts
  useEffect(() => {
    fetchStudentBoughtCourses();

    // Add event listener for page visibility changes
    // This will refresh the course list when the user returns to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing course list...');
        fetchStudentBoughtCourses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up event listener
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen pt-6 pb-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Hero section */}
      <div className="relative py-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0px,rgba(120,119,198,0.4),transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">My Learning Journey</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <p className="text-lg text-blue-200">Continue your education and track your progress</p>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => {
                  console.log('Refreshing course list...');
                  fetchStudentBoughtCourses();
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </span>
                )}
              </Button>
            </div>

            {studentBoughtCoursesList && studentBoughtCoursesList.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-300" />
                    <span className="text-white font-medium">{studentBoughtCoursesList.length} Courses</span>
                  </div>

                  {/* Completed courses */}
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <Check className="h-5 w-5 mr-2 text-green-400" />
                    <span className="text-white font-medium">
                      {studentBoughtCoursesList.filter(course => course.completed || course.progress >= 100).length} Completed
                    </span>
                  </div>

                  {/* In progress courses */}
                  <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <Play className="h-5 w-5 mr-2 text-blue-300" />
                    <span className="text-white font-medium">
                      {studentBoughtCoursesList.filter(course => course.progress > 0 && course.progress < 100 && !course.completed).length} In Progress
                    </span>
                  </div>
                </div>

                {/* Overall progress */}
                {studentBoughtCoursesList.length > 0 && (
                  <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>Overall Learning Progress</span>
                      <span>
                        {Math.round(
                          studentBoughtCoursesList.reduce((acc, course) => acc + (course.progress || 0), 0) /
                          studentBoughtCoursesList.length
                        )}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round(
                        studentBoughtCoursesList.reduce((acc, course) => acc + (course.progress || 0), 0) /
                        studentBoughtCoursesList.length
                      )}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Filter options */}
        {!isLoading && studentBoughtCoursesList && studentBoughtCoursesList.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => setFilterStatus('all')}
              className={`border border-white/20 ${filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              All Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilterStatus('in-progress')}
              className={`border border-white/20 ${filterStatus === 'in-progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <Play className="h-4 w-4 mr-2" /> In Progress
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilterStatus('completed')}
              className={`border border-white/20 ${filterStatus === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <Check className="h-4 w-4 mr-2" /> Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilterStatus('not-started')}
              className={`border border-white/20 ${filterStatus === 'not-started' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              New Courses
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-md">
                <div className="p-0">
                  <div className="h-48 w-full bg-white/10 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 w-3/4 bg-white/10 animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-white/10 animate-pulse mb-4" />
                    <div className="h-8 w-full bg-white/10 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : studentBoughtCoursesList && studentBoughtCoursesList.length > 0 ? (
          <>
            {studentBoughtCoursesList
              .filter(course => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'completed') return course.completed || course.progress >= 100;
                if (filterStatus === 'in-progress') return course.progress > 0 && course.progress < 100 && !course.completed;
                if (filterStatus === 'not-started') return course.progress === 0;
                return true;
              }).length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {filterStatus === 'completed' ? (
                        <Check className="h-8 w-8 text-green-400" />
                      ) : filterStatus === 'in-progress' ? (
                        <Play className="h-8 w-8 text-blue-400" />
                      ) : (
                        <BookOpen className="h-8 w-8 text-purple-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No {filterStatus !== 'all' ? filterStatus.replace('-', ' ') : ''} courses found</h3>
                    <p className="text-white/70 mb-6">
                      {filterStatus === 'completed' ?
                        "You haven't completed any courses yet. Keep learning!" :
                        filterStatus === 'in-progress' ?
                        "You don't have any courses in progress. Start learning!" :
                        filterStatus === 'not-started' ?
                        "You've started all your new courses. Great job!" :
                        "You don't have any courses yet. Explore our catalog!"}
                    </p>
                    <Button
                      onClick={() => setFilterStatus('all')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
                    >
                      View All Courses
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studentBoughtCoursesList
                    .filter(course => {
                      if (filterStatus === 'all') return true;
                      if (filterStatus === 'completed') return course.completed || course.progress >= 100;
                      if (filterStatus === 'in-progress') return course.progress > 0 && course.progress < 100 && !course.completed;
                      if (filterStatus === 'not-started') return course.progress === 0;
                      return true;
                    })
                    .map((course, index) => (
              <motion.div
                key={course.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="relative">
                    <img
                      key={`${course?.courseId}-${Date.now()}`} // Add a key with timestamp to force re-render when image changes
                      src={`${course?.courseImage || course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'}?t=${new Date().getTime()}`}
                      alt={course?.title}
                      className="w-full h-48 object-cover transition-transform duration-700 hover:scale-110"
                      onError={(e) => {
                        console.log('Image failed to load:', course?.courseImage || course?.image);
                        e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
                      }}
                      // Add cache-busting query parameter to prevent browser caching
                      onLoad={() => console.log(`Image loaded successfully for course: ${course?.title}`)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <div className="p-4 w-full">
                        <div className="flex justify-between items-center w-full">
                          <div className="bg-blue-600/90 text-white text-xs font-medium px-2 py-1 rounded">
                            {`${Math.round(course?.progress || 0)}% Complete`}
                          </div>
                          {course?.lastAccessed && (
                            <div className="bg-white/90 text-blue-600 text-xs font-medium px-2 py-1 rounded flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(course.lastAccessed).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white">
                      {course?.title || course?._doc?.title || "Course Title Not Available"}
                      {!course?.title && !course?._doc?.title && console.log("Course title missing:", course)}
                    </h3>
                    <p className="text-sm text-white/70 mb-3">
                      {course?.instructorName}
                    </p>

                    <div className="mt-auto">
                      <div className="mb-2">
                        <Progress
                          value={course?.progress || 0}
                          className="h-2"
                          indicatorClassName={`${course?.progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
                        />
                        {(course?.completed || course?.progress >= 100) && (
                          <div className="mt-1 text-xs text-green-400 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            Course completed
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-white/60 mb-4">
                        <span className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${course?.progress > 0 ? 'bg-green-500' : 'bg-blue-500'} mr-1`}></div>
                          {course?.progress || 0}% complete
                        </span>
                        <span>{course?.completedLectures || 0}/{course?.totalLectures || 0} lectures</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        // Log detailed information about the course ID
                        console.log('Course object:', course);
                        console.log(`Navigating to course: ID=${course?.courseId}, Type=${typeof course?.courseId}`);

                        // Ensure the ID is a string and properly formatted
                        if (!course?.courseId) {
                          console.error('Course ID is missing or undefined');
                          alert('Error: Course ID is missing. Please try again later.');
                          return;
                        }

                        const formattedId = course.courseId.toString().trim();
                        console.log('Formatted course ID:', formattedId);

                        // Navigate to the course progress page
                        navigate(`/course-progress/${formattedId}`);
                      }}
                      className={`w-full border border-white/20 ${(course?.completed || course?.progress >= 100) ?
                        'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' :
                        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'} text-white`}
                    >
                      {(course?.completed || course?.progress >= 100) ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Review Course
                        </>
                      ) : course?.progress > 0 ? (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Continue Learning
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Start Learning
                        </>
                      )}
                    </Button>

                    {/* Certificate download button for completed courses */}
                    {(course?.completed || course?.progress >= 100) && (
                      <Button
                        onClick={async () => {
                          setGeneratingCertificateFor(course.courseId);
                          try {
                            console.log('Generating certificate from student courses page:', course);
                            if (!auth?.user?._id || !course.courseId) {
                              console.error('Missing required data for certificate generation:', {
                                userId: auth?.user?._id,
                                courseId: course.courseId
                              });
                              alert('Missing required information for certificate generation. Please try again.');
                              return;
                            }

                            // Ensure courseId is properly formatted
                            const formattedCourseId = course.courseId.toString().trim();
                            console.log(`Formatted courseId: ${formattedCourseId}`);

                            await generateCertificateService(
                              auth?.user?._id,
                              formattedCourseId
                            );
                          } catch (error) {
                            console.error("Error generating certificate:", error);
                            alert(`Failed to generate certificate: ${error.message || 'Unknown error'}. Please try again.`);
                          } finally {
                            setGeneratingCertificateFor(null);
                          }
                        }}
                        disabled={generatingCertificateFor === course.courseId}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
                      >
                        {generatingCertificateFor === course.courseId ? (
                          "Generating Certificate..."
                        ) : (
                          <>
                            <Award className="mr-2 h-4 w-4" /> Get Certificate
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
                    ))}
                </div>
              )}
            </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-lg">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">Your Learning Journey Awaits</h2>
              <p className="text-white/70 mb-6">
                You haven't enrolled in any courses yet. Explore our catalog and start learning today!
              </p>
              <Button
                onClick={() => navigate("/courses")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 border border-white/20"
              >
                Browse Courses <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default StudentCoursesPage;
