import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 确认文件夹卡存在
const counts = await page.evaluate(() => ({
  folders: document.querySelectorAll('.folder-card').length,
  notes: document.querySelectorAll('.note-card').length
}))
console.log('卡片数量:', counts)

// 用 dispatchEvent 直接触发 contextmenu
await page.evaluate(() => {
  const card = document.querySelector('.folder-card')
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true,
    clientX: rect.left + 50, clientY: rect.top + 20
  }))
})
await page.waitForTimeout(500)
const folderCtxInfo = await page.evaluate(() => {
  const menu = document.querySelector('.context-menu')
  const items = document.querySelectorAll('.context-menu-item span')
  return { present: !!menu, texts: Array.from(items).map(s => s.textContent) }
})
console.log('文件夹右键菜单:', JSON.stringify(folderCtxInfo, null, 2))
await page.screenshot({ path: 'shot-ctx-folder2.png' })

await browser.close()
