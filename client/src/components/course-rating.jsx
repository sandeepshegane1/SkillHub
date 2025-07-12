import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { addOrUpdateRatingService, getUserRatingForCourseService } from "@/services";

const CourseRating = ({ userId, courseId, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching rating for userId:", userId, "courseId:", courseId);
        const response = await getUserRatingForCourseService(userId, courseId);
        console.log("Rating response:", response);
        if (response.success && response.data) {
          setRating(response.data.rating);
          setReview(response.data.review || "");
          setExistingRating(response.data);
        }
      } catch (error) {
        console.error("Error fetching user rating:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && courseId) {
      fetchUserRating();
    } else {
      console.warn("Missing userId or courseId for rating component", { userId, courseId });
    }
  }, [userId, courseId]);

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleRatingHover = (value) => {
    setHoverRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      console.warn("Cannot submit with 0 rating");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Submitting rating:", { userId, courseId, rating, review });

      const response = await addOrUpdateRatingService({
        userId,
        courseId,
        rating,
        review
      });

      console.log("Rating submission response:", response);

      if (response.success) {
        if (onRatingSubmitted) {
          console.log("Calling onRatingSubmitted callback");
          onRatingSubmitted(response.data);
        } else {
          console.warn("onRatingSubmitted callback not provided");
        }
      } else {
        console.error("Rating submission was not successful", response);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white/5 p-6 rounded-lg border border-white/10">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Rate This Course</h3>
        <p className="text-white/70 text-sm">Your feedback helps other students and improves our courses</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-10 w-10 cursor-pointer transition-all ${
                (hoverRating || rating) >= value
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => handleRatingHover(value)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
        <span className="text-white/80 text-sm font-medium">
          {rating > 0 ? `You rated this course ${rating} out of 5` : "Click to rate this course"}
        </span>
      </div>

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Share your experience (optional)</label>
        <Textarea
          placeholder="What did you like or dislike about this course?"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/60 w-full"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20 py-2 h-auto text-base"
      >
        {isSubmitting ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
      </Button>
    </div>
  );
};

export default CourseRating;
