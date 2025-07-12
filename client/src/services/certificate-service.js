import axiosInstance from "@/api/axiosInstance";

// Function to generate certificate using HTML template
export const generateHTMLCertificateService = async (userId, courseId) => {
  try {
    console.log(`Generating HTML certificate for user: ${userId}, course: ${courseId}`);

    if (!userId || !courseId) {
      console.error("Missing userId or courseId", { userId, courseId });
      throw new Error("Missing required information (userId or courseId)");
    }

    // Ensure courseId is properly formatted
    const formattedCourseId = courseId.toString().trim();
    console.log(`Formatted courseId: ${formattedCourseId}`);

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await axiosInstance.post(
      `/student/certificate/generate-html?t=${timestamp}`,
      {
        userId,
        courseId: formattedCourseId,
      },
      {
        responseType: 'blob', // Important for handling PDF files
      }
    );

    console.log("HTML Certificate API response received", { status: response.status, type: response.data.type });

    // Check if the response is actually a PDF (application/pdf)
    if (response.data.type && response.data.type !== 'application/pdf') {
      // If it's not a PDF, it might be an error message in JSON format
      const reader = new FileReader();
      reader.onload = function() {
        try {
          const errorJson = JSON.parse(reader.result);
          console.error("API returned an error:", errorJson);
          alert(`Error: ${errorJson.message || 'Failed to generate certificate'}`);
        } catch (e) {
          console.error("Could not parse error response", e);
          alert("An unexpected error occurred while generating the certificate");
        }
      };
      reader.readAsText(response.data);
      throw new Error("Response is not a PDF");
    }

    // Create a download link for the PDF with timestamp to ensure unique filename
    const downloadTimestamp = new Date().getTime();
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${formattedCourseId}-${downloadTimestamp}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error generating HTML certificate:", error);

    // Try to extract the error message from the response if it exists
    let errorMessage = "Failed to generate certificate";
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Function to download HTML certificate
export const downloadHTMLCertificateService = async (certificateId) => {
  try {
    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await axiosInstance.get(
      `/student/certificate/download-html/${certificateId}?t=${timestamp}`,
      {
        responseType: 'blob', // Important for handling PDF files
      }
    );

    // Create a download link for the PDF with timestamp to ensure unique filename
    const downloadTimestamp = new Date().getTime();
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${certificateId}-${downloadTimestamp}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error downloading HTML certificate:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to download certificate",
    };
  }
};

// Original PDFKit-based certificate generation
export const generateCertificateService = async (userId, courseId) => {
  try {
    console.log(`Generating certificate for user: ${userId}, course: ${courseId}`);

    if (!userId || !courseId) {
      console.error("Missing userId or courseId", { userId, courseId });
      throw new Error("Missing required information (userId or courseId)");
    }

    // Ensure courseId is properly formatted
    const formattedCourseId = courseId.toString().trim();
    console.log(`Formatted courseId: ${formattedCourseId}`);

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await axiosInstance.post(
      `/student/certificate/generate?t=${timestamp}`,
      {
        userId,
        courseId: formattedCourseId,
      },
      {
        responseType: 'blob', // Important for handling PDF files
      }
    );

    console.log("Certificate API response received", { status: response.status, type: response.data.type });

    // Check if the response is actually a PDF (application/pdf)
    if (response.data.type && response.data.type !== 'application/pdf') {
      // If it's not a PDF, it might be an error message in JSON format
      const reader = new FileReader();
      reader.onload = function() {
        try {
          const errorJson = JSON.parse(reader.result);
          console.error("API returned an error:", errorJson);
          alert(`Error: ${errorJson.message || 'Failed to generate certificate'}`);
        } catch (e) {
          console.error("Could not parse error response", e);
          alert("An unexpected error occurred while generating the certificate");
        }
      };
      reader.readAsText(response.data);
      throw new Error("Response is not a PDF");
    }

    // Create a download link for the PDF with timestamp to ensure unique filename
    const downloadTimestamp = new Date().getTime();
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${formattedCourseId}-${downloadTimestamp}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error generating certificate:", error);

    // Try to extract the error message from the response if it exists
    let errorMessage = "Failed to generate certificate";

    if (error.response) {
      if (error.response.data instanceof Blob) {
        // If the error response is a Blob, try to read it as text
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error blob", e);
        }
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }

    alert(`Error: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

export const downloadCertificateService = async (certificateId) => {
  try {
    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await axiosInstance.get(
      `/student/certificate/download/${certificateId}?t=${timestamp}`,
      {
        responseType: 'blob', // Important for handling PDF files
      }
    );

    // Create a download link for the PDF with timestamp to ensure unique filename
    const downloadTimestamp = new Date().getTime();
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${certificateId}-${downloadTimestamp}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error downloading certificate:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to download certificate",
    };
  }
};

export const getUserCertificatesService = async (userId) => {
  try {
    const response = await axiosInstance.get(`/student/certificate/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user certificates:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch certificates",
    };
  }
};
