import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Users, Percent, Clock } from 'lucide-react';
import { Badge } from './badge';
import { getCourseRatingsService } from '@/services';

// Utility function to format seconds into hours, minutes and seconds
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0 min";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`;
  } else {
    return `${minutes} min`;
  }
}

const CourseCard = ({ course, onClick, variant = "default" }) => {
  const [courseRating, setCourseRating] = useState({ averageRating: 0, totalRatings: 0 });
  const [isLoadingRating, setIsLoadingRating] = useState(false);

  useEffect(() => {
    const fetchCourseRating = async () => {
      if (!course?._id) return;

      try {
        setIsLoadingRating(true);
        const response = await getCourseRatingsService(course._id);
        if (response.success) {
          setCourseRating({
            averageRating: response.data.averageRating,
            totalRatings: response.data.totalRatings
          });
        }
      } catch (error) {
        console.error("Error fetching course rating:", error);
      } finally {
        setIsLoadingRating(false);
      }
    };

    fetchCourseRating();
  }, [course?._id]);

  // Use actual rating or show 'No ratings' text
  // Make sure averageRating is a number before using toFixed
  const rating = courseRating.averageRating > 0 ?
    (typeof courseRating.averageRating === 'number' ?
      courseRating.averageRating.toFixed(1) :
      courseRating.averageRating) :
    "0.0";

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
        transition={{ duration: 0.3 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
        onClick={onClick}
      >
        <div className="relative">
          <img
            src={course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'}
            alt={course?.title}
            className="w-full h-32 object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
            <div className="p-3">
              <div className="flex gap-1 mb-1">
                {courseRating.averageRating > 0 ? (
                  <Badge variant="secondary" className="text-xs bg-yellow-500/30 text-white border-none flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400" /> {rating} ({courseRating.totalRatings})
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-gray-500/30 text-white border-none flex items-center gap-1">
                    <Star className="h-3 w-3" /> No ratings
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs bg-blue-500/30 text-white border-none">
                  {course?.category}
                </Badge>
                {course?.discountActive && course?.discountPercentage > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-500/30 text-white border-none flex items-center gap-1">
                    <Percent className="h-3 w-3" /> {course.discountPercentage}% off
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs bg-purple-500/30 text-white border-none flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(course?.totalDuration)}
                </Badge>
              </div>
              <h3 className="text-white font-bold line-clamp-1">{course?.title}</h3>
              {parseFloat(course?.pricing) <= 0 ? (
                <div className="mt-1">
                  <span className="text-sm font-bold text-green-400">Free</span>
                </div>
              ) : course?.discountActive && course?.discountPercentage > 0 ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold text-blue-400">
                    ₹{Math.round(course.pricing * (1 - course.discountPercentage / 100))}
                  </span>
                  <span className="text-xs line-through text-white/50">
                    ₹{course.pricing}
                  </span>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="text-sm font-bold text-blue-400">₹{course?.pricing}</span>
                </div>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left absolute bottom-0"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg cursor-pointer h-full flex flex-col group"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'}
          alt={course?.title}
          className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          <Badge variant="secondary" className="font-semibold bg-purple-500/30 text-white border-none">
            {course?.level}
          </Badge>
          {course?.discountActive && course?.discountPercentage > 0 && (
            <Badge variant="secondary" className="font-semibold bg-green-500/30 text-white border-none flex items-center gap-1">
              <Percent className="h-3 w-3" /> {course.discountPercentage}% off
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <Badge variant="primary" className="mb-2 bg-blue-500/30 text-white border-none">
            {course?.category}
          </Badge>
          <h3 className="text-white text-lg font-bold line-clamp-1">{course?.title}</h3>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left absolute bottom-0"></div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="flex items-center text-yellow-500 mb-2">
          {courseRating.averageRating > 0 ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(courseRating.averageRating) ? 'fill-yellow-500' : 'fill-gray-500/30'}`} />
              ))}
              <span className="ml-1 text-sm font-medium text-white/80">
                {rating}
                <span className="text-white/60 ml-1">({courseRating.totalRatings})</span>
              </span>
            </>
          ) : (
            <>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gray-500/30" />
              ))}
              <span className="ml-1 text-sm font-medium text-white/60">
                No ratings yet
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-white/70 mb-3 line-clamp-2">
          {course?.subtitle || "Learn valuable skills with this comprehensive course."}
        </p>

        <div className="mt-auto">
          <div className="flex items-center justify-between text-sm text-white/60 mb-3">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>{course?.curriculum?.length || 0} lectures</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{course?.students?.length || 0} students</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDuration(course?.totalDuration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {parseFloat(course?.pricing) <= 0 ? (
                <p className="font-bold text-lg text-green-400">Free</p>
              ) : course?.discountActive && course?.discountPercentage > 0 ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-blue-400">
                      ₹{Math.round(course.pricing * (1 - course.discountPercentage / 100))}
                    </p>
                    <p className="text-sm line-through text-white/50">
                      ₹{course.pricing}
                    </p>
                  </div>
                  <Badge variant="outline" className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1 w-fit">
                    <Percent className="h-3 w-3" /> {course.discountPercentage}% off
                  </Badge>
                </div>
              ) : (
                <p className="font-bold text-lg text-blue-400">₹{course?.pricing}</p>
              )}
            </div>
            <p className="text-sm text-white/70">
              {course?.instructorName}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
