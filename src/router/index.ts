import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/teacher',
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
    },
    {
      path: '/teacher',
      name: 'teacher',
      component: () => import('@/views/TeacherView.vue'),
    },
    {
      path: '/student',
      name: 'student',
      component: () => import('@/views/StudentLogin.vue'),
    },
  ],
})

export default router
