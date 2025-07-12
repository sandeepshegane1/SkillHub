import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CourseRatingDisplay from "@/components/course-rating-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { Delete, Edit, Plus, Search, Filter, MoreHorizontal, Eye, BookOpen, Users, DollarSign, Calendar, Globe, Lock, Check, Tag, Percent, Star, AlertTriangle } from "lucide-react";
import { updateCoursePublishStatusService, deleteCourseService } from "@/services";
import DiscountDialog from "./discount-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function InstructorCourses({ listOfCourses }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    setCurrentEditedCourseId,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
  } = useContext(InstructorContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState(listOfCourses || []);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update courses when listOfCourses changes
  useEffect(() => {
    setCourses(listOfCourses || []);
  }, [listOfCourses]);

  // Filter courses based on search query
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to toggle course publish status
  const toggleCoursePublishStatus = async (courseId, currentStatus) => {
    try {
      const response = await updateCoursePublishStatusService(courseId, !currentStatus);

      if (response.success) {
        // Update the local state
        setCourses(prevCourses =>
          prevCourses.map(course =>
            course._id === courseId ?
              { ...course, isPublished: !currentStatus } :
              course
          )
        );
      }
    } catch (error) {
      console.error("Error toggling course publish status:", error);
    }
  };

  // Function to open discount dialog
  const handleOpenDiscountDialog = (course) => {
    setSelectedCourse(course);
    setIsDiscountDialogOpen(true);
  };

  // Function to handle discount update
  const handleDiscountUpdated = (updatedCourse) => {
    // Update the local state
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course._id === updatedCourse._id ?
          updatedCourse :
          course
      )
    );
  };

  // Function to open delete dialog
  const handleOpenDeleteDialog = (course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete?._id) return;

    setIsDeleting(true);
    try {
      const response = await deleteCourseService(courseToDelete._id);

      if (response.success) {
        // Remove the course from the local state
        setCourses(prevCourses =>
          prevCourses.filter(course => course._id !== courseToDelete._id)
        );

        toast({
          title: "Course deleted",
          description: "The course has been successfully deleted.",
        });

        // Close the dialog
        setIsDeleteDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white">Your Courses</h2>
          <p className="text-gray-400 text-sm mt-1">Manage and track all your courses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-9 w-full md:w-[250px] bg-white/5 border-white/10 focus:border-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              setCurrentEditedCourseId(null);
              setCourseLandingFormData(courseLandingInitialFormData);
              setCourseCurriculumFormData(courseCurriculumInitialFormData);
              navigate("/instructor/create-new-course");
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </motion.div>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border border-white/10 bg-white/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-white/20">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Badge variant="info">{course.category}</Badge>
                      {course.isPublished ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Public
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Private
                        </Badge>
                      )}
                      {course.discountActive && course.discountPercentage > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                          <Percent className="h-3 w-3" /> {course.discountPercentage}% Off
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white truncate">{course.title}</h3>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-300">Students</p>
                        <p className="text-sm font-medium text-blue-400">{course.students?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-300">Rating</p>
                        <CourseRatingDisplay courseId={course._id} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-xs text-gray-300">Revenue</p>
                        <p className="text-sm font-medium text-emerald-400">₹{(course.students?.length || 0) * course.pricing}</p>
                        {course.discountActive && course.discountPercentage > 0 && (
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-green-400">₹{Math.round(course.pricing * (1 - course.discountPercentage / 100))}</p>
                            <p className="text-xs line-through text-white/50">₹{course.pricing}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-300">Lessons</p>
                        <p className="text-sm font-medium text-purple-400">{course.curriculum?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      <div>
                        <p className="text-xs text-gray-300">Created</p>
                        <p className="text-sm font-medium text-amber-400">{formatDate(course.date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={() => {
                        navigate(`/instructor/edit-course/${course?._id}`);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-white">
                          <DropdownMenuItem
                            onClick={() => toggleCoursePublishStatus(course._id, course.isPublished)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-gray-800"
                          >
                            {course.isPublished ? (
                              <>
                                <Lock className="h-4 w-4 text-amber-400" />
                                <span>Make Private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-4 w-4 text-green-400" />
                                <span>Make Public</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuItem
                            onClick={() => handleOpenDiscountDialog(course)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-gray-800"
                          >
                            {course.discountActive ? (
                              <>
                                <Percent className="h-4 w-4 text-green-400" />
                                <span>Discount: {course.discountPercentage}% Off</span>
                              </>
                            ) : (
                              <>
                                <Tag className="h-4 w-4 text-blue-400" />
                                <span>Add Discount</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteDialog(course)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-gray-800"
                          >
                            <Delete className="h-4 w-4 text-red-400" />
                            <span>Delete Course</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-400 max-w-md mb-6">You haven't created any courses yet, or none match your search criteria.</p>
            <Button
              onClick={() => {
                setCurrentEditedCourseId(null);
                setCourseLandingFormData(courseLandingInitialFormData);
                setCourseCurriculumFormData(courseCurriculumInitialFormData);
                navigate("/instructor/create-new-course");
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Your First Course
            </Button>
          </div>
        )}
      </div>

      {/* Discount Dialog */}
      {isDiscountDialogOpen && selectedCourse && (
        <DiscountDialog
          isOpen={isDiscountDialogOpen}
          onClose={() => setIsDiscountDialogOpen(false)}
          course={selectedCourse}
          onDiscountUpdated={handleDiscountUpdated}
        />
      )}

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete the course <span className="font-semibold text-white">{courseToDelete?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-red-400">
              Warning: Deleting this course will remove all associated content, including lectures, student enrollments, and progress data.
            </p>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="border border-white/10 hover:bg-white/10 text-white"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstructorCourses;
