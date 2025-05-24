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
      },
      {
        path: '/meme',
        component: () => import('pages/meme/MemePage.vue')
      },
      {
        path: '/chat',
        component: () => import('pages/chat/ChatPage.vue')
      },
      {
        path: '/english',
        component: () => import('pages/english/EnglishPage.vue')
      },
      {
        path: '/nianjing',
        component: () => import('pages/nianjing/NianjingPage.vue')
      },
      {
        path: '/search',
        component: () => import('pages/search/SearchPage.vue')
      },
      {
        path: '/post',
        component: () => import('pages/post/PostPage.vue')
      },
      {
        path: '/wechat/callback',
        component: () => import('pages/wechat/LoginCallbackPage.vue')
      },
      {
        path: '/wechat/login',
        component: () => import('pages/wechat/WechatLoginPage.vue')
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
