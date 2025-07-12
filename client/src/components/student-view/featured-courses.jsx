import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import CourseCard from '../ui/course-card';
import { useNavigate } from 'react-router-dom';

const FeaturedCourses = ({ courses = [], title = "Featured Courses", showViewAll = true }) => {
  const navigate = useNavigate();

  // If no courses are provided, return null
  if (!courses || courses.length === 0) return null;

  // Use all provided courses (the parent component already limited to 3 for the home page)
  const displayCourses = courses;

  return (
    <div className="py-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_400px,rgba(78,161,255,0.2),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-white/80 mt-2">
              Expand your knowledge with our newest courses
            </p>
          </motion.div>

          {showViewAll && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Button
                onClick={() => navigate('/courses')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-indigo-950/30 backdrop-blur-sm"
              >
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CourseCard
                course={course}
                onClick={() => navigate(`/course/details/${course._id}`)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCourses;
