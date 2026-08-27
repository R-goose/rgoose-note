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
    <img class="ai-float-icon" src="/favicon.png" alt="R-Goose AI" />
  </div>

  <!-- 对话弹窗 -->
  <transition name="ai-chat">
    <div v-if="chatOpen" ref="chatRef" class="ai-chat" :style="{ left: chatPos.x + 'px', top: chatPos.y + 'px', width: chatSize.w + 'px', height: chatSize.h + 'px' }">
      <!-- 标题栏 -->
      <div class="ai-chat-header" @mousedown="onChatDragStart">
        <div class="ai-chat-title">
          <img class="ai-chat-title-icon" src="/favicon.png" alt="R-Goose AI" />
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
            <button class="ai-chat-mode-btn" :class="{ active: panelMode === 'chat' && activeConvo?.mode === 'video', disabled: loading }" :disabled="loading" @click="!loading && switchPanel('video')" title="生成视频">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
            <button class="ai-chat-mode-btn" :class="{ active: panelMode === 'calc' }" @click="switchPanel('calc')" title="计算器">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
            </button>
            <div class="ai-chat-mode-divider"></div>
            <button v-if="panelMode === 'chat'" class="ai-chat-mode-btn" :class="{ disabled: loading }" :disabled="loading" @click="!loading && newChat()" title="新建对话">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <button class="ai-chat-min" @click="chatOpen = false" title="缩小">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12 L19 12"/></svg>
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
        <div class="ai-calc-keyboard-hint">支持键盘输入 · 数字 / + - * / · Enter=计算 · Esc=清空</div>
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
              <img src="/favicon.png" alt="R-Goose AI" />
            </div>
            <p class="ai-welcome-title">{{ activeConvo?.mode === 'image' ? 'AI 图片生成' : activeConvo?.mode === 'video' ? 'AI 视频生成' : '有什么可以帮你的？' }}</p>
            <p class="ai-welcome-sub">{{ activeConvo?.mode === 'image' ? '描述你想要的图片，AI 帮你创作' : activeConvo?.mode === 'video' ? '描述想要的视频画面，AI 帮你生成（耗时较长）' : '输入问题，或试试下面的快捷操作' }}</p>
            <div class="ai-chat-suggestions">
              <button v-for="s in (activeConvo?.mode === 'image' ? imageSuggestions : activeConvo?.mode === 'video' ? videoSuggestions : chatSuggestions)" :key="s" @click="quickAsk(s)">
                <span class="ai-suggestion-dot"></span>{{ s }}
              </button>
            </div>
          </div>

          <div v-for="(msg, i) in messages" :key="i" class="ai-msg" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="ai-msg-avatar">
              <img src="/favicon.png" alt="AI" />
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
                  <button class="ai-msg-retry-btn" @click="regenerateMessage(msg)" :disabled="loading" title="重新生成">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    <span>重试</span>
                  </button>
                </div>
              </div>
              <div v-else-if="msg.video" class="ai-msg-image-wrap">
                <video :src="msg.video" class="ai-msg-image" controls @click="previewVideo(msg.video)"></video>
                <div class="ai-msg-image-overlay"><span>{{ msg.prompt }}</span></div>
                <div class="ai-msg-actions">
                  <button @click="saveVideoToMedia(msg)" :class="{ saved: msg.saved, error: msg.saveError }" :disabled="msg.saving">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span>{{ msg.saving ? '保存中…' : msg.saveError ? msg.saveError : msg.saved ? '已保存' : '存素材库' }}</span>
                  </button>
                  <button @click="copyVideo(msg)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>复制</span>
                  </button>
                  <button class="ai-msg-retry-btn" @click="regenerateMessage(msg)" :disabled="loading" title="重新生成">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    <span>重试</span>
                  </button>
                </div>
              </div>
              <div v-else-if="msg.role === 'assistant'" class="ai-msg-bubble ai-msg-bubble-ai" :class="{ 'ai-msg-error': msg.isError }">
                <span v-html="renderMarkdown(msg.content)"></span>
                <button v-if="msg.isError" class="ai-msg-retry" @click="retrySend(msg)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  重试
                </button>
                <button v-else class="ai-msg-retry ai-msg-retry-inline" @click="regenerateMessage(msg)" :disabled="loading" title="基于最新上下文重新生成">
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
              <img src="/favicon.png" alt="AI" />
            </div>
            <div class="ai-msg-content">
              <div class="ai-msg-bubble ai-msg-bubble-ai">
                <div class="ai-typing"><span></span><span></span><span></span></div>
                <button class="ai-msg-stop" @click="stopGeneration" title="停止生成">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  停止
                </button>
              </div>
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
            :placeholder="activeConvo?.mode === 'image' ? '描述图片… 如：白鹅在湖面游泳，水彩风格' : activeConvo?.mode === 'video' ? '描述视频画面… 如：白鹅在湖面游动' : '发送消息…  (Shift+Enter 换行)'"
            rows="1"
            @keydown.enter.exact.prevent="send"
            @input="autoGrow"
          ></textarea>
          <button v-if="loading" class="ai-chat-send ai-chat-stop" @click="stopGeneration" title="停止生成">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <button v-else class="ai-chat-send" :disabled="!inputText.trim()" @click="send">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
        <div class="ai-chat-hint">
          <span class="ai-hint-dot" :class="activeConvo?.mode"></span>
          {{ activeConvo?.mode === 'image' ? '图片生成模式' : activeConvo?.mode === 'video' ? '视频生成模式（耗时较长，请耐心等待）' : '智能对话模式' }}
        </div>
      </div>

      <!-- 拖拽缩放手柄 -->
      <div class="ai-chat-resize" @mousedown.stop.prevent="onResizeStart">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M9 1L1 9M9 5L5 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></svg>
      </div>
    </div>
  </transition>

  <!-- 图片放大预览遮罩 -->
  <Teleport to="body">
    <div v-if="previewImageUrl" class="ai-preview-overlay" @click="previewImageUrl = ''">
      <img :src="previewImageUrl" class="ai-preview-img" @click.stop />
      <button class="ai-preview-close" @click="previewImageUrl = ''" title="关闭">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div v-if="previewVideoUrl" class="ai-preview-overlay" @click="previewVideoUrl = ''">
      <video :src="previewVideoUrl" class="ai-preview-img" controls autoplay @click.stop></video>
      <button class="ai-preview-close" @click="previewVideoUrl = ''" title="关闭">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { saveImage } from '@/utils/imageStore'
