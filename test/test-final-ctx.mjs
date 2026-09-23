import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ctx = page.locator('.context-menu')
const isVisible = async () => { try { return await ctx.isVisible({ timeout: 500 }) } catch { return false } }

// 1. 右键打开
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
console.log('1. 右键打开:', await isVisible())

// 2. 左键点击外部 → 应关闭
await page.mouse.click(300, 300)
await page.waitForTimeout(400)
console.log('2. 左键外部:', await isVisible())

// 3. 右键打开，再右键别处 → 应移动(可见)
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
await page.mouse.click(500, 500, { button: 'right' })
await page.waitForTimeout(400)
const box = await ctx.boundingBox()
console.log('3. 再次右键:', box ? `移动到(${Math.round(box.x)},${Math.round(box.y)})` : '关闭')

// 4. Escape → 应关闭
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
console.log('4. Escape:', await isVisible())

// 5. 右键打开，滚轮 → 应关闭
await page.mouse.click(600, 400, { button: 'right' })
await page.waitForTimeout(400)
await page.mouse.wheel(0, 50)
await page.waitForTimeout(400)
console.log('5. 滚轮:', await isVisible())

await browser.close()
