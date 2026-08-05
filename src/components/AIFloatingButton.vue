<template>
  <!-- 可拖动浮窗按钮 -->
  <div
    v-show="!chatOpen"
    ref="floatRef"
    class="ai-float"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @mousedown="onDragStart"
    @click="onFloatClick"
  >
    <svg class="ai-float-icon" viewBox="0 0 48 48" fill="none">
      <ellipse cx="20" cy="30" rx="14" ry="11" fill="currentColor" opacity="0.9"/>
      <path d="M28 24 C30 16, 34 12, 36 10 C38 8, 38 6, 36 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="36" cy="5" r="4.5" fill="currentColor"/>
      <path d="M40 5 L45 4 L45 7 Z" fill="currentColor" opacity="0.7"/>
      <circle cx="37" cy="4" r="1" fill="var(--bg-secondary, #fff)"/>
      <ellipse cx="16" cy="28" rx="7" ry="5" fill="currentColor" opacity="0.5"/>
    </svg>
    <span class="ai-float-pulse"></span>
    <span class="ai-float-ring"></span>
  </div>

  <!-- 对话弹窗 -->
  <transition name="ai-chat">
    <div v-if="chatOpen" ref="chatRef" class="ai-chat" :style="{ left: chatPos.x + 'px', top: chatPos.y + 'px' }">
      <div class="ai-chat-glow"></div>

      <!-- 标题栏 -->
      <div class="ai-chat-header" @mousedown="onChatDragStart">
        <div class="ai-chat-title">
          <svg class="ai-chat-title-icon" viewBox="0 0 48 48" fill="none">
            <ellipse cx="20" cy="30" rx="14" ry="11" fill="currentColor" opacity="0.9"/>
            <path d="M28 24 C30 16, 34 12, 36 10 C38 8, 38 6, 36 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
            <circle cx="36" cy="5" r="4.5" fill="currentColor"/>
            <path d="M40 5 L45 4 L45 7 Z" fill="currentColor" opacity="0.7"/>
          </svg>
          <span>R-Goose AI</span>
        </div>
        <div class="ai-chat-toolbar">
          <div class="ai-chat-modes">
            <button class="ai-chat-mode-btn" :class="{ active: panelMode === 'chat' && activeConvo?.mode === 'chat', disabled: loading }" :disabled="loading" @click="!loading && switchPanel('chat')" title="对话模式">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="ai-chat-mode-btn" :class="{ active: panelMode === 'chat' && activeConvo?.mode === 'image', disabled: loading }" :disabled="loading" @click="!loading && switchPanel('image')" title="生成图片">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button class="ai-chat-mode-btn" :class="{ active: panelMode === 'calc' }" @click="switchPanel('calc')" title="计算器">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
            </button>
            <div class="ai-chat-mode-divider"></div>
            <button v-if="panelMode === 'chat'" class="ai-chat-mode-btn" :class="{ disabled: loading }" :disabled="loading" @click="!loading && newChat()" title="新建对话">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <button class="ai-chat-close" @click="chatOpen = false">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>
          </button>
        </div>
      </div>

      <!-- 计算器面板 -->
      <div v-if="panelMode === 'calc'" class="ai-calc">
        <div class="ai-calc-display">
          <div class="ai-calc-expr">{{ calcExpr || '0' }}</div>
          <div v-if="calcResult !== null" class="ai-calc-result">{{ calcResult }}</div>
        </div>
        <div class="ai-calc-grid">
          <button class="ai-calc-btn ai-calc-fn" @click="calcClear">C</button>
          <button class="ai-calc-btn ai-calc-fn" @click="calcBack">⌫</button>
          <button class="ai-calc-btn ai-calc-fn" @click="calcInput('%')">%</button>
          <button class="ai-calc-btn ai-calc-op" @click="calcInput('÷')">÷</button>
          <button class="ai-calc-btn" @click="calcInput('7')">7</button>
          <button class="ai-calc-btn" @click="calcInput('8')">8</button>
          <button class="ai-calc-btn" @click="calcInput('9')">9</button>
          <button class="ai-calc-btn ai-calc-op" @click="calcInput('×')">×</button>
          <button class="ai-calc-btn" @click="calcInput('4')">4</button>
          <button class="ai-calc-btn" @click="calcInput('5')">5</button>
          <button class="ai-calc-btn" @click="calcInput('6')">6</button>
          <button class="ai-calc-btn ai-calc-op" @click="calcInput('-')">−</button>
          <button class="ai-calc-btn" @click="calcInput('1')">1</button>
          <button class="ai-calc-btn" @click="calcInput('2')">2</button>
          <button class="ai-calc-btn" @click="calcInput('3')">3</button>
          <button class="ai-calc-btn ai-calc-op" @click="calcInput('+')">+</button>
          <button class="ai-calc-btn ai-calc-zero" @click="calcInput('0')">0</button>
          <button class="ai-calc-btn" @click="calcInput('.')">.</button>
          <button class="ai-calc-btn ai-calc-eq" @click="calcEquals">=</button>
        </div>
        <div v-if="calcHistory.length" class="ai-calc-history">
          <div class="ai-calc-history-title">历史记录</div>
          <div v-for="(h, i) in calcHistory" :key="i" class="ai-calc-history-item" @click="calcExpr = h.expr">
            <span class="ai-calc-history-expr">{{ h.expr }}</span>
            <span class="ai-calc-history-eq">= {{ h.result }}</span>
          </div>
        </div>
      </div>

      <!-- 对话面板 -->
      <div v-else class="ai-chat-body">
        <!-- 对话侧边栏 -->
        <div v-if="conversations.length > 1" class="ai-conv-sidebar">
          <button
            v-for="c in conversations"
            :key="c.id"
            class="ai-conv-tab"
            :class="{ active: c.id === activeId, disabled: loading }"
            :title="c.title"
            @click="!loading && switchChat(c.id)"
          >
            <span class="ai-conv-dot" :class="c.mode"></span>
            <span class="ai-conv-label">{{ c.title }}</span>
            <button v-if="conversations.length > 1" class="ai-conv-del" @click.stop="deleteChat(c.id)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6L18 18M18 6L6 18"/></svg>
            </button>
          </button>
        </div>

        <!-- 消息区 -->
        <div ref="messagesRef" class="ai-chat-messages">
          <div v-if="messages.length === 0" class="ai-chat-welcome">
            <div class="ai-welcome-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <ellipse cx="20" cy="30" rx="14" ry="11" fill="currentColor" opacity="0.15"/>
                <path d="M28 24 C30 16, 34 12, 36 10 C38 8, 38 6, 36 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.15"/>
                <circle cx="36" cy="5" r="4.5" fill="currentColor" opacity="0.15"/>
                <ellipse cx="16" cy="28" rx="7" ry="5" fill="currentColor" opacity="0.08"/>
              </svg>
            </div>
            <p class="ai-welcome-title">{{ activeConvo?.mode === 'image' ? 'AI 图片生成' : '有什么可以帮你的？' }}</p>
            <p class="ai-welcome-sub">{{ activeConvo?.mode === 'image' ? '描述你想要的图片，AI 帮你创作' : '输入问题，或试试下面的快捷操作' }}</p>
            <div class="ai-chat-suggestions">
              <button v-for="s in (activeConvo?.mode === 'image' ? imageSuggestions : chatSuggestions)" :key="s" @click="quickAsk(s)">
                <span class="ai-suggestion-dot"></span>{{ s }}
              </button>
            </div>
          </div>

          <div v-for="(msg, i) in messages" :key="i" class="ai-msg" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="ai-msg-avatar">
              <svg viewBox="0 0 48 48" fill="none">
                <ellipse cx="20" cy="30" rx="14" ry="11" fill="currentColor" opacity="0.8"/>
                <path d="M28 24 C30 16, 34 12, 36 10 C38 8, 38 6, 36 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
                <circle cx="36" cy="5" r="4.5" fill="currentColor"/>
              </svg>
            </div>
            <div class="ai-msg-content">
              <div v-if="msg.image" class="ai-msg-image-wrap">
                <img :src="msg.image" class="ai-msg-image" @click="previewImage(msg.image)" />
                <div class="ai-msg-image-overlay"><span>{{ msg.prompt }}</span></div>
                <div class="ai-msg-actions">
                  <button @click="saveToMedia(msg)" :class="{ saved: msg.saved, error: msg.saveError }" :disabled="msg.saving">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span>{{ msg.saving ? '保存中…' : msg.saveError ? msg.saveError : msg.saved ? '已保存' : '存素材库' }}</span>
                  </button>
                  <button @click="copyImage(msg)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>复制</span>
                  </button>
                </div>
              </div>
              <div v-else-if="msg.role === 'assistant'" class="ai-msg-bubble ai-msg-bubble-ai" :class="{ 'ai-msg-error': msg.isError }">
                <span v-html="renderMarkdown(msg.content)"></span>
                <button v-if="msg.isError" class="ai-msg-retry" @click="retrySend(msg)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  重试
                </button>
              </div>
              <div v-else class="ai-msg-bubble ai-msg-bubble-user">{{ msg.content }}</div>
            </div>
            <button v-if="msg.role === 'assistant' && msg.content && !msg.image && !msg.isError" class="ai-msg-copy" @click="copyText(msg.content)" title="复制">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>

          <div v-if="loading" class="ai-msg assistant">
            <div class="ai-msg-avatar">
              <svg viewBox="0 0 48 48" fill="none">
                <ellipse cx="20" cy="30" rx="14" ry="11" fill="currentColor" opacity="0.8"/>
                <path d="M28 24 C30 16, 34 12, 36 10 C38 8, 38 6, 36 5" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
                <circle cx="36" cy="5" r="4.5" fill="currentColor"/>
              </svg>
            </div>
            <div class="ai-msg-content">
              <div class="ai-msg-bubble ai-msg-bubble-ai"><div class="ai-typing"><span></span><span></span><span></span></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区（仅对话模式） -->
      <div v-if="panelMode === 'chat'" class="ai-chat-input-area">
        <div class="ai-chat-input-wrap">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="ai-chat-input"
            :placeholder="activeConvo?.mode === 'image' ? '描述图片… 如：白鹅在湖面游泳，水彩风格' : '发送消息…  (Shift+Enter 换行)'"
            rows="1"
            @keydown.enter.exact.prevent="send"
            @input="autoGrow"
          ></textarea>
          <button class="ai-chat-send" :disabled="!inputText.trim() || loading" @click="send">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
        <div class="ai-chat-hint">
          <span class="ai-hint-dot" :class="activeConvo?.mode"></span>
          {{ activeConvo?.mode === 'image' ? '图片生成模式' : '智能对话模式' }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { saveImage } from '@/utils/imageStore'
import { useToast } from '@/composables/useToast'

const STORAGE_KEY = 'ai_conversations'
const ACTIVE_KEY = 'ai_active_convo'

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [{ id: Date.now(), title: '新对话', messages: [], mode: 'chat', createdAt: Date.now() }]
}

