import CourseCurriculum from "@/components/instructor-view/courses/add-new-course/course-curriculum";
import CourseLanding from "@/components/instructor-view/courses/add-new-course/course-landing";
import CourseSettings from "@/components/instructor-view/courses/add-new-course/course-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import {
  addNewCourseService,
  fetchInstructorCourseDetailsService,
  updateCourseByIdService,
} from "@/services";
import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function AddNewCoursePage() {
  const {
    courseLandingFormData,
    courseCurriculumFormData,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
    currentEditedCourseId,
    setCurrentEditedCourseId,
  } = useContext(InstructorContext);

  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();

  console.log(params);

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return value === "" || value === null || value === undefined;
  }

  function validateFormData() {
    console.log('Validating form data...');

    // Check if curriculum has at least one item
    if (isEmpty(courseCurriculumFormData)) {
      console.log('Curriculum is empty');
      return false;
    }

    // Check if landing page data is valid
    const requiredLandingFields = ['title', 'description', 'category', 'pricing', 'image'];
    for (const key of requiredLandingFields) {
      if (isEmpty(courseLandingFormData[key])) {
        console.log(`Missing required field: ${key}`);
        return false;
      }
    }

    // Check if curriculum items are valid
    for (const item of courseCurriculumFormData) {
      if (isEmpty(item.title)) {
        console.log('Missing curriculum item title');
        return false;
      }
    }

    console.log('Form data is valid');
    return true;
  }

  async function handleCreateCourse() {
    console.log('Submit button clicked');

    // Calculate total course duration in seconds
    const totalDuration = courseCurriculumFormData.reduce((total, lecture) => {
      return total + (lecture.duration || 0);
    }, 0);

    // For new courses
    let courseFinalFormData = {
      instructorId: auth?.user?._id,
      instructorName: auth?.user?.userName,
      date: new Date(),
      ...courseLandingFormData,
      curriculum: courseCurriculumFormData,
      totalDuration: totalDuration, // Add total duration in seconds
      isPublised: true,
    };

    // If we're updating an existing course, we need to preserve the students array
    if (currentEditedCourseId !== null) {
      console.log('Updating existing course:', currentEditedCourseId);

      // For existing courses, always include the students array
      // If it's not provided in the form data, we'll set it to an empty array
      // and let the server handle preserving the existing students
      courseFinalFormData.students = [];
    } else {
      // For new courses, initialize with empty students array
      courseFinalFormData.students = [];
    }

    const response =
      currentEditedCourseId !== null
        ? await updateCourseByIdService(
            currentEditedCourseId,
            courseFinalFormData
          )
        : await addNewCourseService(courseFinalFormData);

    if (response?.success) {
      setCourseLandingFormData(courseLandingInitialFormData);
      setCourseCurriculumFormData(courseCurriculumInitialFormData);
      navigate(-1);
      setCurrentEditedCourseId(null);
    }

    console.log(courseFinalFormData, "courseFinalFormData");
  }

  async function fetchCurrentCourseDetails() {
    const response = await fetchInstructorCourseDetailsService(
      currentEditedCourseId
    );

    if (response?.success) {
      const setCourseFormData = Object.keys(
        courseLandingInitialFormData
      ).reduce((acc, key) => {
        acc[key] = response?.data[key] || courseLandingInitialFormData[key];

        return acc;
      }, {});

      console.log(setCourseFormData, response?.data, "setCourseFormData");
      console.log('Existing students:', response?.data?.students);
      setCourseLandingFormData(setCourseFormData);
      setCourseCurriculumFormData(response?.data?.curriculum);

      // Store the students array in a ref or context if needed for later use
      // This is a backup in case the fetch in handleCreateCourse fails
    }

    console.log(response, "response");
  }

  useEffect(() => {
    if (currentEditedCourseId !== null) fetchCurrentCourseDetails();
  }, [currentEditedCourseId]);

  useEffect(() => {
    if (params?.courseId) setCurrentEditedCourseId(params?.courseId);
  }, [params?.courseId]);

  console.log(params, currentEditedCourseId, "params");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_100px,rgba(120,119,198,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_600px,rgba(78,161,255,0.1),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Create Your Course</h1>
            <p className="text-gray-300 max-w-2xl">Share your knowledge with the world. Build a comprehensive curriculum that engages and inspires your students.</p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            onClick={handleCreateCourse}
          >
            Publish Course
          </Button>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="curriculum" className="w-full">
              <div className="bg-white/10 backdrop-blur-md border-b border-white/10 px-6 py-3">
                <TabsList className="bg-transparent grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
                  <TabsTrigger
                    value="curriculum"
                    className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger
                    value="course-landing-page"
                    className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Course Landing Page
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="curriculum" className="mt-0 animate-in fade-in-50 duration-300">
                  <CourseCurriculum />
                </TabsContent>
                <TabsContent value="course-landing-page" className="mt-0 animate-in fade-in-50 duration-300">
                  <CourseLanding />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 animate-in fade-in-50 duration-300">
                  <CourseSettings />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">Need help? Check out our <a href="#" className="text-blue-400 hover:text-blue-300 underline">course creation guide</a> or <a href="#" className="text-blue-400 hover:text-blue-300 underline">contact support</a>.</p>
        </div>
      </div>
    </div>
  );
}

