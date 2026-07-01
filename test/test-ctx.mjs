import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

// 在画布上右键
const canvas = page.locator('.canvas-container, .editor-canvas, [class*=canvas]').first()
await canvas.click({ button: 'right' })
await page.waitForTimeout(500)
let visible = await page.locator('.context-menu').isVisible()
console.log('1. 右键后面板可见:', visible)

// 点击面板外区域
await canvas.click({ position: { x: 50, y: 50 } })
await page.waitForTimeout(500)
visible = await page.locator('.context-menu').isVisible()
console.log('2. 点击外部后可见:', visible)

// 再右键块
const block = page.locator('.note-block').first()
await block.click({ button: 'right' })
await page.waitForTimeout(500)
visible = await page.locator('.context-menu').isVisible()
console.log('3. 右键块后面板可见:', visible)

// 点击块本身之外
await page.mouse.click(400, 400)
await page.waitForTimeout(500)
visible = await page.locator('.context-menu').isVisible()
console.log('4. 点击外部后可见:', visible)

await browser.close()
