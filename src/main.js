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

// 启动 splash 退出：等 Vue 挂载并完成首帧绘制后，保证最短展示时长再淡出移除
// （600ms 最短展示避免一闪而过；淡出期间 pointer-events 已关闭，不阻塞操作）
function dismissSplash() {
  const splash = document.getElementById('splash-screen')
  if (!splash) return
  const elapsed = Date.now() - (window.__splashStart || Date.now())
  setTimeout(() => {
    if (!document.getElementById('splash-screen')) return
    splash.classList.add('splash-hide')
    const remove = () => { try { splash.remove() } catch (e) {} }
    splash.addEventListener('transitionend', remove, { once: true })
    setTimeout(remove, 500)
  }, Math.max(0, 600 - elapsed))
}
requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
