import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('@/views/NotesView.vue'),
    meta: { title: '笔记' }
  },
  {
    path: '/note/:id',
    name: 'NoteEditor',
    component: () => import('@/views/NoteEditorView.vue'),
    meta: { title: '编辑笔记' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/TagsView.vue'),
    meta: { title: '标签' }
  },
  {
    path: '/media',
    name: 'Media',
    component: () => import('@/views/MediaView.vue'),
    meta: { title: '素材库' }
  },
  {
    path: '/trash',
    name: 'Trash',
    component: () => import('@/views/TrashView.vue'),
    meta: { title: '回收站' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' }
  },
  // 404 兜底：未知路径重定向到仪表盘
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - R-Goose Note` : 'R-Goose Note'
})

export default router
