import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: '/seminar',
        component: () => import('pages/seminar/SeminarPage.vue')
      },
      {
        path: '/seminar/guests',
        component: () => import('pages/seminar/GuestsPage.vue')
      },
      {
        path: '/xiangsheng',
        component: () => import('pages/xiangsheng/XiangshengPage.vue')
      },
      {
        path: '/xiangsheng/roles',
        component: () => import('pages/xiangsheng/RolesPage.vue')
      },
      {
        path: '/duanzi',
        component: () => import('pages/duanzi/DuanziPage.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
