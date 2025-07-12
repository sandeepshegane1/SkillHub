import axios from "axios";

const axiosInstance = axios.create({
  baseURL: PROCESS.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = JSON.parse(sessionStorage.getItem("accessToken")) || "";
    console.log("Intercepted request with token:", accessToken);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (err) => {
    console.error("Request Interceptor Error:", err);
    return Promise.reject(err);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      error: error.message
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