const floatRef = ref(null)
const chatRef = ref(null)
const messagesRef = ref(null)
const inputRef = ref(null)

const chatOpen = ref(false)
const inputText = ref('')
const loading = ref(false)
const panelMode = ref('chat') // 'chat' | 'calc'
let currentAbortController = null // 全局请求锁，保证同时只有一个 AI 请求

// ===== 计算器 =====
const calcExpr = ref('')
const calcResult = ref(null)
const calcHistory = ref([])

function calcInput(val) {
  calcResult.value = null
  // 防止连续运算符
  const ops = ['+', '-', '×', '÷', '%']
  if (ops.includes(val) && ops.includes(calcExpr.value.slice(-1))) {
    calcExpr.value = calcExpr.value.slice(0, -1) + val
    return
  }
  calcExpr.value += val
}

function calcClear() {
  calcExpr.value = ''
  calcResult.value = null
}

function calcBack() {
  calcExpr.value = calcExpr.value.slice(0, -1)
  calcResult.value = null
}

function calcEquals() {
  if (!calcExpr.value) return
  try {
    let expr = calcExpr.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/%/g, '/100')
    // 安全计算：只允许数字和运算符
    if (!/^[0-9+\-*/.()\s]+$/.test(expr)) throw new Error('invalid')
    const result = Function('"use strict"; return (' + expr + ')')()
    const rounded = Math.round(result * 1e10) / 1e10
    calcResult.value = rounded
    calcHistory.value.unshift({ expr: calcExpr.value, result: rounded })
    if (calcHistory.value.length > 10) calcHistory.value.pop()
  } catch {
    calcResult.value = '错误'
  }
}

