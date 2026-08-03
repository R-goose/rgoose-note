import { onMounted, onUnmounted } from 'vue'

/**
 * 统一管理多个 popover / dropdown 的"点击外部关闭"逻辑
 *
 * 用法（数组形式，推荐）：
 *   useClickOutside([
 *     { selector: '.export-menu-wrap', onClose: () => showExportMenu.value = false },
 *     { selector: ['.tag-add-wrap', '.tag-picker'], onClose: () => { showTagPicker.value = false; tagSearch.value = '' } }
 *   ])
 *
 * 或对象形式：
 *   useClickOutside({
 *     '.export-menu-wrap': () => showExportMenu.value = false
 *   })
 *
 * selector 为数组时：点击命中其中任一即视为"内部"，不触发关闭。
 * 监听 window mousedown(capture)，先于 click 切换，避免抖动。
 * 调用方仍需用 @click.stop 阻止 popover 内部点击触发显式切换。
 */

function normalizeConfig(config) {
  if (Array.isArray(config)) {
    return config.map(({ selector, onClose }) => ({
      selectors: Array.isArray(selector) ? selector : [selector],
      onClose
    }))
  }
  return Object.entries(config).map(([selector, onClose]) => ({
    selectors: Array.isArray(selector) ? selector : [selector],
    onClose
  }))
}

export function useClickOutside(config) {
  const items = normalizeConfig(config)

  function onPointerDown(e) {
    if (e.button === 2) return // 右键交给 contextmenu 处理
    for (const { selectors, onClose } of items) {
      if (!selectors?.length) continue
      const inside = selectors.some(sel => sel && e.target.closest?.(sel))
      if (!inside) onClose?.(e)
    }
  }

  onMounted(() => window.addEventListener('mousedown', onPointerDown, true))
  onUnmounted(() => window.removeEventListener('mousedown', onPointerDown, true))
}
