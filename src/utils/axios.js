import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://127.0.0.1:3456', // عنوان الـ API الأساسي
});

let isRefreshing = false;
let refreshSubscribers = [];

// دالة للاشتراك في قائمة الانتظار للحصول على التوكن الجديد
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// دالة لتسجيل الخروج
async function logout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await axios.post('/api/token/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    console.error("Error during logout API call:", error);
  } finally {
    localStorage.clear(); // مسح جميع البيانات المخزنة
    window.location.href = '/login'; // إعادة التوجيه إلى صفحة تسجيل الدخول
  }
}

// إضافة الـ Token إلى الهيدر لكل الطلبات
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // قراءة الـ Access Token من localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// اعتراض الاستجابات وتجديد الـ Access Token إذا انتهت صلاحيته
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newAccessToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('accessToken', newAccessToken);

        refreshSubscribers.forEach((cb) => cb(newAccessToken));
        refreshSubscribers = [];

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (err) {
        console.error('Failed to refresh token:', err);
        await logout(); // استدعاء تسجيل الخروج عند الفشل
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