export default AddNewCoursePage;






// 'use client'

// import { useContext, useEffect, useState } from "react"
// import { useNavigate, useParams } from "react-router-dom"
// import { motion, AnimatePresence } from "framer-motion"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   courseCurriculumInitialFormData,
//   courseLandingInitialFormData,
// } from "@/config"
// import { AuthContext } from "@/context/auth-context"
// import { InstructorContext } from "@/context/instructor-context"
// import {
//   addNewCourseService,
//   fetchInstructorCourseDetailsService,
//   updateCourseByIdService,
// } from "@/services"

// function CourseCurriculum() {
//   const { courseCurriculumFormData, setCourseCurriculumFormData } = useContext(InstructorContext)

//   const addSection = () => {
//     setCourseCurriculumFormData([...courseCurriculumFormData, { title: '', videoUrl: '', public_id: '', freePreview: false }])
//   }

//   const updateSection = (index, field, value) => {
//     const updatedFormData = [...courseCurriculumFormData]
//     updatedFormData[index][field] = value
//     setCourseCurriculumFormData(updatedFormData)
//   }

//   return (
//     <div className="space-y-6">
//       {courseCurriculumFormData.map((section, index) => (
//         <Card key={index}>
//           <CardContent className="p-4 space-y-4">
//             <Input
//               placeholder="Section Title"
//               value={section.title}
//               onChange={(e) => updateSection(index, 'title', e.target.value)}
//             />
//             <Input
//               placeholder="Video URL"
//               value={section.videoUrl}
//               onChange={(e) => updateSection(index, 'videoUrl', e.target.value)}
//             />
//             <Input
//               placeholder="Public ID"
//               value={section.public_id}
//               onChange={(e) => updateSection(index, 'public_id', e.target.value)}
//             />
//             <div className="flex items-center space-x-2">
//               <Switch
//                 id={`free-preview-${index}`}
//                 checked={section.freePreview}
//                 onCheckedChange={(checked) => updateSection(index, 'freePreview', checked)}
//               />
//               <Label htmlFor={`free-preview-${index}`}>Free Preview</Label>
//             </div>
//           </CardContent>
//         </Card>
//       ))}
//       <Button onClick={addSection}>Add Section</Button>
//     </div>
//   )
// }

// function CourseLanding() {
//   const { courseLandingFormData, setCourseLandingFormData } = useContext(InstructorContext)

//   const updateFormData = (field, value) => {
//     setCourseLandingFormData({ ...courseLandingFormData, [field]: value })
//   }

//   return (
//     <div className="space-y-6">
//       <Input
//         placeholder="Course Title"
//         value={courseLandingFormData.title}
//         onChange={(e) => updateFormData('title', e.target.value)}
//       />
//       <Textarea
//         placeholder="Course Description"
//         value={courseLandingFormData.description}
//         onChange={(e) => updateFormData('description', e.target.value)}
//       />
//       <Input
//         placeholder="Price"
//         type="number"
//         value={courseLandingFormData.price}
//         onChange={(e) => updateFormData('price', e.target.value)}
//       />
//       <Select
//         value={courseLandingFormData.category}
//         onValueChange={(value) => updateFormData('category', value)}
//       >
//         <SelectTrigger>
//           <SelectValue placeholder="Select a category" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="programming">Programming</SelectItem>
//           <SelectItem value="design">Design</SelectItem>
//           <SelectItem value="business">Business</SelectItem>
//           <SelectItem value="marketing">Marketing</SelectItem>
//         </SelectContent>
//       </Select>
//     </div>
//   )
// }

// function CourseSettings() {
//   const [isPublished, setIsPublished] = useState(false)

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center space-x-2">
//         <Switch
//           id="publish-course"
//           checked={isPublished}
//           onCheckedChange={setIsPublished}
//         />
//         <Label htmlFor="publish-course">Publish Course</Label>
//       </div>
//       <Textarea placeholder="Course Requirements" />
//       <Textarea placeholder="What You'll Learn" />
//     </div>
//   )
// }

