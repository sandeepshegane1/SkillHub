import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import CourseRating from "@/components/course-rating";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  getCurrentCourseProgressService,
  markLectureAsViewedService,
  resetCourseProgressService,
  checkCoursePurchaseInfoService,
  fetchStudentBoughtCoursesService,
} from "@/services";
import { generateCertificateService } from "@/services/certificate-service";
import { Award, Check, ChevronLeft, ChevronRight, Download, Play, Star } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";

function StudentViewCourseProgressPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { studentCurrentCourseProgress, setStudentCurrentCourseProgress } =
    useContext(StudentContext);
  const [lockCourse, setLockCourse] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showCourseCompleteDialog, setShowCourseCompleteDialog] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const { id } = useParams();

  // Add a function to verify course purchase directly
  async function verifyCoursePurchase() {
    try {
      // Ensure the ID is properly formatted
      const normalizedId = id.toString().trim();
      console.log('Verifying course purchase directly for user:', auth?.user?._id, 'course:', normalizedId);

      // Try to verify with the normalized ID
      const response = await checkCoursePurchaseInfoService(normalizedId, auth?.user?._id);
      console.log('Course purchase verification response:', response);

      if (response?.success && response?.data === true) {
        return true;
      }

      // If verification failed, try to get all courses and check manually
      console.log('Direct verification failed, checking against all courses...');
      const coursesResponse = await fetchStudentBoughtCoursesService(auth?.user?._id);

      if (coursesResponse?.success && coursesResponse?.data?.length > 0) {
        // Log all course IDs for debugging
        console.log('All user courses:', coursesResponse.data.map(c => ({ id: c.courseId, title: c.title })));

        // Check if any course ID matches (using various comparison methods)
        const matchingCourse = coursesResponse.data.find(course => {
          const courseIdStr = course.courseId.toString().trim();
          const idStr = normalizedId;

          // Try different comparison methods
          const exactMatch = courseIdStr === idStr;
          const partialMatch = courseIdStr.includes(idStr) || idStr.includes(courseIdStr);

          console.log(`Course comparison: ${courseIdStr} vs ${idStr}, Exact: ${exactMatch}, Partial: ${partialMatch}`);

          return exactMatch || partialMatch;
        });

        if (matchingCourse) {
          console.log('Found matching course in user courses:', matchingCourse.title);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying course purchase:', error);
      return false;
    }
  }

  async function fetchCurrentCourseProgress(retryCount = 0) {
    try {
      // Validate course ID
      if (!id) {
        console.error('Course ID is missing or undefined');
        alert('Error: Course ID is missing. Please return to My Courses and try again.');
        navigate('/student-courses');
        return;
      }

      // Format the course ID
      const formattedId = id.toString().trim();
      console.log('Fetching course progress for user:', auth?.user?._id, 'course:', formattedId, 'retry:', retryCount);

      // Call the API with the formatted ID
      const response = await getCurrentCourseProgressService(auth?.user?._id, formattedId);
      console.log('Course progress response:', response);

      if (response?.success) {
        // Always treat the course as purchased when accessed from My Courses
        console.log('Course progress data received, setting progress data');
        setLockCourse(false);
        setStudentCurrentCourseProgress({
          courseDetails: response?.data?.courseDetails,
          progress: response?.data?.progress,
          completed: response?.data?.completed
        });

        if (response?.data?.completed) {
          console.log('Course is completed, showing completion dialog');
          setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
          setShowCourseCompleteDialog(true);
          setShowConfetti(true);

          return;
        }

        if (response?.data?.progress?.length === 0) {
          console.log('No progress yet, starting from first lecture');
          setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
        } else {
          console.log('Progress found, calculating last viewed lecture');
          const lastIndexOfViewedAsTrue = response?.data?.progress.reduceRight(
            (acc, obj, index) => {
              return acc === -1 && obj.viewed ? index : acc;
            },
            -1
          );

          console.log('Last viewed lecture index:', lastIndexOfViewedAsTrue);

          // If all lectures are viewed, start from the first one
          if (lastIndexOfViewedAsTrue + 1 >= response?.data?.courseDetails?.curriculum?.length) {
            setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
          } else {
            setCurrentLecture(
              response?.data?.courseDetails?.curriculum[
                lastIndexOfViewedAsTrue + 1
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course progress:', error);

      // If there's an error, retry once
      if (retryCount < 1) {
        console.log('Retrying course progress fetch...');
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchCurrentCourseProgress(retryCount + 1);
      }

      // Show a more user-friendly error message
      alert('Error loading course content. Please try refreshing the page.');
      // Don't show lock dialog, just show an error message
      setLockCourse(false);
    }
  }

  async function updateCourseProgress() {
    if (currentLecture) {
      const response = await markLectureAsViewedService(
        auth?.user?._id,
        studentCurrentCourseProgress?.courseDetails?._id,
        currentLecture._id
      );

      if (response?.success) {
        fetchCurrentCourseProgress();
      }
    }
  }

  async function handleRewatchCourse() {
    const response = await resetCourseProgressService(
      auth?.user?._id,
      studentCurrentCourseProgress?.courseDetails?._id
    );

    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
      fetchCurrentCourseProgress();
    }
  }

  useEffect(() => {
    async function loadCourseProgress() {
      // Skip purchase verification - if the course is in My Courses, it's already purchased
      console.log('Loading course progress directly without purchase verification');
      console.log('Course ID from URL params:', id);

      // Validate course ID
      if (!id) {
        console.error('Course ID is missing or undefined in useEffect');
        alert('Error: Course ID is missing. Please return to My Courses and try again.');
        navigate('/student-courses');
        return;
      }

      await fetchCurrentCourseProgress();
    }

    if (auth?.user?._id && id) {
      loadCourseProgress();
    } else {
      console.log('Missing required data:', { userId: auth?.user?._id, courseId: id });
      if (!id) {
        navigate('/student-courses');
      }
    }
  }, [id, auth?.user?._id, navigate]);

  useEffect(() => {
    if (currentLecture?.progressValue === 1) {
      console.log("Course lecture completed, updating progress...");
      updateCourseProgress();
    }
  }, [currentLecture]);

  // Debug log for course completion dialog
  useEffect(() => {
    console.log("Course completion dialog state:", {
      showCourseCompleteDialog,
      hasSubmittedRating,
      showRatingForm
    });
  }, [showCourseCompleteDialog, hasSubmittedRating, showRatingForm]);

  useEffect(() => {
    if (showConfetti) setTimeout(() => setShowConfetti(false), 15000);
  }, [showConfetti]);

  console.log(currentLecture, "currentLecture");

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-950 to-black text-white">
      {showConfetti && <Confetti />}
      <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/student-courses")}
            className="text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Courses
          </Button>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {studentCurrentCourseProgress?.courseDetails?.title}
            </h1>
            <div className="flex items-center text-xs text-white/60 mt-1">
              <div className="flex items-center">
                <Play className="h-3 w-3 mr-1" />
                {studentCurrentCourseProgress?.progress?.filter(p => p.viewed).length || 0} / {studentCurrentCourseProgress?.courseDetails?.curriculum?.length || 0} lectures completed
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Test button - only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={() => {
                setShowCourseCompleteDialog(true);
                setShowRatingForm(false);
                setHasSubmittedRating(false);
              }}
              variant="outline"
              size="sm"
              className="text-xs border-white/30 text-white/80 hover:bg-white/10"
            >
              Test Completion Dialog
            </Button>
          )}
          <Button
            onClick={() => setIsSideBarOpen(!isSideBarOpen)}
            variant="outline"
            className="border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
          >
            {isSideBarOpen ? (
              <>
                <ChevronRight className="h-5 w-5 mr-2" />
                <span className="text-sm">Hide Sidebar</span>
              </>
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Show Sidebar</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`flex-1 ${
            isSideBarOpen ? "mr-[400px]" : ""
          } transition-all duration-300 flex flex-col`}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
            <VideoPlayer
              width="100%"
              height="500px"
              url={currentLecture?.videoUrl}
              onProgressUpdate={setCurrentLecture}
              progressData={currentLecture}
              className="rounded-lg overflow-hidden shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                  {currentLecture?.progressValue ? Math.round(currentLecture.progressValue * 100) : 0}% Complete
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-b from-indigo-950/50 to-black/50 backdrop-blur-sm rounded-b-lg shadow-lg">
            <div className="space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{currentLecture?.title}</h2>
                  <p className="text-white/60 mt-2 text-sm">
                    Lecture {studentCurrentCourseProgress?.courseDetails?.curriculum?.findIndex(item => item._id === currentLecture?._id) + 1} of {studentCurrentCourseProgress?.courseDetails?.curriculum?.length}
                  </p>
                </div>

                {studentCurrentCourseProgress?.completed && (
                  <Button
                    onClick={() => {
                      setShowCourseCompleteDialog(true);
                      setShowRatingForm(true);
                      setHasSubmittedRating(false);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20 shadow-lg shadow-blue-500/20"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate & Review
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    style={{ width: `${currentLecture?.progressValue ? Math.round(currentLecture.progressValue * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-white/60 whitespace-nowrap">
                  {currentLecture?.progressValue ? Math.round(currentLecture.progressValue * 100) : 0}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`fixed top-[64px] right-0 bottom-0 w-[400px] bg-gradient-to-b from-indigo-950/90 to-black/90 backdrop-blur-md border-l border-white/10 transition-all duration-300 shadow-xl ${
            isSideBarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Tabs defaultValue="content" className="h-full flex flex-col">
            <TabsList className="grid bg-black/30 w-full grid-cols-2 p-0 h-14 border-b border-white/10">
              <TabsTrigger
                value="content"
                className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-none h-full transition-all"
              >
                Course Content
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-none h-full transition-all"
              >
                Overview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Course Lectures</h3>
                    <div className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                      {studentCurrentCourseProgress?.progress?.filter(p => p.viewed).length || 0} / {studentCurrentCourseProgress?.courseDetails?.curriculum?.length || 0} completed
                    </div>
                  </div>

                  <div className="space-y-2">
                    {studentCurrentCourseProgress?.courseDetails?.curriculum.map(
                      (item, index) => {
                        const isViewed = studentCurrentCourseProgress?.progress?.find(
                          (progressItem) => progressItem.lectureId === item._id
                        )?.viewed;
                        const isActive = currentLecture?._id === item._id;

                        return (
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg text-sm cursor-pointer transition-all ${isActive ? 'bg-white/10 border-l-2 border-blue-500' : 'hover:bg-white/5'}`}
                            key={item._id}
                            onClick={() => setCurrentLecture(item)}
                          >
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isViewed ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/60'}`}>
                              {isViewed ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>{item?.title}</div>
                              <div className="text-xs text-white/50 flex items-center mt-1">
                                <Play className="h-3 w-3 mr-1" />
                                {item?.duration || '10 mins'}
                              </div>
                            </div>
                            {isActive && (
                              <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                Current
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="overview" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">About this course</h2>
                    <p className="text-white/70 leading-relaxed">
                      {studentCurrentCourseProgress?.courseDetails?.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Play className="h-4 w-4 text-blue-400" />
                        </div>
                        <h3 className="font-medium text-white">Lectures</h3>
                      </div>
                      <p className="text-2xl font-bold text-white">{studentCurrentCourseProgress?.courseDetails?.curriculum?.length || 0}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-400" />
                        </div>
                        <h3 className="font-medium text-white">Completed</h3>
                      </div>
                      <p className="text-2xl font-bold text-white">{studentCurrentCourseProgress?.progress?.filter(p => p.viewed).length || 0}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-3 text-white">Your Progress</h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70">Course Completion</span>
                        <span className="text-white font-medium">
                          {studentCurrentCourseProgress?.courseDetails?.curriculum?.length ?
                            Math.round((studentCurrentCourseProgress?.progress?.filter(p => p.viewed).length / studentCurrentCourseProgress?.courseDetails?.curriculum?.length) * 100) : 0}%
                          </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${studentCurrentCourseProgress?.courseDetails?.curriculum?.length ?
                            Math.round((studentCurrentCourseProgress?.progress?.filter(p => p.viewed).length / studentCurrentCourseProgress?.courseDetails?.curriculum?.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {studentCurrentCourseProgress?.completed && (
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-white/10 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Course Completed!</h3>
                      </div>
                      <p className="text-white/70 mb-4">Congratulations on completing this course! Share your experience with other students by rating and reviewing.</p>
                      <div className="space-y-3">
                        <Button
                          onClick={() => {
                            setShowCourseCompleteDialog(true);
                            setShowRatingForm(true);
                            setHasSubmittedRating(false);
                          }}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20 py-6 shadow-lg shadow-blue-500/20"
                        >
                          <Star className="h-5 w-5 mr-2" />
                          Rate & Review This Course
                        </Button>
                        <Button
                          onClick={async () => {
                            setIsGeneratingCertificate(true);
                            try {
                              console.log('Generating certificate for course:', studentCurrentCourseProgress?.courseDetails);
                              if (!auth?.user?._id || !studentCurrentCourseProgress?.courseDetails?._id) {
                                console.error('Missing required data for certificate generation:', {
                                  userId: auth?.user?._id,
                                  courseId: studentCurrentCourseProgress?.courseDetails?._id
                                });
                                alert('Missing required information for certificate generation. Please try again.');
                                return;
                              }

                              await generateCertificateService(
                                auth?.user?._id,
                                studentCurrentCourseProgress?.courseDetails?._id
                              );
                            } catch (error) {
                              console.error("Error generating certificate:", error);
                              alert(`Failed to generate certificate: ${error.message || 'Unknown error'}. Please try again.`);
                            } finally {
                              setIsGeneratingCertificate(false);
                            }
                          }}
                          disabled={isGeneratingCertificate}
                          className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border border-white/20 py-6 shadow-lg shadow-green-500/20"
                        >
                          {isGeneratingCertificate ? (
                            "Generating Certificate..."
                          ) : (
                            <>
                              <Award className="h-5 w-5 mr-2" />
                              Download Certificate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={lockCourse} onOpenChange={(open) => {
        if (!open) navigate('/student-courses');
      }}>
        <DialogContent className="sm:w-[450px] bg-indigo-950/95 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V6a3 3 0 00-3-3H6a3 3 0 00-3 3v7a3 3 0 003 3h7a3 3 0 003-3z" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-center">Access Restricted</DialogTitle>
            <DialogDescription className="text-white/80 text-center">
              You need to purchase this course to access its content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-white/70 text-center">
              This could happen if:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>You haven't purchased this course yet</li>
              <li>Your session has expired</li>
              <li>There was an error verifying your purchase</li>
              <li>The course ID might be incorrect or in an unexpected format</li>
              <li>The course might have been removed or made private</li>
              <li>There might be a mismatch between the course ID formats</li>
            </ul>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={() => {
                  // Reload the page to retry verification
                  window.location.reload();
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
              >
                Refresh & Try Again
              </Button>
              <Button
                onClick={async () => {
                  // Try a different approach - get all courses and find a match
                  const isPurchased = await verifyCoursePurchase();
                  if (isPurchased) {
                    setLockCourse(false);
                    fetchCurrentCourseProgress();
                  } else {
                    alert('Still unable to verify course access. Please try from My Courses page.');
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border border-white/20"
              >
                Try Alternative Verification
              </Button>
              <Button
                onClick={() => navigate(`/course/details/${id}`)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                View Course Details
              </Button>
              <Button
                onClick={() => navigate('/student-courses')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Go to My Courses
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showCourseCompleteDialog} onOpenChange={(open) => {
        if (!open) setShowCourseCompleteDialog(false);
      }}>
        <DialogContent showOverlay={true} className="sm:w-[550px] bg-indigo-950/95 backdrop-blur-md border border-white/10 shadow-xl text-white p-0 overflow-hidden z-50 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-6 border-b border-white/10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white text-center">Congratulations!</DialogTitle>
            <DialogDescription className="text-white/80 text-center">
              You have successfully completed the course
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            {!hasSubmittedRating && !showRatingForm && (
              <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
                <div className="mb-4">
                  <div className="flex justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star key={value} className="h-8 w-8 text-yellow-400 fill-none mx-1" />
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Rate This Course</h3>
                  <p className="text-white/70 mb-4">Your feedback helps other students and improves our courses</p>
                </div>
                <Button
                  onClick={() => setShowRatingForm(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20 py-2 h-auto text-base"
                >
                  Rate & Review
                </Button>
              </div>
            )}

            {!hasSubmittedRating && showRatingForm && (
              <>
                {/* Debug info */}
                <div className="hidden">
                  User ID: {auth?.user?._id}, Course ID: {id}
                </div>
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRatingForm(false)}
                    className="text-white/70 hover:text-white hover:bg-white/10 -ml-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <CourseRating
                  userId={auth?.user?._id}
                  courseId={id}
                  onRatingSubmitted={() => {
                    setHasSubmittedRating(true);
                    setShowRatingForm(false);
                  }}
                />
              </>
            )}

            {hasSubmittedRating && (
              <div className="bg-green-500/20 text-green-400 p-6 rounded-lg border border-green-500/30 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-xl font-bold text-green-400 mb-2">Thank You!</h3>
                <p>Your feedback helps other students make informed decisions and helps us improve our courses.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => navigate("/student-courses")}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20 py-2 h-auto"
              >
                My Courses Page
              </Button>
              <Button
                onClick={handleRewatchCourse}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-indigo-950/30 backdrop-blur-sm py-2 h-auto"
              >
                Rewatch Course
              </Button>
            </div>

            {hasSubmittedRating && (
              <div className="mt-4">
                <Button
                  onClick={async () => {
                    setIsGeneratingCertificate(true);
                    try {
                      console.log('Generating certificate from completion dialog for course:', studentCurrentCourseProgress?.courseDetails);
                      if (!auth?.user?._id || !studentCurrentCourseProgress?.courseDetails?._id) {
                        console.error('Missing required data for certificate generation:', {
                          userId: auth?.user?._id,
                          courseId: studentCurrentCourseProgress?.courseDetails?._id
                        });
                        alert('Missing required information for certificate generation. Please try again.');
                        return;
                      }

                      await generateCertificateService(
                        auth?.user?._id,
                        studentCurrentCourseProgress?.courseDetails?._id
                      );
                    } catch (error) {
                      console.error("Error generating certificate:", error);
                      alert(`Failed to generate certificate: ${error.message || 'Unknown error'}. Please try again.`);
                    } finally {
                      setIsGeneratingCertificate(false);
                    }
                  }}
                  disabled={isGeneratingCertificate}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border border-white/20 py-2 h-auto"
                >
                  {isGeneratingCertificate ? (
                    "Generating Certificate..."
                  ) : (
                    <>
                      <Award className="h-5 w-5 mr-2" />
                      Download Your Certificate
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseProgressPage;
