import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1400, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入一些带图片的测试笔记
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  // 给第一篇加图片
  if (notes[0]) {
    ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80', x: 100, y: 100 })
    ns.updateNote(notes[0].id, { color: '#6bbd8f' })
  }
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 截图全部文件夹+全部笔记视图
await page.screenshot({ path: 'shot-all.png', fullPage: false })

// 截图单文件夹视图
const folderId = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const noteWithImg = ns.notes.find(n => !n.deleted && n.blocks.some(b => b.type === 'image'))
  return noteWithImg?.folderId
})
if (folderId) {
  await page.evaluate((fid) => {
    document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(fid)
  }, folderId)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'shot-folder.png', fullPage: false })
}

// 检查关键元素
const info = await page.evaluate(() => {
  const folderBanner = document.querySelector('.folder-card-banner')
  const noteTop = document.querySelector('.note-card-top')
  const noteTopImg = document.querySelector('.note-card-top img')
  const noteTopIcon = document.querySelector('.note-card-top-icon')
  return {
    folderBanner: folderBanner ? getComputedStyle(folderBanner).background.slice(0, 50) : null,
    noteTopHeight: noteTop ? getComputedStyle(noteTop).height : null,
    noteTopHasImg: !!noteTopImg,
    noteTopHasIcon: !!noteTopIcon
  }
})
console.log('视觉检查:', JSON.stringify(info, null, 2))

await browser.close()
