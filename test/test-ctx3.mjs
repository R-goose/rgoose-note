import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

// 第一次右键
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
let box1 = await page.locator('.context-menu').boundingBox()
console.log('1. 第一次右键, 菜单:', box1 ? `x=${Math.round(box1.x)},y=${Math.round(box1.y)}` : 'null')

// 第二次右键不同位置
await page.mouse.click(700, 300, { button: 'right' })
await page.waitForTimeout(400)
let box2 = await page.locator('.context-menu').boundingBox()
console.log('2. 第二次右键(700,300), 菜单:', box2 ? `x=${Math.round(box2.x)},y=${Math.round(box2.y)}` : 'null')

// 第三次右键
await page.mouse.click(500, 500, { button: 'right' })
await page.waitForTimeout(400)
let box3 = await page.locator('.context-menu').boundingBox()
console.log('3. 第三次右键(500,500), 菜单:', box3 ? `x=${Math.round(box3.x)},y=${Math.round(box3.y)}` : 'null')

// 左键外部
await page.mouse.click(100, 100)
await page.waitForTimeout(400)
let box4 = await page.locator('.context-menu').boundingBox()
console.log('4. 左键外部(100,100), 菜单:', box4 ? '可见' : 'null')

await browser.close()
