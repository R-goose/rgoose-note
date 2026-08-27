<!--
  通用背景装饰组件
  软弹果冻材质色块：与启动页同款（实色 + 卡通硬投影 + squash-stretch 震荡）
-->
<template>
  <div class="bg-decor" :class="`v-${variant}`" aria-hidden="true">
    <div class="jblock jb-1"><div class="jelly"></div></div>
    <div class="jblock jb-2"><div class="jelly"></div></div>
    <div class="jblock jb-3"><div class="jelly"></div></div>
    <div class="jblock jb-4"><div class="jelly"></div></div>
    <div class="jblock jb-5"><div class="jelly"></div></div>
  </div>
</template>

<script setup>
defineProps({ variant: { type: String, default: 'notes' } })
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

/* 外层管入场弹跳 + 悬浮漂移；内层管果冻震荡与材质 */
.jblock {
  --jo: 0.45;
  position: absolute;
  will-change: transform;
  animation:
    jbIn 0.55s cubic-bezier(0.34, 1.56, 0.44, 1) var(--d, 0s) both,
    jbFloat 9s ease-in-out calc(var(--d, 0s) + 1.2s) infinite;
}
.jelly {
  width: 100%;
  height: 100%;
  background: var(--jb-bg, #8fd8ac);
  border-radius: var(--jb-r, 50%);
  box-shadow: var(--jb-sh, 10px 12px 0 rgba(26, 31, 28, 0.05));
  will-change: transform;
  animation:
    jbWobble 1.05s ease-out calc(var(--d, 0s) + 0.18s) both,
    jbIdle 13s ease-in-out calc(var(--wd, 0s) + 2.4s) infinite;
}

/* ==================== 布局与配色（默认：绿主调） ==================== */
.jb-1 { left: 7%;   bottom: -70px;  width: 200px; height: 200px; --d: 0.04s; --wd: 0s;   --jb-bg: #8fd8ac; --jb-r: 50%;  --jb-sh: 10px 12px 0 rgba(26,31,28,0.05); }
.jb-2 { right: 9%;  bottom: -92px;  width: 170px; height: 170px; --d: 0.12s; --wd: 1.3s; --jb-bg: #b3d2ee; --jb-r: 40px; --jb-sh: -10px 12px 0 rgba(26,31,28,0.05); }
.jb-3 { left: 30%;  bottom: -118px; width: 150px; height: 150px; --d: 0.2s;  --wd: 2.2s; --jb-bg: #ecd6a9; --jb-r: 36px; --jb-sh: 10px -8px 0 rgba(26,31,28,0.05); }
.jb-4 { right: 31%; bottom: -108px; width: 122px; height: 122px; --d: 0.28s; --wd: 0.8s; --jb-bg: #c9bdf0; --jb-r: 50%;  --jb-sh: -8px -8px 0 rgba(26,31,28,0.05); }
.jb-5 { left: 47%;  bottom: -54px;  width: 84px;  height: 84px;  --d: 0.36s; --wd: 1.8s; --jb-bg: #f6b45b; --jb-r: 50%;  --jb-sh: 7px 7px 0 rgba(26,31,28,0.06); }

/* ==================== 各面板微调 ==================== */
.v-media .jb-1 { width: 250px; height: 250px; bottom: -96px; }
.v-media .jb-2 { width: 210px; height: 210px; bottom: -118px; }
.v-plans .jb-1 { --jb-bg: #b3d2ee; }
.v-plans .jb-2 { --jb-bg: #8fd8ac; }
.v-plans .jb-3 { --jb-bg: #c9bdf0; }
.v-tags .jb-1 { --jb-bg: #b3d2ee; }
.v-tags .jb-2 { --jb-bg: #8fd8ac; }
.v-dashboard .jb-5 { --jb-bg: #f0b3b3; --jb-r: 18px; --jb-sh: -7px 7px 0 rgba(26,31,28,0.06); }
.v-settings .jblock { --jo: 0.3; }

/* ==================== 暗色主题 ==================== */
[data-theme="dark"] .jb-1 { --jb-bg: #20402c; --jb-sh: 10px 12px 0 rgba(0,0,0,0.3); }
[data-theme="dark"] .jb-2 { --jb-bg: #1d3446; --jb-sh: -10px 12px 0 rgba(0,0,0,0.3); }
[data-theme="dark"] .jb-3 { --jb-bg: #3f3423; --jb-sh: 10px -8px 0 rgba(0,0,0,0.3); }
[data-theme="dark"] .jb-4 { --jb-bg: #312b4e; --jb-sh: -8px -8px 0 rgba(0,0,0,0.3); }
[data-theme="dark"] .jb-5 { --jb-bg: #6b4715; --jb-sh: 7px 7px 0 rgba(0,0,0,0.32); }
[data-theme="dark"] .jblock { --jo: 0.55; }

/* ==================== 动画 ==================== */
@keyframes jbIn {
  0% { opacity: 0; transform: scale(0.78, 0.3); }
  16% { opacity: var(--jo, 0.45); transform: scale(0.94, 1.16); }
  32% { transform: scale(1.03, 0.9); }
  48% { transform: scale(0.99, 1.06); }
  64% { transform: scale(1.005, 0.965); }
  78% { transform: scale(0.998, 1.025); }
  90% { transform: scale(1.001, 0.99); }
  100% { opacity: var(--jo, 0.45); transform: scale(1, 1); }
}
@keyframes jbFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(3deg); }
}
@keyframes jbIdle {
  0%, 12%, 100% { transform: scale(1, 1); }
  3% { transform: scale(1.08, 0.92); }
  6% { transform: scale(0.95, 1.06); }
  9% { transform: scale(1.02, 0.99); }
}
</style>
