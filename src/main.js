import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/global.css'

const app = createApp(App)

// 全局 IME 回车守卫：输入法组词确认的 Enter 不应触发任何回车提交逻辑
// （否则中文拼音未上屏完按回车会误提交：误建标签/误发消息/误建笔记等）
let imeEnterPending = false
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  if (e.isComposing || e.keyCode === 229) {
    imeEnterPending = true
    e.stopImmediatePropagation()
  } else {
    imeEnterPending = false
  }
}, true)
window.addEventListener('keyup', (e) => {
  if (e.key !== 'Enter') return
  if (imeEnterPending) {
    e.stopImmediatePropagation()
    imeEnterPending = false
  }
}, true)

app.use(createPinia())
app.use(router)

app.mount('#app')

// 启动 splash 退出：等 Vue 挂载并完成首帧绘制后，保证完整入场动画播完再淡出移除
// （入场分镜全长约 2.4s：色块聚拢→徽标砸落→色块坠落→标题/进度条弹出，
//   2500ms 最短展示确保动画完整播放；系统开启"减少动态效果"时缩短为 600ms）
function dismissSplash() {
  const splash = document.getElementById('splash-screen')
  if (!splash) return
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const minDuration = reduced ? 600 : 2500
  const elapsed = Date.now() - (window.__splashStart || Date.now())
  setTimeout(() => {
    if (!document.getElementById('splash-screen')) return
    splash.classList.add('splash-hide')
    const remove = () => { try { splash.remove() } catch (e) {} }
    splash.addEventListener('transitionend', remove, { once: true })
    setTimeout(remove, 500)
  }, Math.max(0, minDuration - elapsed))
}
requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
