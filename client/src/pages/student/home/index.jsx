import { useContext, useEffect, useState } from "react";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
} from "@/services";
import { AuthContext } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/student-view/hero-section";
import FeaturedCourses from "@/components/student-view/featured-courses";
import CategoriesSection from "@/components/student-view/categories-section";
import TestimonialsSection from "@/components/student-view/testimonials-section";
import { motion } from "framer-motion";

function StudentHomePage() {
  const { studentViewCoursesList, setStudentViewCoursesList } =
    useContext(StudentContext);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAllStudentViewCourses() {
    try {
      setIsLoading(true);
      const response = await fetchStudentViewCourseListService();
      if (response?.success) {
        setStudentViewCoursesList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCourseNavigate(getCurrentCourseId) {
    const response = await checkCoursePurchaseInfoService(
      getCurrentCourseId,
      auth?.user?._id
    );

    if (response?.success) {
      if (response?.data) {
        navigate(`/course-progress/${getCurrentCourseId}`);
      } else {
        navigate(`/course/details/${getCurrentCourseId}`);
      }
    }
  }

  useEffect(() => {
    fetchAllStudentViewCourses();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Courses Section - Show only 3 most recent courses */}
      {!isLoading && studentViewCoursesList && studentViewCoursesList.length > 0 && (
        <FeaturedCourses
          courses={studentViewCoursesList
            .sort((a, b) => {
              // Handle cases where date might be missing
              if (!a.date) return 1;  // Push items without dates to the end
              if (!b.date) return -1; // Push items without dates to the end
              return new Date(b.date) - new Date(a.date); // Sort by date (newest first)
            })
            .slice(0, 3)} // Take only the first 3
          title="Featured Courses"
        />
      )}

      {/* Categories Section */}
      <CategoriesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Call to Action Section */}
      <div className="py-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_400px,rgba(78,161,255,0.3),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/50" />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 100 + 50],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Join thousands of students already learning on our platform
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/courses")}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
            >
              Explore All Courses
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default StudentHomePage;