import { useToast } from '@/composables/useToast'

const STORAGE_KEY = 'ai_conversations'
const ACTIVE_KEY = 'ai_active_convo'
const SIZE_KEY = 'ai_chat_size'
const MIN_W = 340
const MIN_H = 380
const DEFAULT_W = 880
const DEFAULT_H = 840

function loadSize() {
  try {
    const raw = localStorage.getItem(SIZE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && p.w >= MIN_W && p.h >= MIN_H) return { w: p.w, h: p.h }
    }
  } catch { /* ignore */ }
  return { w: DEFAULT_W, h: DEFAULT_H }
}

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
const videoSuggestions = ['一只白鹅在湖面游动，阳光明媚', '雨滴落在湖面，慢镜头', '云朵在天空中飘动，延时摄影']

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
const chatSize = reactive(loadSize())
let dragging = null
let moved = false

watch(chatSize, (val) => {
  try { localStorage.setItem(SIZE_KEY, JSON.stringify({ w: val.w, h: val.h })) } catch { /* ignore */ }
}, { deep: true })

onMounted(() => {
  const margin = 24
  pos.x = window.innerWidth - 72 - margin
  pos.y = window.innerHeight - 72 - margin
  chatPos.x = window.innerWidth - chatSize.w - margin
  chatPos.y = window.innerHeight - chatSize.h - margin
  window.addEventListener('keydown', onCalcKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onCalcKeydown)
  document.removeEventListener('pointerdown', onDocPointerDown)
})

// ===== 计算器键盘输入 =====
function onCalcKeydown(e) {
  if (!chatOpen.value || panelMode.value !== 'calc') return
  // 输入框聚焦时不拦截
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  const k = e.key
  // 数字
  if (k >= '0' && k <= '9') { calcInput(k); e.preventDefault(); return }
  // 运算符（键盘 * / 映射为 × ÷）
  if (k === '+') { calcInput('+'); e.preventDefault(); return }
  if (k === '-') { calcInput('-'); e.preventDefault(); return }
  if (k === '*') { calcInput('×'); e.preventDefault(); return }
  if (k === '/') { calcInput('÷'); e.preventDefault(); return }
  if (k === '%') { calcInput('%'); e.preventDefault(); return }
  if (k === '.') { calcInput('.'); e.preventDefault(); return }
  // 小括号
  if (k === '(' || k === ')') { calcInput(k); e.preventDefault(); return }
  // 等号 / 回车 = 计算
  if (k === '=' || k === 'Enter') { calcEquals(); e.preventDefault(); return }
  // 退格 = 删除
  if (k === 'Backspace') { calcBack(); e.preventDefault(); return }
  // Esc / Delete = 清空
  if (k === 'Escape' || k === 'Delete') { calcClear(); e.preventDefault(); return }
}

function onFloatClick() {
  if (moved) { moved = false; return }
  chatOpen.value = true
  nextTick(() => {
    chatPos.x = pos.x - chatSize.w + 36
    chatPos.y = pos.y - chatSize.h + 60
    chatPos.x = Math.max(12, Math.min(chatPos.x, window.innerWidth - chatSize.w - 12))
    chatPos.y = Math.max(12, Math.min(chatPos.y, window.innerHeight - chatSize.h - 12))
    inputRef.value?.focus()
  })
}

