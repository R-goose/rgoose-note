import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const THEME_KEY = 'rgoose_theme'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref('light')
  let mediaQuery = null
  let mediaHandler = null

  const isDark = computed(() => mode.value === 'dark')

  function applyMode(effectiveDark) {
    const root = document.documentElement
    if (effectiveDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }

  function getEffectiveDark() {
    if (mode.value === 'auto') {
      return mediaQuery ? mediaQuery.matches : false
    }
    return mode.value === 'dark'
  }

  function apply() {
    applyMode(getEffectiveDark())
  }

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem(THEME_KEY, newMode)
    apply()
  }

  function init() {
    const saved = localStorage.getItem(THEME_KEY)
    mode.value = saved || 'light'

    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaHandler = () => {
        if (mode.value === 'auto') apply()
      }
      mediaQuery.addEventListener('change', mediaHandler)
    }

    apply()
  }

  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return {
    mode,
    isDark,
    setMode,
    toggle,
    init
  }
})
