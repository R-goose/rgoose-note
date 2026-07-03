import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 获取侧边栏可见的叶子文件夹名（无展开箭头的）
const target = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const folders = ns.folders.filter(f => !f.deleted)
  const leaf = folders.find(f => !folders.some(c => c.parentId === f.id))
  return leaf ? { id: leaf.id, name: leaf.name } : null
})
console.log('目标叶子文件夹:', JSON.stringify(target))

await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.evaluate(() => {
  document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null)
})
await page.waitForTimeout(400)

// 找到侧边栏里这个文件夹对应的 .folder-item（通过文本匹配）
const folderItems = await page.locator('.folder-item').count()
console.log('侧边栏文件夹项数:', folderItems)

// 用 evaluate 找到目标文件夹项的索引
const idx = await page.evaluate((name) => {
  const items = [...document.querySelectorAll('.folder-item')]
  const i = items.findIndex(el => el.textContent.includes(name))
  return i
}, target.name)
console.log('目标项索引:', idx)

if (idx >= 0) {
  // 第一次点击：选中
  await page.locator('.folder-item').nth(idx).click()
  await page.waitForTimeout(600)
  const s1 = await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').currentFolderId)
  console.log('1. 首次点击:', s1 === target.id ? '✓ 选中' : '✗ (got ' + s1 + ')')

  // 再次点击同一项：取消
  await page.locator('.folder-item').nth(idx).click()
  await page.waitForTimeout(600)
  const s2 = await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').currentFolderId)
  console.log('2. 再次点击:', s2 === null ? '✓ 取消选中' : '✗ 仍选中 (got ' + s2 + ')')
} else {
  console.log('未找到目标项，所有项文本:')
  const texts = await page.evaluate(() => [...document.querySelectorAll('.folder-item')].map(e => e.textContent.trim()))
  console.log(texts)
}

await browser.close()