// 点击弹窗外区域：收起弹窗（预览遮罩在 body 下 Teleport，单独排除）
function onDocPointerDown(e) {
  const t = e.target
  if (chatRef.value && t instanceof Node && chatRef.value.contains(t)) return
  if (t instanceof Element && t.closest('.ai-preview-overlay')) return
  chatOpen.value = false
}
watch(chatOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onDocPointerDown)
  else document.removeEventListener('pointerdown', onDocPointerDown)
})

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
function onResizeStart(e) {
  dragging = { mode: 'resize', startW: chatSize.w, startH: chatSize.h, startX: e.clientX, startY: e.clientY }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
function onDragMove(e) {
  if (!dragging) return
  if (dragging.mode === 'resize') {
    chatSize.w = Math.max(MIN_W, Math.min(dragging.startW + (e.clientX - dragging.startX), window.innerWidth - chatPos.x - 12))
    chatSize.h = Math.max(MIN_H, Math.min(dragging.startH + (e.clientY - dragging.startY), window.innerHeight - chatPos.y - 12))
    return
  }
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
  // 错误消息重试：删除错误消息，用原始 prompt 重新生成
  regenerateMessage(msg)
}

// 停止当前生成
function stopGeneration() {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
  loading.value = false
}

// 重试/重新生成：删除指定的 assistant 消息，基于最新上下文重新生成
async function regenerateMessage(msg) {
  const convo = activeConvo.value
  if (!convo || loading.value) return
  const idx = convo.messages.indexOf(msg)
  if (idx !== -1) convo.messages.splice(idx, 1)
  await runGeneration(convo)
}

// 核心生成逻辑：基于当前 convo.messages（末尾应为 user 消息）调用 AI
async function runGeneration(convo) {
  // 取最后一条 user 消息作为 prompt
  let prompt = ''
  for (let i = convo.messages.length - 1; i >= 0; i--) {
    if (convo.messages[i].role === 'user') { prompt = convo.messages[i].content; break }
  }
  if (!prompt) return

  loading.value = true
  if (currentAbortController) currentAbortController.abort()
  currentAbortController = new AbortController()
  scrollToBottom()

  try {
    if (convo.mode === 'image') {
      const imageUrl = await callImageGen(prompt, currentAbortController.signal)
      convo.messages.push({ role: 'assistant', content: '已生成图片', image: imageUrl, prompt })
    } else if (convo.mode === 'video') {
      const videoUrl = await callVideoGen(prompt, currentAbortController.signal)
      convo.messages.push({ role: 'assistant', content: '已生成视频', video: videoUrl, prompt })
    } else {
      const reply = await callAI(prompt, convo.messages, currentAbortController.signal)
      convo.messages.push({ role: 'assistant', content: reply })
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // 被新请求中止，不显示错误
    } else {
      convo.messages.push({ role: 'assistant', content: `请求失败：${err.message}\n\n请检查 API Key 配置（设置 → AI 设置），或稍后重试。`, isError: true, retryPrompt: prompt, retryMode: convo.mode })
    }
  } finally {
    loading.value = false
    currentAbortController = null
    scrollToBottom()
  }
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

  await runGeneration(convo)
}

// GLM 业务错误码 → 用户可读提示
const GLM_ERROR_MAP = {
  '1113': '账户已欠费，请充值后重试',
  '1302': '请求频率过快被限流，请稍等几秒再试',
  '1305': '模型当前访问量过大，请稍后再试',
  '1308': '已达到使用上限，限额将在指定时间后重置',
  '1310': '已达到每周/每月使用上限',
  '1311': '当前套餐暂未开放此模型权限',
  '1313': '账户触发公平使用策略限制，请前往智谱官网申请解除',
}

async function fetchWithRetry(url, options, signal, maxRetries = 3) {
  let lastError = null
  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetch(url, { ...options, signal })

    if (response.ok) return response

    // 尝试读取响应体获取 GLM 业务错误码
    let body = null
    try { body = await response.json() } catch {}

    const errCode = body?.error?.code || ''
    const errMsg = body?.error?.message || ''

    // 不可恢复的 429（额度用完/套餐限制等）→ 立即抛出，不重试
    const nonRetryable = ['1113', '1308', '1310', '1311', '1313', '1314', '1315', '1316', '1317']
    if (nonRetryable.includes(errCode)) {
      throw new Error(GLM_ERROR_MAP[errCode] || `请求失败(${errCode})：${errMsg}`)
    }

    // 可重试的 429（频率限制/模型繁忙）→ 指数退避
    if (response.status === 429 && i < maxRetries) {
      lastError = new Error(GLM_ERROR_MAP[errCode] || `请求被限流：${errMsg}`)
      const delay = 2000 * Math.pow(2, i) // 2s → 4s → 8s
      // 重试等待可被 abort 立即中断
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay)
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new DOMException('Aborted', 'AbortError'))
          }, { once: true })
        }
      })
      continue
    }

    // 其他错误
    if (errCode) {
      throw new Error(GLM_ERROR_MAP[errCode] || `请求失败(${errCode})：${errMsg}`)
    }
    throw new Error(`HTTP ${response.status}`)
  }
  throw lastError || new Error('请求失败')
}

