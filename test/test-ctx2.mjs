import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ctxMenu = page.locator('.context-menu')

// 场景1: 右键画布打开
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
console.log('1. 右键画布:', await ctxMenu.isVisible())

// 场景2: 点侧边栏（Vue组件外但同窗口）
const sidebar = page.locator('.nav-notes, .sidebar a').first()
await sidebar.click({ force: true }).catch(async () => {
  await page.mouse.click(100, 100)
})
await page.waitForTimeout(400)
console.log('2. 点侧边栏后:', await ctxMenu.isVisible())

// 场景3: 再次右键
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
console.log('3. 再次右键画布:', await ctxMenu.isVisible())

// 场景4: 滚轮
await page.mouse.wheel(0, 100)
await page.waitForTimeout(400)
console.log('4. 滚轮后:', await ctxMenu.isVisible())

// 场景5: 按 Escape
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
console.log('5. Escape后:', await ctxMenu.isVisible())

await browser.close()
