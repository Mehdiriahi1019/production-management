import axios from "axios";
import { API_URL } from "./api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// مسیرهایی که هرگز نباید وارد چرخه‌ی «رفرش توکن» بشن.
// 401 روی این مسیرها یعنی «نام‌کاربری/پسورد اشتباهه» یا «داده‌ی ثبت‌نام نامعتبره»،
// نه اینکه توکن منقضی شده باشه. پس نباید کاربر رو reload/redirect کنه.
const AUTH_ENDPOINTS = [
  "/auth/identify/login/",
  "/auth/identify/register/",
  "/auth/identify/refresh/",
];

const isAuthEndpoint = (url = "") =>
  AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

// اضافه کردن توکن به هدر هر درخواست
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, newToken = null) => {
  pendingQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(newToken);
    }
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("❌ خطای اکسیوس:", error.response?.data);
    console.log("❌ کد وضعیت:", error.response?.status);

    const originalRequest = error.config;

    // اگه این خطا از خودِ endpoint های auth (لاگین/رجیستر/رفرش) اومده باشه،
    // اصلاً وارد منطق رفرش توکن نشو. فقط reject کن تا صفحه‌ی مربوطه
    // (مثلاً LoginPage) خودش پیام خطا رو نمایش بده.
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    // اگر توکن منقضی بود (401) و این درخواست قبلاً retry نشده بود
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        isRefreshing = false;
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        // ارسال refresh token در بدنه به شکل { refresh: "string" }
        const response = await axios.post(
          `${API_URL}/api/auth/identify/refresh/`,
          {
            refresh: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📦 پاسخ رفرش:", response.data);

        // استخراج توکن از response.data.data (بر اساس ساختار پاسخ شما)
        const newAccessToken = response.data?.data?.access;

        if (!newAccessToken) {
          throw new Error("No access token received");
        }

        console.log("✅ توکن جدید دریافت شد:", newAccessToken);

        localStorage.setItem("accessToken", newAccessToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.log("❌ خطا در رفرش توکن:", refreshError);
        console.log("❌ جزئیات خطا:", refreshError.response?.data);

        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;