async function callAI(prompt, history, signal) {
  const apiKey = (localStorage.getItem('ai_api_key') || '').trim()
  const baseUrl = localStorage.getItem('ai_base_url') || 'https://open.bigmodel.cn/api/coding/paas/v4'
  const model = localStorage.getItem('ai_model') || 'glm-4.7-flash'
  // history 已包含当前 user prompt（重试场景），避免重复 push
  const msgs = history.filter(m => m.content && !m.image && !m.video && !m.isError).map(m => ({ role: m.role, content: m.content }))
  if (msgs.length === 0 || msgs[msgs.length - 1].role !== 'user') {
    msgs.push({ role: 'user', content: prompt })
  }

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, temperature: 0.7, max_tokens: 4096 })
  }, signal)
  const data = await response.json()
  return data.choices?.[0]?.message?.content || '(空回复)'
}

async function callImageGen(prompt, signal) {
  const apiKey = (localStorage.getItem('ai_api_key') || '').trim()
  const baseUrl = localStorage.getItem('ai_base_url') || 'https://open.bigmodel.cn/api/coding/paas/v4'
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

// CogVideoX 为异步任务：提交 → 轮询查询结果
async function callVideoGen(prompt, signal) {
  const apiKey = (localStorage.getItem('ai_api_key') || '').trim()
  const baseUrl = localStorage.getItem('ai_base_url') || 'https://open.bigmodel.cn/api/coding/paas/v4'
  const model = localStorage.getItem('ai_video_model') || 'cogvideox-flash'
  // 1. 提交生成任务
  const resp = await fetchWithRetry(`${baseUrl}/videos/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt })
  }, signal)
  const data = await resp.json()
  const taskId = data.id || data.task?.id
  if (!taskId) throw new Error(data?.msg || '视频任务创建失败')
  // 2. 轮询查询结果（最多等约 5 分钟），轮询间隔可被 abort 立即中断
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 5000)
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      }
    })
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const r2 = await fetch(`${baseUrl}/async-result/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal
    })
    const d2 = await r2.json()
    const status = d2.task_status
    if (status === 'SUCCESS') {
      const url = d2.video_result?.[0]?.url || d2.results?.[0]?.url || d2.video_result?.[0]?.cover_image_url
      if (url) return url
      throw new Error('视频生成成功但未返回地址')
    }
    if (status === 'FAIL') throw new Error(d2?.fail || '视频生成失败')
    // PROCESSING 继续轮询
  }
  throw new Error('视频生成超时，请稍后重试')
}