// function AddNewCoursePage() {
//   const {
//     courseLandingFormData,
//     courseCurriculumFormData,
//     setCourseLandingFormData,
//     setCourseCurriculumFormData,
//     currentEditedCourseId,
//     setCurrentEditedCourseId,
//   } = useContext(InstructorContext)

//   const { auth } = useContext(AuthContext)
//   const navigate = useNavigate()
//   const params = useParams()

//   function isEmpty(value) {
//     if (Array.isArray(value)) {
//       return value.length === 0
//     }
//     return value === "" || value === null || value === undefined
//   }

//   function validateFormData() {
//     for (const key in courseLandingFormData) {
//       if (isEmpty(courseLandingFormData[key])) {
//         return false
//       }
//     }

//     let hasFreePreview = false

//     for (const item of courseCurriculumFormData) {
//       if (
//         isEmpty(item.title) ||
//         isEmpty(item.videoUrl) ||
//         isEmpty(item.public_id)
//       ) {
//         return false
//       }

//       if (item.freePreview) {
//         hasFreePreview = true
//       }
//     }

//     return hasFreePreview
//   }

//   async function handleCreateCourse() {
//     const courseFinalFormData = {
//       instructorId: auth?.user?._id,
//       instructorName: auth?.user?.userName,
//       date: new Date(),
//       ...courseLandingFormData,
//       students: [],
//       curriculum: courseCurriculumFormData,
//       isPublished: true,
//     }

//     const response =
//       currentEditedCourseId !== null
//         ? await updateCourseByIdService(
//             currentEditedCourseId,
//             courseFinalFormData
//           )
//         : await addNewCourseService(courseFinalFormData)

//     if (response?.success) {
//       setCourseLandingFormData(courseLandingInitialFormData)
//       setCourseCurriculumFormData(courseCurriculumInitialFormData)
//       navigate(-1)
//       setCurrentEditedCourseId(null)
//     }
//   }

//   async function fetchCurrentCourseDetails() {
//     const response = await fetchInstructorCourseDetailsService(
//       currentEditedCourseId
//     )

//     if (response?.success) {
//       const setCourseFormData = Object.keys(
//         courseLandingInitialFormData
//       ).reduce((acc, key) => {
//         acc[key] = response?.data[key] || courseLandingInitialFormData[key]
//         return acc
//       }, {})

//       setCourseLandingFormData(setCourseFormData)
//       setCourseCurriculumFormData(response?.data?.curriculum)
//     }
//   }

//   useEffect(() => {
//     if (currentEditedCourseId !== null) fetchCurrentCourseDetails()
//   }, [currentEditedCourseId])

//   useEffect(() => {
//     if (params?.courseId) setCurrentEditedCourseId(params?.courseId)
//   }, [params?.courseId])

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -20 }}
//       className="container mx-auto p-4 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
//     >
//       <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-gray-900 [background-image:radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:[background-image:radial-gradient(#1f2937_1px,transparent_1px)]" />
//       <div className="flex justify-between items-center mb-8">
//         <motion.h1
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="text-4xl font-extrabold text-gray-800 dark:text-gray-100"
//         >
//           Create a new course
//         </motion.h1>
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//         >
//           <Button
//             disabled={!validateFormData()}
//             className="text-sm tracking-wider font-bold px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
//             onClick={handleCreateCourse}
//           >
//             SUBMIT
//           </Button>
//         </motion.div>
//       </div>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//       >
//         <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
//           <CardContent className="p-0">
//             <div className="container mx-auto p-6">
//               <Tabs defaultValue="curriculum" className="space-y-6">
//                 <TabsList className="flex space-x-2 mb-6">
//                   {["curriculum", "course-landing-page", "settings"].map((tab) => (
//                     <TabsTrigger
//                       key={tab}
//                       value={tab}
//                       className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md transition-all duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-600"
//                     >
//                       {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
//                     </TabsTrigger>
//                   ))}
//                 </TabsList>
//                 <AnimatePresence mode="wait">
//                   <TabsContent value="curriculum">
//                     <motion.div
//                       key="curriculum"
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -20 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <CourseCurriculum />
//                     </motion.div>
//                   </TabsContent>
//                   <TabsContent value="course-landing-page">
//                     <motion.div
//                       key="course-landing-page"
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -20 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <CourseLanding />
//                     </motion.div>
//                   </TabsContent>
//                   <TabsContent value="settings">
//                     <motion.div
//                       key="settings"
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -20 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <CourseSettings />
//                     </motion.div>
//                   </TabsContent>
//                 </AnimatePresence>
//               </Tabs>
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </motion.div>
//   )
// }

// export default AddNewCoursePage

