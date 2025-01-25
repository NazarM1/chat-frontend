import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://127.0.0.1:3456', // عنوان الـ API الأساسي
});

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
// instance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (
//       error.response &&
//       error.response.status === 401 &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = localStorage.getItem('refreshToken'); // قراءة الـ Refresh Token
//         const response = await axios.post('/api/token/refresh/', {
//           refresh: refreshToken,
//         });

//         // حفظ الـ Access Token الجديد
//         localStorage.setItem('accessToken', response.data.access);

//         // تحديث الطلب الأصلي بـ Access Token الجديد
//         originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
//         return instance(originalRequest); // إعادة إرسال الطلب الأصلي
//       } catch (err) {
//         console.error('Failed to refresh token:', err);
//         localStorage.clear();
//         window.location.href = '/login'; // إعادة التوجيه إلى صفحة تسجيل الدخول
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default instance;
