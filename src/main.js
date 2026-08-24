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
