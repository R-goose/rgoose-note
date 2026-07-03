import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ===== 第14点：文件夹图标左移 =====
const folderPadding = await page.evaluate(() => {
  const item = document.querySelector('.folder-item')
  if (!item) return null
  const style = getComputedStyle(item)
  return { paddingLeft: style.paddingLeft, gap: style.gap }
})
console.log('1. 文件夹项 paddingLeft(应较小如4px):', folderPadding?.paddingLeft, 'gap(应7px):', folderPadding?.gap)

// ===== 注入测试数据：一篇带图片块的笔记 =====
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => !n.deleted)
  if (note) {
    // 给笔记加一个图片块
    ns.addBlock(note.id, { type: 'image', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzZiYmQ4ZiIvPjwvc3ZnPg==', x: 100, y: 100 })
  }
})

// ===== 第15点：笔记封面 + 第16点：父级文件夹 =====
await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const coverCount = await page.locator('.all-notes-section .note-card-cover').count()
console.log('2. 全部笔记区的封面数:', coverCount, coverCount > 0 ? '✓ 有封面' : '✗ 无封面')

const folderPathCount = await page.locator('.all-notes-section .note-folder-path').count()
console.log('3. 全部笔记区的父级文件夹标签数:', folderPathCount, folderPathCount > 0 ? '✓ 已显示' : '✗ 未显示')

// 检查封面图片是否真实渲染
const coverImg = await page.evaluate(() => {
  const cover = document.querySelector('.all-notes-section .note-card-cover img')
  if (!cover) return null
  return { src: cover.src.slice(0, 40), loaded: cover.complete && cover.naturalWidth > 0 }
})
console.log('4. 封面图片渲染:', JSON.stringify(coverImg))

// ===== 单文件夹区也应有封面 =====
// 选第一个有图片笔记的文件夹
const targetFolderId = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const noteWithImg = ns.notes.find(n => !n.deleted && n.blocks.some(b => b.type === 'image' && b.imageUrl))
  return noteWithImg?.folderId || null
})
if (targetFolderId) {
  await page.evaluate((fid) => {
    document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(fid)
  }, targetFolderId)
  await page.waitForTimeout(800)
  const coverInFolder = await page.locator('.notes-grid .note-card-cover').count()
  console.log('5. 单文件夹区封面数:', coverInFolder, coverInFolder > 0 ? '✓' : '✗')
}

await browser.close()
