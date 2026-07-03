import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入测试数据：一篇带图片
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) {
    ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80', x: 100, y: 100 })
  }
  const colors = ['#6b8f5e', '#a8853f', '#4f7d8c', '#8a5a3c', '#7a5c8c']
  notes.slice(0, 6).forEach((n, i) => {
    if (!n.blocks.some(b => b.type === 'image')) ns.updateNote(n.id, { color: colors[i % colors.length] })
  })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

// 截图全部视图
await page.screenshot({ path: 'shot-field-all.png' })

// 验证关键结构
const info = await page.evaluate(() => {
  return {
    specimen: document.querySelectorAll('.specimen-card').length,
    specimenNo: document.querySelector('.specimen-no')?.textContent,
    specimenLeaf: !!document.querySelector('.specimen-leaf'),
    specimenStamp: document.querySelector('.specimen-stamp')?.textContent,
    specimenNameFont: document.querySelector('.specimen-name') ? getComputedStyle(document.querySelector('.specimen-name')).fontFamily.slice(0,30) : null,
    fieldNote: document.querySelectorAll('.field-note').length,
    fieldNoteSpine: !!document.querySelector('.field-note-spine'),
    fnDay: document.querySelector('.fn-day')?.textContent,
    fnMonth: document.querySelector('.fn-month')?.textContent,
    fnNo: document.querySelector('.fn-no')?.textContent?.trim(),
    fnDayFont: document.querySelector('.fn-day') ? getComputedStyle(document.querySelector('.fn-day')).fontSize : null,
    fnThumb: document.querySelectorAll('.fn-thumb img').length
  }
})
console.log('博物学手册结构:', JSON.stringify(info, null, 2))

// hover 截图
await page.locator('.specimen-card').first().hover()
await page.waitForTimeout(500)
await page.screenshot({ path: 'shot-field-hover.png' })

// 单文件夹区截图
const fid = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const note = pinia._s.get('note').notes.find(n => !n.deleted)
  return note?.folderId
})
if (fid) {
  await page.evaluate((id) => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(id), fid)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'shot-field-folder.png' })
  // hover 笔记
  await page.locator('.field-note').first().hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'shot-field-note-hover.png' })
}

await browser.close()
