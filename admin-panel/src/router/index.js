import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      }
    ]
  },
  {
    path: '/navigation',
    component: Layout,
    meta: { title: '导航管理', icon: 'Menu' },
    children: [
      {
        path: 'categories',
        name: 'NavigationCategories',
        component: () => import('@/views/navigation/categories/index.vue'),
        meta: { title: '导航分类', icon: 'el-icon-menu' }
      }
    ]
  },
  {
    path: '/content',
    component: Layout,
    meta: { title: '内容管理', icon: 'Document' },
    children: [
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('@/views/content/banners/index.vue'),
        meta: { title: '轮播图管理', icon: 'Picture' }
      },
      {
        path: 'ads',
        name: 'Ads',
        component: () => import('@/views/content/ads/index.vue'),
        meta: { title: '广告管理', icon: 'Promotion' }
      }
    ]
  },
  {
    path: '/knowledge',
    component: Layout,
    meta: { title: '知识点管理', icon: 'Reading' },
    children: [
      {
        path: 'points',
        name: 'KnowledgePoints',
        component: () => import('@/views/knowledge/points/index.vue'),
        meta: { title: '知识点列表', icon: 'Collection' }
      },
      {
        path: 'categories',
        name: 'KnowledgeCategories',
        component: () => import('@/views/knowledge/categories/index.vue'),
        meta: { title: '知识点分类', icon: 'Files' }
      }
    ]
  },
  {
    path: '/questions',
    component: Layout,
    meta: { title: '题目管理', icon: 'EditPen' },
    children: [
      {
        path: 'list',
        name: 'QuestionsList',
        component: () => import('@/views/questions/list/index.vue'),
        meta: { title: '题目列表', icon: 'List' }
      },
      {
        path: 'create',
        name: 'QuestionsCreate',
        component: () => import('@/views/questions/create/index.vue'),
        meta: { title: '创建题目', icon: 'Plus' }
      },
      {
        path: 'create-enhanced',
        name: 'QuestionsCreateEnhanced',
        component: () => import('@/views/questions/create/enhanced.vue'),
        meta: { title: '增强创建', icon: 'MagicStick' }
      },
      {
        path: 'edit/:id',
        name: 'QuestionsEdit',
        component: () => import('@/views/questions/edit/index.vue'),
        meta: { title: '编辑题目', icon: 'Edit' },
        hidden: true
      },
      {
        path: 'categories',
        name: 'QuestionsCategories',
        component: () => import('@/views/questions/categories/index.vue'),
        meta: { title: '题目分类', icon: 'Folder' }
      }
    ]
  },
  {
    path: '/users',
    component: Layout,
    meta: { title: '用户管理', icon: 'User' },
    children: [
      {
        path: 'list',
        name: 'UsersList',
        component: () => import('@/views/users/list/index.vue'),
        meta: { title: '用户列表', icon: 'UserFilled' }
      },
      {
        path: 'stats',
        name: 'UsersStats',
        component: () => import('@/views/users/stats/index.vue'),
        meta: { title: '用户统计', icon: 'TrendCharts' }
      },
      {
        path: 'comments',
        name: 'UsersComments',
        component: () => import('@/views/users/comments/index.vue'),
        meta: { title: '用户评论', icon: 'ChatDotRound' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    meta: { title: '系统设置', icon: 'Setting' },
    children: [
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/system/settings.vue'),
        meta: { title: '系统设置', icon: 'setting' }
      },
      {
          path: 'security',
          name: 'Security',
          component: () => import('@/views/security/index.vue'),
          meta: { title: '安全中心', icon: 'lock' }
        },
        {
          path: 'security/login-logs',
          name: 'LoginLogs',
          component: () => import('@/views/security/login-logs.vue'),
          meta: { title: '登录日志', icon: 'document' }
        }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 这里可以添加登录验证逻辑
  next()
})

export default router