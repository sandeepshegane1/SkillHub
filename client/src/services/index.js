import axiosInstance from "@/api/axiosInstance";

export async function registerService(formData) {
  const { data } = await axiosInstance.post("/auth/register", {
    ...formData,
    role: formData.userRole || "user", // Use userRole from form data, default to "user"
  });
  return data;
}

export async function sendVerificationOTPService(email) {
  const { data } = await axiosInstance.post("/auth/send-verification-otp", { email });
  return data;
}

export async function verifyOTPService(email, otp) {
  const { data } = await axiosInstance.post("/auth/verify-otp", { email, otp });
  return data;
}
export async function loginService(formData) {
  const { data } = await axiosInstance.post("/auth/login", formData);

  return data;
}

export async function checkAuthService() {
  const { data } = await axiosInstance.get("/auth/check-auth");

  return data;
}

export async function mediaUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function mediaDeleteService(id) {
  const { data } = await axiosInstance.delete(`/media/delete/${id}`);

  return data;
}

export async function fetchInstructorCourseListService(instructorId) {
  const { data } = await axiosInstance.get(`/instructor/course/get?instructorId=${instructorId}`);

  return data;
}

export async function addNewCourseService(formData) {
  const { data } = await axiosInstance.post(`/instructor/course/add`, formData);

  return data;
}

export async function fetchInstructorCourseDetailsService(id) {
  const { data } = await axiosInstance.get(
    `/instructor/course/get/details/${id}`
  );

  return data;
}

export async function updateCourseByIdService(id, formData) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update/${id}`,
    formData
  );

  return data;
}

export async function updateCoursePublishStatusService(id, isPublished) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update-publish-status/${id}`,
    { isPublished }
  );

  return data;
}

export async function updateCourseDiscountStatusService(id, discountData) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update-discount-status/${id}`,
    discountData
  );

  return data;
}

export async function deleteCourseService(id) {
  const { data } = await axiosInstance.delete(
    `/instructor/course/delete/${id}`
  );

  return data;
}

export async function mediaBulkUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/bulk-upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function fetchStudentViewCourseListService(query) {
  const { data } = await axiosInstance.get(`/student/course/get?${query}`);

  return data;
}

export async function fetchStudentViewCourseDetailsService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/course/get/details/${courseId}`
  );

  return data;
}

export async function checkCoursePurchaseInfoService(courseId, studentId) {
  const { data } = await axiosInstance.get(
    `/student/course/purchase-info/${courseId}/${studentId}`
  );

  return data;
}

export async function createPaymentService(formData) {
  const { data } = await axiosInstance.post(`/student/order/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId,
  payerId,
  orderId
) {
  const { data } = await axiosInstance.post(`/student/order/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService(studentId) {
  const { data } = await axiosInstance.get(
    `/student/courses-bought/get/${studentId}`
  );

  return data;
}

export async function getCurrentCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.get(
    `/student/course-progress/get/${userId}/${courseId}`
  );

  return data;
}

export async function markLectureAsViewedService(userId, courseId, lectureId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      userId,
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      userId,
      courseId,
    }
  );

  return data;
}

export async function verifyRazorpayPaymentService(paymentData) {
  const { data } = await axiosInstance.post(
    `/student/order/verify-razorpay`,
    paymentData
  );

  return data;
}

export async function getStudentProgressForInstructorService(courseId, studentId) {
  const { data } = await axiosInstance.get(
    `/instructor/student-progress/${courseId}/${studentId}`
  );

  return data;
}

export async function getCourseStudentsService(courseId) {
  const { data } = await axiosInstance.get(
    `/instructor/student-progress/course-students/${courseId}`
  );

  return data;
}

export async function getInstructorActivitiesService(instructorId, limit = 10, skip = 0) {
  const { data } = await axiosInstance.get(
    `/instructor/activity/get/${instructorId}?limit=${limit}&skip=${skip}`
  );

  return data;
}

export async function addOrUpdateRatingService(ratingData) {
  const { data } = await axiosInstance.post(
    `/student/rating/add`,
    ratingData
  );

  return data;
}

export async function getCourseRatingsService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/rating/course/${courseId}`
  );

  return data;
}

export async function getUserRatingForCourseService(userId, courseId) {
  const { data } = await axiosInstance.get(
    `/student/rating/user/${userId}/${courseId}`
  );

  return data;
}

export async function getUnreadActivitiesCountService(instructorId) {
  const { data } = await axiosInstance.get(
    `/instructor/activity/unread-count/${instructorId}`
  );

  return data;
}

export async function markActivitiesAsReadService(activityIds) {
  console.log('Sending request to mark activities as read:', activityIds);
  try {
    const { data } = await axiosInstance.post(
      `/instructor/activity/mark-read`,
      { activityIds }
    );
    console.log('Response from mark as read:', data);
    return data;
  } catch (error) {
    console.error('Error in markActivitiesAsReadService:', error);
    throw error;
  }
}

export async function updateUserProfileService(userId, profileData) {
  const { data } = await axiosInstance.put(
    `/auth/profile/${userId}`,
    profileData
  );

  return data;
}

export async function changePasswordService(userId, passwordData) {
  const { data } = await axiosInstance.put(
    `/auth/security/change-password/${userId}`,
    passwordData
  );

  return data;
}

// Cart Services
export async function getUserCartService(userId) {
  const { data } = await axiosInstance.get(
    `/student/cart/${userId}`
  );

  return data;
}

export async function addToCartService(userId, courseId) {
  const { data } = await axiosInstance.post(
    `/student/cart/${userId}/add`,
    { courseId }
  );

  return data;
}

export async function removeFromCartService(userId, courseId) {
  const { data } = await axiosInstance.delete(
    `/student/cart/${userId}/remove/${courseId}`
  );

  return data;
}

export async function clearCartService(userId) {
  const { data } = await axiosInstance.delete(
    `/student/cart/${userId}/clear`
  );

  return data;
}

// Password Reset Services
export async function forgotPasswordService(email) {
  const { data } = await axiosInstance.post(
    `/auth/forgot-password`,
    { email }
  );

  return data;
}

export async function resetPasswordService(token, newPassword) {
  const { data } = await axiosInstance.post(
    `/auth/reset-password`,
    { token, newPassword }
  );

  return data;
}