// ===== 面板切换 =====
function switchPanel(target) {
  if (target === 'calc') {
    panelMode.value = 'calc'
    return
  }
  // 切回对话/图片模式
  panelMode.value = 'chat'
  setMode(target)
}

const chatSuggestions = ['帮我润色一段文字', '总结我的笔记要点', '给我一些写作灵感']
const imageSuggestions = ['白鹅在湖面游泳，水彩画风格', '简约森林背景图，绿色调', '抽象几何图案，蓝白配色']

// ===== 多对话管理 =====
const conversations = ref(loadConversations())
const activeId = ref(Number(localStorage.getItem(ACTIVE_KEY)) || conversations.value[0].id)
const activeConvo = computed(() => conversations.value.find(c => c.id === activeId.value) || conversations.value[0])
const messages = computed(() => activeConvo.value?.messages || [])

// 持久化
watch(conversations, (val) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) } catch { /* ignore */ }
}, { deep: true })
watch(activeId, (val) => {
  try { localStorage.setItem(ACTIVE_KEY, String(val)) } catch { /* ignore */ }
})

const pos = reactive({ x: 0, y: 0 })
const chatPos = reactive({ x: 0, y: 0 })
let dragging = null
let moved = false

onMounted(() => {
  const margin = 24
  pos.x = window.innerWidth - 72 - margin
  pos.y = window.innerHeight - 72 - margin
  chatPos.x = window.innerWidth - 420 - margin
  chatPos.y = window.innerHeight - 560 - margin
})