async function downloadAsDataUrl(url) {
  // Electron IPC 模式：通过主进程下载（绕过 CORS）
  if (window.electronAPI?.backend) {
    const result = await window.electronAPI.backend('backend:images:fetchRemote', url)
    if (!result || result.code !== 0) throw new Error(result?.msg || '远程图片下载失败')
    const { base64, mimeType } = result.data
    return `data:${mimeType};base64,${base64}`
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
  const { success, error } = useToast()
  try {
    const dataUrl = msg.image.startsWith('http') ? await downloadAsDataUrl(msg.image) : msg.image
    const blob = dataUrlToBlob(dataUrl)
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    success('图片已复制到剪贴板')
  } catch (e) {
    try {
      await navigator.clipboard.writeText(msg.image)
      success('图片链接已复制')
    } catch {
      error('复制失败')
    }
  }
}

// 保存 AI 生成的视频到素材库
async function saveVideoToMedia(msg) {
  if (msg.saved) return
  msg.saving = true
  try {
    const dataUrl = msg.video.startsWith('http') ? await downloadAsDataUrl(msg.video) : msg.video
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const name = `AI视频_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
    msg.savedRef = await saveImage(dataUrl, name)
    msg.saved = true
    const { success } = useToast()
    success('视频已保存到素材库')
    window.dispatchEvent(new CustomEvent('media-library-changed'))
  } catch (err) {
    console.error('视频保存失败:', err)
    msg.saveError = err.message || '保存失败'
    setTimeout(() => { msg.saveError = null }, 5000)
  } finally {
    msg.saving = false
  }
}

// 复制视频（Electron 环境剪贴板无法写视频文件，退化为复制链接）
async function copyVideo(msg) {
  const { success, error } = useToast()
  try {
    await navigator.clipboard.writeText(msg.video)
    success('视频地址已复制')
  } catch {
    error('复制失败')
  }
}

const previewImageUrl = ref('')
const previewVideoUrl = ref('')
function previewImage(url) { previewImageUrl.value = url }
function previewVideo(url) { previewVideoUrl.value = url }
function scrollToBottom() { nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight }) }
function copyText(text) {
  const { success, error } = useToast()
  navigator.clipboard.writeText(text).then(
    () => success('已复制到剪贴板'),
    () => error('复制失败')
  )
}

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
/* 图片放大预览遮罩 */
.ai-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  animation: ai-fade-in 0.2s ease;
}

.ai-preview-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  cursor: default;
  animation: jellyPop 0.4s cubic-bezier(0.34, 1.4, 0.44, 1) both;
  will-change: transform;
}

.ai-preview-close {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.ai-preview-close:hover {
  background: rgba(255,255,255,0.2);
}

@keyframes ai-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 设计令牌 =====
   极简方向：留白、发丝分隔、单色 + 一点强调色，无渐变 / 无光晕 / 无装饰动效 */
.ai-float,
.ai-chat,
.ai-chat-header,
.ai-chat-mode-btn,
.ai-chat-min,
.ai-chat-input,
.ai-chat-send,
.ai-calc-btn,
.ai-conv-tab {
  font-family: inherit;
}

/* ===== 浮窗按钮（圆形图标直出） ===== */
.ai-float {
  position: fixed; width: 48px; height: 48px; z-index: 9998;
  cursor: grab; display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: none;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1);
  user-select: none;
}
.ai-float:hover { transform: translateY(-2px) scale(1.05); }
.ai-float:active { cursor: grabbing; transform: translateY(0) scale(.95); }
.ai-float-icon {
  width: 44px; height: 44px; pointer-events: none;
  border-radius: 50%; object-fit: cover;
  box-shadow: 0 3px 10px rgba(0,0,0,.22), 0 1px 3px rgba(0,0,0,.12);
  transition: box-shadow .2s ease;
}
.ai-float:hover .ai-float-icon { box-shadow: 0 6px 18px rgba(0,0,0,.28), 0 2px 5px rgba(0,0,0,.15); }

/* ===== 弹窗容器 ===== */
.ai-chat {
  position: fixed; min-width: 340px; min-height: 380px; z-index: 9999;
  display: flex; flex-direction: column;
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #e6e8e6);
  border-radius: 14px;
  box-shadow: 0 12px 40px -10px rgba(0,0,0,.16);
  overflow: hidden;
}

/* ===== 标题栏 ===== */
.ai-chat-header {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-secondary, #fff);
  border-bottom: 1px solid var(--border-light, rgba(0,0,0,.06));
  cursor: grab; user-select: none;
}
.ai-chat-header:active { cursor: grabbing; }
.ai-chat-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: var(--text-primary); letter-spacing: .01em; }
.ai-chat-title-icon { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
.ai-chat-toolbar { display: flex; align-items: center; gap: 4px; }
.ai-chat-modes { display: flex; align-items: center; gap: 2px; }
.ai-chat-mode-divider { width: 1px; height: 16px; background: var(--border-light, rgba(0,0,0,.08)); margin: 0 3px; }
.ai-chat-mode-btn { background: transparent; border: none; border-radius: 7px; width: 28px; height: 28px; color: var(--text-tertiary, #999); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
.ai-chat-mode-btn:hover { background: var(--bg-hover, rgba(0,0,0,.05)); color: var(--text-primary); }
.ai-chat-mode-btn.active { background: color-mix(in srgb, var(--primary-color) 12%, transparent); color: var(--primary-color); }
.ai-chat-mode-btn.disabled { opacity: .35; cursor: not-allowed; pointer-events: none; }
.ai-chat-min { background: transparent; border: none; border-radius: 7px; width: 28px; height: 28px; color: var(--text-tertiary, #999); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
.ai-chat-min:hover { background: color-mix(in srgb, var(--text-primary, #333) 10%, transparent); color: var(--text-primary, #333); }

/* ===== Body：侧边栏 + 消息区 ===== */
.ai-chat-body { position: relative; z-index: 1; flex: 1; display: flex; overflow: hidden; }

/* ===== 对话侧边栏 ===== */
.ai-conv-sidebar {
  flex-shrink: 0; width: 68px; display: flex; flex-direction: column;
  gap: 2px; padding: 8px 6px;
  background: var(--bg-tertiary, #f8f8f8);
  border-right: 1px solid var(--border-light, rgba(0,0,0,.05));
  overflow-y: auto; scrollbar-width: none;
}
.ai-conv-sidebar::-webkit-scrollbar { display: none; }
.ai-conv-tab {
  position: relative; width: 100%; padding: 7px 5px; border: none; border-radius: 7px;
  background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;
  transition: background .15s;
}
.ai-conv-tab:hover { background: var(--bg-hover, rgba(0,0,0,.05)); }
.ai-conv-tab.disabled { opacity: .45; cursor: not-allowed; }
.ai-conv-tab.active { background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
.ai-conv-tab.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 2px; height: 60%; border-radius: 2px; background: var(--primary-color); }
.ai-conv-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary-color); flex-shrink: 0; }
.ai-conv-dot.image { background: #d97706; }
.ai-conv-dot.video { background: #8b5cf6; }
.ai-conv-label { font-size: 10px; color: var(--text-tertiary); text-align: center; line-height: 1.25; word-break: break-all; max-width: 56px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ai-conv-tab.active .ai-conv-label { color: var(--primary-color); font-weight: 600; }
.ai-conv-del { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border: none; border-radius: 50%; background: rgba(0,0,0,.06); color: var(--text-tertiary); cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0; }
.ai-conv-tab:hover .ai-conv-del { display: flex; }
.ai-conv-del:hover { background: rgba(239,68,68,.18); color: #ef4444; }

/* ===== 消息区 ===== */
.ai-chat-messages { flex: 1; overflow-y: auto; padding: 18px 16px; min-height: 120px; scrollbar-width: thin; scrollbar-color: var(--border-color, #d4d8d4) transparent; user-select: text; }
.ai-chat-messages::-webkit-scrollbar { width: 5px; }
.ai-chat-messages::-webkit-scrollbar-thumb { background: var(--border-color, #d4d8d4); border-radius: 3px; }

/* ===== 欢迎页 ===== */
.ai-chat-welcome { text-align: center; padding: 24px 8px; }
.ai-welcome-icon { width: 40px; height: 40px; margin: 0 auto 12px; }
.ai-welcome-icon img { width: 100%; height: 100%; border-radius: 8px; object-fit: cover; }
.ai-welcome-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
.ai-welcome-sub { font-size: 12.5px; color: var(--text-tertiary); margin-bottom: 18px; }
.ai-chat-suggestions { display: flex; flex-direction: column; gap: 6px; }
.ai-chat-suggestions button { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: 9px; font-size: 12.5px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-light, rgba(0,0,0,.07)); cursor: pointer; transition: border-color .15s, background .15s; text-align: left; }
.ai-chat-suggestions button:hover { background: var(--bg-hover, rgba(0,0,0,.04)); border-color: color-mix(in srgb, var(--primary-color) 30%, var(--border-color, #e0e0e0)); }
.ai-suggestion-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--primary-color); flex-shrink: 0; opacity: .5; }

/* ===== 消息气泡 ===== */
.ai-msg { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 14px; animation: ai-msg-in .25s ease; }
.ai-msg.user { flex-direction: row-reverse; }
@keyframes ai-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
.ai-msg-avatar { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--bg-tertiary, #f2f2f2); display: flex; align-items: center; justify-content: center; margin-top: 2px; overflow: hidden; }
.ai-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ai-msg-content { max-width: 80%; }
.ai-msg-bubble { padding: 10px 13px; border-radius: 12px; font-size: 13px; line-height: 1.6; word-break: break-word; }
.ai-msg-bubble-ai { background: var(--bg-tertiary, #f4f4f4); color: var(--text-primary); border-bottom-left-radius: 4px; }
.ai-msg-error { background: color-mix(in srgb, #ef4444 7%, var(--bg-tertiary, #f4f4f4)); color: #b91c1c; }
.ai-msg-retry { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 5px 12px; border: 1px solid var(--primary-color); border-radius: 7px; background: transparent; color: var(--primary-color); font-size: 11.5px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.ai-msg-retry:hover { background: var(--primary-color); color: #fff; }
.ai-msg-retry:active { transform: scale(.97); }
.ai-msg-retry:disabled { opacity: .5; cursor: wait; }
/* 加载气泡内的停止按钮 */
.ai-msg-stop { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; padding: 3px 10px; border: 1px solid #ef4444; border-radius: 6px; background: transparent; color: #ef4444; font-size: 11px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.ai-msg-stop:hover { background: #ef4444; color: #fff; }
.ai-msg-stop:active { transform: scale(.97); }
/* 输入区的停止按钮（红色） */
.ai-chat-send.ai-chat-stop { background: #ef4444; color: #fff; }
.ai-chat-send.ai-chat-stop:hover { background: #dc2626; }
/* 文本气泡内的内联重试按钮 */
.ai-msg-retry-inline { margin-top: 6px; padding: 3px 10px; font-size: 11px; font-weight: 500; opacity: .75; }
.ai-msg-retry-inline:not(:disabled):hover { opacity: 1; }
/* 图片/视频操作栏内的重试按钮 */
.ai-msg-actions .ai-msg-retry-btn { border-color: #8b5cf6; color: #8b5cf6; }
.ai-msg-actions .ai-msg-retry-btn:hover { background: color-mix(in srgb, #8b5cf6 8%, transparent); }
.ai-msg-bubble-user { background: var(--primary-color); color: #fff; border-bottom-right-radius: 4px; }
.ai-msg-copy { flex-shrink: 0; width: 22px; height: 22px; border: none; border-radius: 5px; background: transparent; color: var(--text-tertiary, #bbb); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .15s, background .15s, color .15s; margin-top: 4px; }
.ai-msg.assistant:hover .ai-msg-copy { opacity: 1; }
.ai-msg-copy:hover { background: var(--bg-tertiary, #eee); color: var(--primary-color); }

/* ===== 图片消息 ===== */
.ai-msg-image-wrap { border-radius: 12px; overflow: hidden; background: var(--bg-tertiary, #f4f4f4); border: 1px solid var(--border-light, rgba(0,0,0,.06)); }
.ai-msg-image { width: 100%; max-height: 280px; object-fit: contain; cursor: pointer; display: block; transition: transform .3s; }
.ai-msg-image:hover { transform: scale(1.02); }
.ai-msg-image-overlay { padding: 7px 11px; font-size: 11px; color: var(--text-tertiary); background: var(--bg-tertiary); border-bottom: 1px solid var(--border-light, rgba(0,0,0,.05)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-msg-actions { display: flex; gap: 6px; padding: 7px; }
.ai-msg-actions button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 8px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 7px; background: var(--bg-secondary, #fff); color: var(--text-secondary, #666); font-size: 11.5px; cursor: pointer; transition: border-color .15s, color .15s, background .15s; }
.ai-msg-actions button:hover { border-color: var(--primary-color); color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 5%, transparent); }
.ai-msg-actions button.saved { border-color: #22c55e; color: #22c55e; }
.ai-msg-actions button.error { border-color: #ef4444; color: #ef4444; }
.ai-msg-actions button:disabled { opacity: .6; cursor: wait; }

/* ===== 加载动画 ===== */
.ai-typing { display: flex; gap: 4px; padding: 3px 0; }
.ai-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary, #bbb); animation: ai-bounce 1.2s ease-in-out infinite; }
.ai-typing span:nth-child(2){animation-delay:.15s}
.ai-typing span:nth-child(3){animation-delay:.3s}
@keyframes ai-bounce { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-5px);opacity:1} }

/* ===== Markdown ===== */
.ai-msg-bubble :deep(.ai-md-h1){font-size:14.5px;font-weight:700;margin:6px 0 4px}
.ai-msg-bubble :deep(.ai-md-h2){font-size:13.5px;font-weight:600;margin:5px 0 3px}
.ai-msg-bubble :deep(.ai-md-h3){font-size:12.5px;font-weight:600;margin:4px 0 2px}
.ai-msg-bubble :deep(.ai-md-li){padding-left:13px;position:relative;margin:2px 0}
.ai-msg-bubble :deep(.ai-md-li)::before{content:'·';position:absolute;left:3px;color:var(--primary-color)}
.ai-msg-bubble :deep(.ai-inline-code){background:color-mix(in srgb,var(--primary-color) 10%,transparent);padding:1.5px 5px;border-radius:4px;font-size:12px;font-family:'SF Mono',Consolas,monospace}
.ai-msg-bubble :deep(.ai-code-block){background:#1d1d28;border-radius:8px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-size:12px}
.ai-msg-bubble :deep(.ai-code-block code){font-family:'SF Mono',Consolas,monospace;color:#e0e0e0}

/* ===== 输入区 ===== */
.ai-chat-input-area { position: relative; z-index: 1; padding: 10px 14px 12px; border-top: 1px solid var(--border-light, rgba(0,0,0,.06)); background: var(--bg-secondary, #fff); }
.ai-chat-input-wrap { display: flex; gap: 8px; align-items: flex-end; }
.ai-chat-input {
  flex: 1; border: 1px solid var(--border-color, #e0e0e0); border-radius: 10px;
  padding: 9px 12px; font-size: 13px; font-family: inherit; resize: none; outline: none;
  background: var(--bg-primary, #fff); color: var(--text-primary);
  transition: border-color .15s, box-shadow .15s; line-height: 1.5; max-height: 120px;
  overflow: hidden;
}
.ai-chat-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 12%, transparent); }
.ai-chat-input::placeholder { color: var(--text-tertiary); }
.ai-chat-send {
  flex-shrink: 0; width: 36px; height: 36px; border: none; border-radius: 10px;
  background: var(--primary-color);
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: opacity .15s, transform .15s;
}
.ai-chat-send:hover:not(:disabled) { opacity: .9; }
.ai-chat-send:active:not(:disabled) { transform: scale(.95); }
.ai-chat-send:disabled { opacity: .3; cursor: not-allowed; }
.ai-chat-hint { display: flex; align-items: center; gap: 6px; margin-top: 7px; font-size: 10.5px; color: var(--text-tertiary); padding-left: 2px; }
.ai-hint-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); }
.ai-hint-dot.image { background: #d97706; }
.ai-hint-dot.video { background: #8b5cf6; }

/* ===== 过渡：软弹果冻 ===== */
.ai-chat-enter-active { animation: aiJellyIn 0.42s cubic-bezier(0.34, 1.4, 0.44, 1) both; will-change: transform; }
.ai-chat-leave-active { animation: aiJellyOut 0.24s cubic-bezier(0.55, 0, 0.8, 0.4) both; }
@keyframes aiJellyIn {
  0% { opacity: 0; transform: scale(0.6, 0.45) translateY(14px); }
  42% { opacity: 1; transform: scale(1.08, 0.9) translateY(0); }
  58% { transform: scale(0.95, 1.06); }
  74% { transform: scale(1.03, 0.97); }
  88% { transform: scale(0.99, 1.01); }
  100% { transform: scale(1, 1); }
}
@keyframes aiJellyOut {
  0% { transform: scale(1, 1); opacity: 1; }
  30% { transform: scale(1.08, 0.88); opacity: 1; }
  100% { transform: scale(0.6, 0.4) translateY(12px); opacity: 0; }
}

/* ===== 缩放手柄 ===== */
.ai-chat-resize {
  position: absolute; right: 0; bottom: 0; z-index: 2;
  width: 22px; height: 22px;
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 4px; cursor: nwse-resize; color: var(--text-tertiary, #999);
  opacity: .55; transition: opacity .15s, color .15s;
}
.ai-chat-resize svg { width: 11px; height: 11px; }
.ai-chat-resize:hover { opacity: 1; color: var(--primary-color); }

/* ===== 计算器 ===== */
.ai-calc { flex: 1; display: flex; flex-direction: column; padding: 14px; position: relative; z-index: 1; }
.ai-calc-display {
  background: var(--bg-tertiary, #f6f6f6);
  border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; text-align: right; min-height: 70px;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.ai-calc-expr { font-size: 14px; color: var(--text-secondary); word-break: break-all; min-height: 19px; }
.ai-calc-result { font-size: 26px; font-weight: 700; color: var(--text-primary); margin-top: 3px; }
.ai-calc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
.ai-calc-btn {
  border: 1px solid var(--border-light, rgba(0,0,0,.06)); border-radius: 9px; height: 44px; font-size: 16px; font-weight: 500; cursor: pointer;
  background: var(--bg-secondary, #fff); color: var(--text-primary);
  transition: background .12s, border-color .12s; display: flex; align-items: center; justify-content: center;
}
.ai-calc-btn:hover { background: var(--bg-hover, #f2f2f2); border-color: var(--border-color, #e0e0e0); }
.ai-calc-btn:active { background: var(--bg-tertiary, #ececec); }
.ai-calc-zero { grid-column: span 2; }
.ai-calc-fn { background: var(--bg-tertiary, #f2f2f2); color: var(--text-secondary); font-size: 14px; border-color: transparent; }
.ai-calc-op { color: var(--primary-color); border-color: color-mix(in srgb, var(--primary-color) 25%, transparent); }
.ai-calc-eq { background: var(--primary-color); color: #fff; border-color: transparent; }
.ai-calc-eq:hover { background: color-mix(in srgb, var(--primary-color) 88%, #000); }
.ai-calc-history { margin-top: 12px; border-top: 1px solid var(--border-light, rgba(0,0,0,.06)); padding-top: 10px; max-height: 130px; overflow-y: auto; scrollbar-width: thin; }
.ai-calc-history::-webkit-scrollbar { width: 4px; }
.ai-calc-history::-webkit-scrollbar-thumb { background: var(--border-color, #d4d8d4); border-radius: 2px; }
.ai-calc-history-title { font-size: 10.5px; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.ai-calc-history-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 9px; border-radius: 6px; cursor: pointer; transition: background .12s; font-size: 12.5px; }
.ai-calc-history-item:hover { background: var(--bg-hover, #f2f2f2); }
.ai-calc-history-expr { color: var(--text-secondary); }
.ai-calc-history-eq { font-weight: 600; color: var(--primary-color); }
.ai-calc-keyboard-hint { margin-top: 10px; font-size: 10px; color: var(--text-tertiary); text-align: center; opacity: .7; }
</style>
