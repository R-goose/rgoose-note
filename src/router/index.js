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
    path: '/templates',
    name: 'Templates',
    component: () => import('@/views/TemplatesView.vue'),
    meta: { title: '模板' }
  },
  {
    path: '/templates/:id/edit',
    name: 'TemplateEditor',
    component: () => import('@/views/TemplateEditorView.vue'),
    meta: { title: '编辑模板' }
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

// 开发服务重新优化依赖、或应用更新后旧页面仍引用上一版 chunk 时，
// 动态路由可能加载失败。自动带着目标路由硬刷新一次，避免点击后停留在原页。
const ROUTE_CHUNK_RELOAD_KEY = 'rgoose-route-chunk-reload'
router.onError((error, to) => {
  const message = String(error?.message || error || '')
  if (!/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk\s+\S+\s+failed|Outdated Optimize Dep/i.test(message)) return

  const target = to?.fullPath || window.location.hash.replace(/^#/, '') || '/dashboard'
  if (sessionStorage.getItem(ROUTE_CHUNK_RELOAD_KEY) === target) return

  sessionStorage.setItem(ROUTE_CHUNK_RELOAD_KEY, target)
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${target}`)
  window.location.reload()
})

router.afterEach((to) => {
  if (sessionStorage.getItem(ROUTE_CHUNK_RELOAD_KEY) === to.fullPath) {
    sessionStorage.removeItem(ROUTE_CHUNK_RELOAD_KEY)
  }
  document.title = to.meta.title ? `${to.meta.title} - R-Goose Note` : 'R-Goose Note'
})

export default router