function onFloatClick() {
  if (moved) { moved = false; return }
  chatOpen.value = true
  nextTick(() => {
    chatPos.x = pos.x - 348
    chatPos.y = pos.y - 470
    chatPos.x = Math.max(12, Math.min(chatPos.x, window.innerWidth - 400))
    chatPos.y = Math.max(12, Math.min(chatPos.y, window.innerHeight - 100))
    inputRef.value?.focus()
  })
}

function onDragStart(e) {
  dragging = { mode: 'float', dx: e.clientX - pos.x, dy: e.clientY - pos.y }
  moved = false
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
function onChatDragStart(e) {
  dragging = { mode: 'chat', dx: e.clientX - chatPos.x, dy: e.clientY - chatPos.y }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
function onDragMove(e) {
  if (!dragging) return
  moved = true
  const target = dragging.mode === 'float' ? pos : chatPos
  target.x = Math.max(0, Math.min(e.clientX - dragging.dx, window.innerWidth - 60))
  target.y = Math.max(0, Math.min(e.clientY - dragging.dy, window.innerHeight - 60))
}
function onDragEnd() {
  dragging = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function setMode(m) {
  const convo = activeConvo.value
  if (!convo || convo.mode === m) return

  // 如果当前对话已有消息，保留它并新建一个目标模式的空对话
  if (convo.messages.length > 0) {
    const c = { id: Date.now(), title: '新对话', messages: [], mode: m, createdAt: Date.now() }
    conversations.value.push(c)
    activeId.value = c.id
  } else {
    // 当前对话没消息，直接改模式
    convo.mode = m
  }
}

function newChat() {
  const c = { id: Date.now(), title: '新对话', messages: [], mode: activeConvo.value?.mode || 'chat', createdAt: Date.now() }
  conversations.value.push(c)
  activeId.value = c.id
  inputText.value = ''
  nextTick(() => inputRef.value?.focus())
}

function switchChat(id) {
  activeId.value = id
  nextTick(() => { scrollToBottom(); inputRef.value?.focus() })
}

function deleteChat(id) {
  const idx = conversations.value.findIndex(c => c.id === id)
  if (idx === -1) return
  conversations.value.splice(idx, 1)
  if (conversations.value.length === 0) {
    // 删除最后一个对话，关闭弹窗
    chatOpen.value = false
    newChat()
  } else if (activeId.value === id) {
    // 删除的是当前对话，关闭弹窗
    chatOpen.value = false
    activeId.value = conversations.value[Math.min(idx, conversations.value.length - 1)].id
  }
}

function autoGrow() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function quickAsk(text) {
  inputText.value = text
  send()
}

function retrySend(msg) {
  // 从对话中删除错误消息
  const convo = activeConvo.value
  if (!convo) return
  const idx = convo.messages.indexOf(msg)
  if (idx !== -1) convo.messages.splice(idx, 1)
  // 用原始 prompt 重试
  inputText.value = msg.retryPrompt
  send()
}

async function send() {
  const text = inputText.value.trim()
  // 严格保证同时只有一个请求
  if (!text || loading.value) return

  const convo = activeConvo.value
  if (!convo) return

  // 第一条消息时更新对话标题
  if (convo.messages.length === 0) convo.title = text.slice(0, 16)

  convo.messages.push({ role: 'user', content: text })
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'
  loading.value = true

  // 中止之前未完成的请求
  if (currentAbortController) currentAbortController.abort()
  currentAbortController = new AbortController()

  scrollToBottom()

  try {
    if (convo.mode === 'image') {
      const imageUrl = await callImageGen(text, currentAbortController.signal)
      convo.messages.push({ role: 'assistant', content: '已生成图片', image: imageUrl, prompt: text })
    } else {
      const reply = await callAI(text, convo.messages, currentAbortController.signal)
      convo.messages.push({ role: 'assistant', content: reply })
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // 被新请求中止，不显示错误
    } else {
      convo.messages.push({ role: 'assistant', content: `请求失败：${err.message}\n\n请检查 API Key 配置（设置 → AI 设置），或稍后重试。`, isError: true, retryPrompt: text, retryMode: convo.mode })
    }
  } finally {
    loading.value = false
    currentAbortController = null
    scrollToBottom()
  }
}

async function fetchWithRetry(url, options, signal, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetch(url, { ...options, signal })
    if (response.ok) return response
    if (response.status === 429 && i < maxRetries) {
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)))
      continue
    }
    throw new Error(`HTTP ${response.status}`)
  }
}

