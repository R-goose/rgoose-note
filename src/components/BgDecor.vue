<!--
  通用背景装饰组件
  简洁风格：blobs + rings + grid + dots，每个面板通过不同的参数组合区分
-->
<template>
  <div class="bg-decor" :class="`v-${variant}`" aria-hidden="true">
    <!-- blob 光晕 -->
    <svg v-if="showBlobs" class="bg-blob bg-blob-1" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient :id="`${uid}-b1`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" :fill="`url(#${uid}-b1)`"/>
    </svg>
    <svg v-if="showBlobs" class="bg-blob bg-blob-2" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient :id="`${uid}-b2`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="140" :fill="`url(#${uid}-b2)`"/>
    </svg>
    <!-- 同心圆环 -->
    <svg v-if="showRings" class="bg-rings" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="1"/>
      <circle cx="100" cy="100" r="65" stroke="currentColor" stroke-width="1" opacity="0.6"/>
      <circle cx="100" cy="100" r="90" stroke="currentColor" stroke-width="1" opacity="0.3"/>
    </svg>
    <!-- 网格 -->
    <div v-if="showGrid" class="bg-grid-lines"></div>
    <!-- 点阵 -->
    <div v-if="showDots" class="bg-dots"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ variant: { type: String, default: 'notes' } })
const uid = Math.random().toString(36).slice(2, 8)

// 每个 variant 不同的元素组合
const showBlobs = computed(() => ['dashboard', 'notes', 'tags', 'media', 'plans'].includes(props.variant))
const showRings = computed(() => ['notes', 'plans', 'settings'].includes(props.variant))
const showGrid = computed(() => ['dashboard', 'notes', 'plans', 'settings'].includes(props.variant))
const showDots = computed(() => ['notes', 'tags', 'media', 'settings'].includes(props.variant))
</script>

<style scoped>
.bg-decor {
  position: fixed;
  left: var(--sidebar-width, 260px);
  right: 0;
  bottom: 0;
  height: 340px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* ==================== 共用元素基础 ==================== */
.bg-blob {
  position: absolute;
  bottom: -140px;
  opacity: 0.15;
  filter: blur(10px);
  will-change: transform;
}
.bg-rings {
  position: absolute;
  opacity: 0.2;
  animation: ringsSpin 36s linear infinite;
  will-change: transform;
}
.bg-grid-lines {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 240px;
  opacity: 0.4;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  transform: perspective(400px) rotateX(55deg);
  transform-origin: bottom center;
}
.bg-dots {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 200px;
  opacity: 0.4;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
}
@keyframes ringsSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* ==================== Dashboard: 绿色主调，细网格 ==================== */
.v-dashboard .bg-blob-1 { left: 20%; width: 320px; height: 320px; color: var(--primary-color); opacity: 0.13; animation: drift1 20s ease-in-out infinite; }
.v-dashboard .bg-blob-2 { right: 16%; bottom: -180px; width: 260px; height: 260px; color: var(--secondary-color); opacity: 0.10; animation: drift2 26s ease-in-out infinite; }
.v-dashboard .bg-grid-lines {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--primary-color) 35%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--primary-color) 35%, transparent) 1px, transparent 1px);
  background-size: 36px 36px;
}

/* ==================== Notes: 双色 blobs + rings + 密网格 ==================== */
.v-notes .bg-blob-1 { left: 18%; width: 340px; height: 340px; color: var(--primary-color); opacity: 0.15; animation: drift1 22s ease-in-out infinite; }
.v-notes .bg-blob-2 { right: 12%; bottom: -180px; width: 300px; height: 300px; color: var(--secondary-color); opacity: 0.13; animation: drift2 28s ease-in-out infinite; }
.v-notes .bg-rings { right: 26%; bottom: -40px; width: 200px; height: 200px; color: var(--primary-color); opacity: 0.22; animation: ringsSpin 36s linear infinite, ringsFloat 9s ease-in-out infinite; }
.v-notes .bg-grid-lines {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--primary-color) 45%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--primary-color) 45%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
}
.v-notes .bg-dots {
  background-image: radial-gradient(color-mix(in srgb, var(--primary-color) 60%, transparent) 1.4px, transparent 1.4px);
  background-size: 22px 22px;
}

/* ==================== Tags: 小 blobs + 稀疏点阵(蓝) ==================== */
.v-tags .bg-blob-1 { left: 28%; width: 260px; height: 260px; color: var(--primary-color); opacity: 0.12; animation: drift1 24s ease-in-out infinite; }
.v-tags .bg-blob-2 { right: 22%; bottom: -160px; width: 220px; height: 220px; color: var(--secondary-color); opacity: 0.12; animation: drift2 30s ease-in-out infinite; }
.v-tags .bg-dots {
  background-image: radial-gradient(color-mix(in srgb, var(--secondary-color) 55%, transparent) 1.2px, transparent 1.2px);
  background-size: 32px 32px;
}

/* ==================== Media: 大 blobs + 大点阵 ==================== */
.v-media .bg-blob-1 { left: 14%; width: 380px; height: 380px; color: var(--primary-color); opacity: 0.12; animation: drift1 18s ease-in-out infinite; }
.v-media .bg-blob-2 { right: 8%; bottom: -200px; width: 340px; height: 340px; color: var(--secondary-color); opacity: 0.11; animation: drift2 24s ease-in-out infinite; }
.v-media .bg-dots {
  background-image: radial-gradient(color-mix(in srgb, var(--primary-color) 50%, transparent) 1.8px, transparent 1.8px);
  background-size: 30px 30px;
}

/* ==================== Plans: 蓝 rings + 宽网格(蓝) ==================== */
.v-plans .bg-blob-1 { left: 24%; width: 280px; height: 280px; color: var(--secondary-color); opacity: 0.13; animation: drift1 24s ease-in-out infinite; }
.v-plans .bg-blob-2 { right: 16%; bottom: -160px; width: 260px; height: 260px; color: var(--primary-color); opacity: 0.10; animation: drift2 30s ease-in-out infinite; }
.v-plans .bg-rings { right: 24%; bottom: -50px; width: 200px; height: 200px; color: var(--secondary-color); opacity: 0.22; }
.v-plans .bg-grid-lines {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--secondary-color) 40%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--secondary-color) 40%, transparent) 1px, transparent 1px);
  background-size: 52px 52px;
}

/* ==================== Settings: rings + 极宽网格 ==================== */
.v-settings .bg-rings { right: 28%; bottom: -40px; width: 180px; height: 180px; color: var(--primary-color); opacity: 0.18; }
.v-settings .bg-grid-lines {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--primary-color) 25%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--primary-color) 25%, transparent) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.3;
}
.v-settings .bg-dots {
  background-image: radial-gradient(color-mix(in srgb, var(--secondary-color) 35%, transparent) 1px, transparent 1px);
  background-size: 36px 36px;
  opacity: 0.25;
}

/* ==================== 动画 ==================== */
@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(28px, -22px) scale(1.1); }
  66% { transform: translate(-18px, -10px) scale(0.95); }
}
@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40% { transform: translate(-32px, -18px) scale(1.12); }
  75% { transform: translate(16px, -28px) scale(0.92); }
}
@keyframes ringsFloat {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -12px; }
}
</style>
