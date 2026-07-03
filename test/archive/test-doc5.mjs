import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 600 })

// 测试1: 设置面板滚动 - 空白区域也能滚
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 点击右侧空白区域（超出 inner 900px 的区域），尝试滚动
const contentBox = await page.locator('.settings-content').boundingBox()
console.log('settings-content宽:', Math.round(contentBox.width), '高:', Math.round(contentBox.height))

// 滚动前 scrollTop
const before = await page.evaluate(() => document.querySelector('.settings-content').scrollTop)
// 在空白区域滚轮（视口右侧）
await page.mouse.move(1100, 300)
await page.mouse.wheel(0, 300)
await page.waitForTimeout(300)
const after = await page.evaluate(() => document.querySelector('.settings-content').scrollTop)
console.log('1. 空白区滚动 scrollTop:', before, '→', after, after > before ? '✓ 可滚动' : '✗ 不可滚')

// 测试2: 最近笔记顶部标题不显示文件夹名，但列表项显示
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const headerTag = await page.locator('.current-folder-tag').count()
console.log('2. 顶部文件夹标签(应为0):', headerTag)
const itemFolder = await page.locator('.note-folder').count()
console.log('3. 列表项文件夹标签(应>0):', itemFolder)

await browser.close()
