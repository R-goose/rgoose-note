import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/notes'
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
    path: '/plans',
    name: 'Plans',
    component: () => import('@/views/PlansView.vue'),
    meta: { title: '计划' }
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
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' }
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
