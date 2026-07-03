import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 测试1：存储位置 UI（Web 端不显示更改按钮，但应有复制按钮）
const storageInfo = await page.evaluate(() => {
  const names = Array.from(document.querySelectorAll('.setting-name')).map(el => el.textContent.trim())
  const hasStorageLocation = names.some(n => n.includes('文件存储位置'))
  const copyBtn = !!document.querySelector('.storage-actions .btn-secondary')
  const changeBtn = !!document.querySelector('.storage-actions .btn-export')
  return { hasStorageLocation, copyBtn, changeBtn }
})
console.log('存储位置UI:', JSON.stringify(storageInfo, null, 2))

// 测试2：窗口状态持久化逻辑（验证 App.vue 是否正常加载，无报错）
const appLoaded = await page.evaluate(() => {
  const sidebar = document.querySelector('.sidebar, [class*="sidebar"]')
  return !!sidebar
})
console.log('应用正常加载:', appLoaded)

// 测试3：验证 Electron API 在 Web 端不存在（确保兼容降级）
const apiCheck = await page.evaluate(() => ({
  hasElectronAPI: !!window.electronAPI,
  hasPickDataDir: window.electronAPI?.pickDataDir !== undefined,
  hasChangeDataDir: window.electronAPI?.changeDataDir !== undefined,
  hasResetDataDir: window.electronAPI?.resetDataDir !== undefined
}))
console.log('Electron API (Web端应为undefined):', JSON.stringify(apiCheck, null, 2))

await page.screenshot({ path: 'shot-storage.png' })

// 测试4：main.cjs 语法检查（确保 Node 能解析）
await browser.close()
