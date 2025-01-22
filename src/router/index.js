import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/views/LoginPage.vue';
import Dashboard from '@/views/Dashboard.vue';
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/', // مسار افتراضي
    redirect: '/login', // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