async function callAI(prompt, history, signal) {
  const apiKey = localStorage.getItem('ai_api_key') || ''
  const baseUrl = localStorage.getItem('ai_base_url') || 'https://open.bigmodel.cn/api/paas/v4'
  const model = localStorage.getItem('ai_model') || 'glm-4-flash'
  const msgs = history.filter(m => m.content && !m.image).map(m => ({ role: m.role, content: m.content }))
  msgs.push({ role: 'user', content: prompt })

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, temperature: 0.7, max_tokens: 2048 })
  }, signal)
  const data = await response.json()
  return data.choices?.[0]?.message?.content || '(空回复)'
}

async function callImageGen(prompt, signal) {
  const apiKey = localStorage.getItem('ai_api_key') || ''
  const baseUrl = localStorage.getItem('ai_base_url') || 'https://open.bigmodel.cn/api/paas/v4'
  const model = localStorage.getItem('ai_image_model') || 'cogview-3-flash'
  const response = await fetchWithRetry(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt })
  }, signal)
  const data = await response.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('未返回图片')
  return url
}

async function downloadAsDataUrl(url) {
  // Electron IPC 模式：通过主进程下载（绕过 CORS）
  if (window.electronAPI?.backend) {
    const result = await window.electronAPI.backend('backend:images:fetchRemote', url)
    return `data:${result.mimeType};base64,${result.base64}`
  }
  // 浏览器模式：通过后端代理
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
  const resp = await fetch(proxyUrl)
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function saveToMedia(msg) {
  if (msg.saved) return
  msg.saving = true
  try {
    const dataUrl = msg.image.startsWith('http') ? await downloadAsDataUrl(msg.image) : msg.image
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const name = `AI生成_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
    msg.savedRef = await saveImage(dataUrl, name)
    msg.saved = true
    // toast 提示
    const { success } = useToast()
    success('已保存到素材库')
    // 通知素材库刷新
    window.dispatchEvent(new CustomEvent('media-library-changed'))
  } catch (err) {
    console.error('保存失败:', err)
    msg.saveError = err.message || '保存失败'
    setTimeout(() => { msg.saveError = null }, 5000)
  } finally {
    msg.saving = false
  }
}

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType })
}

async function copyImage(msg) {
  try {
    const dataUrl = msg.image.startsWith('http') ? await downloadAsDataUrl(msg.image) : msg.image
    const blob = dataUrlToBlob(dataUrl)
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  } catch {
    try { navigator.clipboard.writeText(msg.image) } catch { /* ignore */ }
  }
}

function previewImage(url) { window.open(url, '_blank') }
function scrollToBottom() { nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight }) }
function copyText(text) { navigator.clipboard.writeText(text) }

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre class="ai-code-block"><code>${escapeHtml(c.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<div class="ai-md-h3">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="ai-md-h2">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="ai-md-h1">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="ai-md-li">$1</div>')
    .replace(/\n/g, '<br>')
}
function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
</script>

<style scoped>
/* ===== 浮窗按钮 ===== */
.ai-float {
  position: fixed; width: 54px; height: 54px; z-index: 9998;
  cursor: grab; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #2a6b4a));
  border-radius: 50%;
  box-shadow: 0 6px 20px -6px color-mix(in srgb, var(--primary-color) 55%, rgba(0,0,0,.25)), 0 0 0 1px color-mix(in srgb, var(--primary-color) 20%, transparent);
  transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
  user-select: none;
}
.ai-float:hover { transform: scale(1.1) rotate(-5deg); box-shadow: 0 8px 28px -6px color-mix(in srgb, var(--primary-color) 65%, rgba(0,0,0,.3)); }
.ai-float:active { cursor: grabbing; transform: scale(0.92); }
.ai-float-icon { width: 34px; height: 34px; color: #fff; pointer-events: none; }
.ai-float-pulse { position: absolute; top: 3px; right: 3px; width: 11px; height: 11px; border-radius: 50%; background: #4ade80; border: 2.5px solid var(--bg-secondary, #fff); animation: ai-pulse 2s ease-in-out infinite; }
.ai-float-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--primary-color) 30%, transparent); animation: ai-ring 3s ease-out infinite; }
@keyframes ai-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
@keyframes ai-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }

/* ===== 弹窗容器 ===== */
.ai-chat {
  position: fixed; width: 400px; z-index: 9999;
  display: flex; flex-direction: column;
  background: var(--bg-secondary, #fff);
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, var(--border-color, #e0e0e0));
  border-radius: 20px;
  box-shadow: 0 20px 60px -12px rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.5) inset;
  overflow: hidden; backdrop-filter: blur(20px);
}
.ai-chat-glow { position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent 70%); pointer-events: none; z-index: 0; }

/* ===== 标题栏 ===== */
.ai-chat-header {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 92%, #000 8%), color-mix(in srgb, var(--primary-color) 65%, #1a5a3a));
  color: #fff; cursor: grab; user-select: none;
}
.ai-chat-header:active { cursor: grabbing; }
.ai-chat-title { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15px; letter-spacing: .02em; }
.ai-chat-title-icon { width: 22px; height: 22px; color: #fff; }
.ai-chat-toolbar { display: flex; align-items: center; gap: 8px; }
.ai-chat-modes { display: flex; align-items: center; gap: 3px; }
.ai-chat-mode-divider { width: 1px; height: 18px; background: rgba(255,255,255,.2); margin: 0 3px; }
.ai-chat-mode-btn { background: rgba(255,255,255,.12); border: none; border-radius: 8px; width: 30px; height: 30px; color: rgba(255,255,255,.65); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.ai-chat-mode-btn:hover { background: rgba(255,255,255,.25); color: #fff; }
.ai-chat-mode-btn.active { background: rgba(255,255,255,.28); color: #fff; box-shadow: 0 0 12px -2px rgba(255,255,255,.3); }
.ai-chat-mode-btn.disabled { opacity: .35; cursor: not-allowed; pointer-events: none; }
.ai-chat-close { background: rgba(255,255,255,.12); border: none; border-radius: 8px; width: 30px; height: 30px; color: rgba(255,255,255,.7); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.ai-chat-close:hover { background: rgba(255,80,80,.4); color: #fff; }

/* ===== Body：侧边栏 + 消息区 ===== */
.ai-chat-body { position: relative; z-index: 1; flex: 1; display: flex; overflow: hidden; }

/* ===== 对话侧边栏 ===== */
.ai-conv-sidebar {
  flex-shrink: 0; width: 44px; display: flex; flex-direction: column;
  gap: 4px; padding: 8px 4px;
  background: color-mix(in srgb, var(--primary-color) 4%, var(--bg-tertiary, #f8f8f8));
  border-right: 1px solid var(--border-light, rgba(0,0,0,.04));
  overflow-y: auto; scrollbar-width: none;
}
.ai-conv-sidebar::-webkit-scrollbar { display: none; }
.ai-conv-tab {
  position: relative; width: 100%; padding: 8px 6px; border: none; border-radius: 8px;
  background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;
  transition: all .15s;
}
.ai-conv-tab:hover { background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
.ai-conv-tab.disabled { opacity: .45; cursor: not-allowed; }
.ai-conv-tab.active { background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
.ai-conv-tab.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; border-radius: 2px; background: var(--primary-color); }
.ai-conv-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary-color); flex-shrink: 0; }
.ai-conv-dot.image { background: #d97706; }
.ai-conv-label { font-size: 9px; color: var(--text-tertiary); text-align: center; line-height: 1.2; word-break: break-all; max-width: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ai-conv-tab.active .ai-conv-label { color: var(--primary-color); font-weight: 600; }
.ai-conv-del { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border: none; border-radius: 50%; background: rgba(0,0,0,.06); color: var(--text-tertiary); cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0; }
.ai-conv-tab:hover .ai-conv-del { display: flex; }
.ai-conv-del:hover { background: rgba(239,68,68,.2); color: #ef4444; }

/* ===== 消息区 ===== */
.ai-chat-messages { flex: 1; overflow-y: auto; padding: 20px 16px; max-height: 420px; min-height: 220px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--primary-color) 30%, transparent) transparent; user-select: text; }
.ai-chat-messages::-webkit-scrollbar { width: 5px; }
.ai-chat-messages::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--primary-color) 25%, transparent); border-radius: 3px; }

/* ===== 欢迎页 ===== */
.ai-chat-welcome { text-align: center; padding: 28px 12px; }
.ai-welcome-icon { width: 56px; height: 56px; margin: 0 auto 14px; color: var(--primary-color); }
.ai-welcome-icon svg { width: 100%; height: 100%; }
.ai-welcome-title { font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.ai-welcome-sub { font-size: 13px; color: var(--text-tertiary); margin-bottom: 20px; }
.ai-chat-suggestions { display: flex; flex-direction: column; gap: 8px; }
.ai-chat-suggestions button { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 12px; font-size: 13px; background: color-mix(in srgb, var(--primary-color) 5%, var(--bg-tertiary, #f8f8f8)); color: var(--text-secondary); border: 1px solid color-mix(in srgb, var(--primary-color) 10%, transparent); cursor: pointer; transition: all .15s; text-align: left; }
.ai-chat-suggestions button:hover { background: color-mix(in srgb, var(--primary-color) 10%, transparent); border-color: color-mix(in srgb, var(--primary-color) 30%, transparent); transform: translateX(2px); }
.ai-suggestion-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); flex-shrink: 0; opacity: .6; }

/* ===== 消息气泡 ===== */
.ai-msg { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px; animation: ai-msg-in .3s ease; }
.ai-msg.user { flex-direction: row-reverse; }
@keyframes ai-msg-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.ai-msg-avatar { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-soft, rgba(90,158,122,.1)), color-mix(in srgb, var(--primary-color) 15%, transparent)); color: var(--primary-color); display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.ai-msg-avatar svg { width: 18px; height: 18px; }
.ai-msg-content { max-width: 80%; }
.ai-msg-bubble { padding: 11px 15px; border-radius: 16px; font-size: 13.5px; line-height: 1.65; word-break: break-word; }
.ai-msg-bubble-ai { background: var(--bg-tertiary, #f5f5f5); color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--border-light, rgba(0,0,0,.04)); }
.ai-msg-error { border-color: rgba(239,68,68,.2); background: color-mix(in srgb, #ef4444 6%, var(--bg-tertiary, #f5f5f5)); }
.ai-msg-retry { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; padding: 6px 14px; border: 1.5px solid var(--primary-color); border-radius: 8px; background: transparent; color: var(--primary-color); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
.ai-msg-retry:hover { background: var(--primary-color); color: #fff; }
.ai-msg-retry:active { transform: scale(.95); }
.ai-msg-bubble-user { background: linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 75%, #2a6b4a)); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 12px -3px color-mix(in srgb, var(--primary-color) 40%, transparent); }
.ai-msg-copy { flex-shrink: 0; width: 24px; height: 24px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary, #bbb); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all .15s; margin-top: 4px; }
.ai-msg.assistant:hover .ai-msg-copy { opacity: 1; }
.ai-msg-copy:hover { background: var(--bg-tertiary, #eee); color: var(--primary-color); }

/* ===== 图片消息 ===== */
.ai-msg-image-wrap { border-radius: 16px; overflow: hidden; background: var(--bg-tertiary, #f5f5f5); border: 1px solid var(--border-light, rgba(0,0,0,.04)); box-shadow: 0 4px 16px -4px rgba(0,0,0,.1); }
.ai-msg-image { width: 100%; max-height: 280px; object-fit: contain; cursor: pointer; display: block; transition: transform .3s; }
.ai-msg-image:hover { transform: scale(1.02); }
.ai-msg-image-overlay { padding: 8px 12px; font-size: 11px; color: var(--text-tertiary); background: var(--bg-tertiary); border-bottom: 1px solid var(--border-light, rgba(0,0,0,.04)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-msg-actions { display: flex; gap: 6px; padding: 8px; }
.ai-msg-actions button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 8px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; background: var(--bg-secondary, #fff); color: var(--text-secondary, #666); font-size: 11.5px; cursor: pointer; transition: all .15s; }
.ai-msg-actions button:hover { border-color: var(--primary-color); color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 6%, transparent); }
.ai-msg-actions button.saved { border-color: #4ade80; color: #22c55e; }
.ai-msg-actions button.error { border-color: #ef4444; color: #ef4444; }
.ai-msg-actions button:disabled { opacity: .6; cursor: wait; }

/* ===== 加载动画 ===== */
.ai-typing { display: flex; gap: 5px; padding: 4px 0; }
.ai-typing span { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary, #bbb); animation: ai-bounce 1.2s ease-in-out infinite; }
.ai-typing span:nth-child(2){animation-delay:.15s}
.ai-typing span:nth-child(3){animation-delay:.3s}
@keyframes ai-bounce { 0%,60%,100%{transform:translateY(0);opacity:.35} 30%{transform:translateY(-7px);opacity:1} }

/* ===== Markdown ===== */
.ai-msg-bubble :deep(.ai-md-h1){font-size:15px;font-weight:700;margin:6px 0 4px}
.ai-msg-bubble :deep(.ai-md-h2){font-size:14px;font-weight:600;margin:5px 0 3px}
.ai-msg-bubble :deep(.ai-md-h3){font-size:13px;font-weight:600;margin:4px 0 2px}
.ai-msg-bubble :deep(.ai-md-li){padding-left:14px;position:relative;margin:2px 0}
.ai-msg-bubble :deep(.ai-md-li)::before{content:'·';position:absolute;left:4px;color:var(--primary-color)}
.ai-msg-bubble :deep(.ai-inline-code){background:color-mix(in srgb,var(--primary-color) 12%,transparent);padding:1.5px 5px;border-radius:4px;font-size:12px;font-family:'SF Mono',Consolas,monospace}
.ai-msg-bubble :deep(.ai-code-block){background:color-mix(in srgb,#1a1a2e 92%,#000);border-radius:8px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-size:12px;border:1px solid rgba(255,255,255,.06)}
.ai-msg-bubble :deep(.ai-code-block code){font-family:'SF Mono',Consolas,monospace;color:#e0e0e0}

/* ===== 输入区 ===== */
.ai-chat-input-area { position: relative; z-index: 1; padding: 12px 14px 10px; border-top: 1px solid var(--border-light, rgba(0,0,0,.04)); background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--primary-color) 2%, var(--bg-secondary))); }
.ai-chat-input-wrap { display: flex; gap: 8px; align-items: flex-end; }
.ai-chat-input {
  flex: 1; border: 1.5px solid var(--border-color, #ddd); border-radius: 14px;
  padding: 10px 14px; font-size: 13.5px; font-family: inherit; resize: none; outline: none;
  background: var(--bg-primary, #fff); color: var(--text-primary);
  transition: border-color .15s, box-shadow .15s; line-height: 1.5; max-height: 120px;
  overflow: hidden;
}
.ai-chat-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent); }
.ai-chat-input::placeholder { color: var(--text-tertiary); }
.ai-chat-send {
  flex-shrink: 0; width: 38px; height: 38px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #2a6b4a));
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s cubic-bezier(.34,1.56,.64,1); box-shadow: 0 2px 10px -3px color-mix(in srgb, var(--primary-color) 50%, transparent);
}
.ai-chat-send:hover:not(:disabled) { transform: scale(1.08) rotate(-3deg); box-shadow: 0 4px 16px -3px color-mix(in srgb, var(--primary-color) 60%, transparent); }
.ai-chat-send:active:not(:disabled) { transform: scale(0.92); }
.ai-chat-send:disabled { opacity: .35; cursor: not-allowed; }
.ai-chat-hint { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 11px; color: var(--text-tertiary); padding-left: 4px; }
.ai-hint-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary-color); }
.ai-hint-dot.image { background: #d97706; }

/* ===== 过渡 ===== */
.ai-chat-enter-active, .ai-chat-leave-active { transition: opacity .2s ease, transform .25s cubic-bezier(.34,1.56,.64,1); }
.ai-chat-enter-from, .ai-chat-leave-to { opacity: 0; transform: scale(.92) translateY(12px); }

/* ===== 计算器 ===== */
.ai-calc { flex: 1; display: flex; flex-direction: column; padding: 16px; position: relative; z-index: 1; }
.ai-calc-display {
  background: color-mix(in srgb, var(--primary-color) 6%, var(--bg-tertiary, #f5f5f5));
  border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; text-align: right; min-height: 76px;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.ai-calc-expr { font-size: 15px; color: var(--text-secondary); word-break: break-all; min-height: 20px; }
.ai-calc-result { font-size: 28px; font-weight: 800; color: var(--primary-color); margin-top: 4px; }
.ai-calc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ai-calc-btn {
  border: none; border-radius: 12px; height: 48px; font-size: 17px; font-weight: 600; cursor: pointer;
  background: var(--bg-tertiary, #f0f0f0); color: var(--text-primary);
  transition: all .12s ease; display: flex; align-items: center; justify-content: center;
}
.ai-calc-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px -3px rgba(0,0,0,.15); }
.ai-calc-btn:active { transform: scale(.94); }
.ai-calc-zero { grid-column: span 2; }
.ai-calc-fn { background: color-mix(in srgb, var(--text-tertiary) 15%, transparent); color: var(--text-secondary); font-size: 15px; }
.ai-calc-op { background: color-mix(in srgb, var(--primary-color) 12%, transparent); color: var(--primary-color); }
.ai-calc-eq { background: linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #2a6b4a)); color: #fff; }
.ai-calc-history { margin-top: 14px; border-top: 1px solid var(--border-light, rgba(0,0,0,.06)); padding-top: 12px; max-height: 140px; overflow-y: auto; scrollbar-width: thin; }
.ai-calc-history::-webkit-scrollbar { width: 4px; }
.ai-calc-history::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--primary-color) 20%, transparent); border-radius: 2px; }
.ai-calc-history-title { font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600; }
.ai-calc-history-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background .12s; font-size: 13px; }
.ai-calc-history-item:hover { background: color-mix(in srgb, var(--primary-color) 6%, transparent); }
.ai-calc-history-expr { color: var(--text-secondary); }
.ai-calc-history-eq { font-weight: 700; color: var(--primary-color); }
</style>
