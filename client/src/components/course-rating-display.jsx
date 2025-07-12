import React, { useState, useEffect } from 'react';
import { getCourseRatingsService } from '@/services';

const CourseRatingDisplay = ({ courseId }) => {
  const [courseRating, setCourseRating] = useState({ averageRating: 0, totalRatings: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseRating = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        const response = await getCourseRatingsService(courseId);
        if (response.success) {
          setCourseRating({
            averageRating: response.data.averageRating,
            totalRatings: response.data.totalRatings
          });
        }
      } catch (error) {
        console.error("Error fetching course rating:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseRating();
  }, [courseId]);

  if (isLoading) {
    return <p className="text-sm font-medium text-gray-400">Loading...</p>;
  }

  if (courseRating.totalRatings === 0) {
    return <p className="text-sm font-medium text-gray-400">No ratings yet</p>;
  }

  // Make sure averageRating is a number before using toFixed
  const formattedRating = typeof courseRating.averageRating === 'number' ?
    courseRating.averageRating.toFixed(1) :
    courseRating.averageRating;

  return (
    <p className="text-sm font-medium text-yellow-400">
      {formattedRating} ({courseRating.totalRatings})
    </p>
  );
};

export default CourseRatingDisplay;
