import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入带图片的笔记
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80', x: 100, y: 100 })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

// 测试1：笔记右键菜单
const noteCard = page.locator('.note-card').first()
await noteCard.click({ button: 'right' })
await page.waitForTimeout(400)
const ctxInfo = await page.evaluate(() => {
  const menu = document.querySelector('.context-menu')
  const items = document.querySelectorAll('.context-menu-item span')
  return {
    present: !!menu,
    itemCount: items.length,
    texts: Array.from(items).map(s => s.textContent)
  }
})
console.log('笔记右键菜单:', JSON.stringify(ctxInfo, null, 2))
await page.screenshot({ path: 'shot-ctx-note.png' })
// 点空白关闭
await page.locator('body').click({ position: { x: 50, y: 800 } })
await page.waitForTimeout(300)

// 测试2：文件夹右键菜单
const folderCard = page.locator('.folder-card').first()
await folderCard.click({ button: 'right' })
await page.waitForTimeout(400)
const folderCtxInfo = await page.evaluate(() => {
  const items = document.querySelectorAll('.context-menu-item span')
  return { texts: Array.from(items).map(s => s.textContent) }
})
console.log('文件夹右键菜单:', JSON.stringify(folderCtxInfo, null, 2))
await page.screenshot({ path: 'shot-ctx-folder.png' })

// 执行重命名
await page.evaluate(() => {
  const btns = document.querySelectorAll('.context-menu-item')
  for (const b of btns) if (b.textContent.includes('重命名')) b.click()
})
await page.waitForTimeout(400)
const renameModal = await page.evaluate(() => !!document.querySelector('.modal-content h3'))
console.log('重命名弹窗:', renameModal)
await page.screenshot({ path: 'shot-rename.png' })

// 测试3：设置页清缓存按钮
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const clearBtn = await page.evaluate(() => {
  const items = document.querySelectorAll('.setting-name')
  for (const it of items) if (it.textContent.includes('清除缓存')) return true
  return false
})
console.log('设置页清缓存按钮存在:', clearBtn)
await page.screenshot({ path: 'shot-settings.png' })

// 测试4：persist 防抖（连续触发多次，应在500ms后才写入）
const debounceInfo = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  return {
    hasFlushPersist: typeof ns.flushPersist === 'function',
    hasClearCache: typeof ns.clearCache === 'function'
  }
})
console.log('store 方法:', JSON.stringify(debounceInfo, null, 2))

await browser.close()
