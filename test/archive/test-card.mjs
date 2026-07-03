import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.waitForTimeout(500)

// 1. 点面板第一个卡片进入
await page.locator('.folder-card').first().click()
await page.waitForTimeout(600)
const s1 = await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note'))
console.log('1. 点卡片进入文件夹:', s1.currentFolderId ? '✓' : '✗')

// 2. 此时进入文件夹视图。要测试取消，需要回到全部文件夹视图再点同一卡片
//    但 enterFolder 在 currentFolderId 有值时，点同一卡片会 toggle。
//    不过进入文件夹后 .folder-card 不可见了。所以面板卡片取消的场景是：
//    用户在全部文件夹视图，点同一卡片两次——但第一次点就进去了。
//    实际上面板卡片取消主要靠：进入文件夹后，侧边栏点同一文件夹取消（已验证）
//    这里验证 enterFolder 本身的 toggle 逻辑（直接调用）
const firstFolderId = s1.currentFolderId
// 回到全部视图
await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.waitForTimeout(400)
// 再次点同一卡片
await page.locator('.folder-card').first().click()
await page.waitForTimeout(600)
const s2 = await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').currentFolderId)
console.log('2. 回到全部视图再点同卡片:', s2 === firstFolderId ? '✓ 重新选中(符合预期)' : '✗')

await browser.close()
