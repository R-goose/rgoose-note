import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

// 清空 localStorage 确保干净状态
await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.evaluate(() => { localStorage.removeItem('rgoose_shortcuts') })

// 1. 设置页重绑"插入代码块"为 Ctrl+Shift+J
await page.goto('http://localhost:5200/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const items = await page.locator('.shortcut-name').allTextContents()
const codeIdx = items.findIndex(t => t.includes('插入代码块'))
const codeBox = page.locator('.shortcut-item').nth(codeIdx).locator('.keybind-box')
console.log('1. 默认值:', await codeBox.textContent())
await codeBox.click()
await page.waitForTimeout(300)
await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(400)
console.log('2. 重绑后:', await codeBox.textContent())

// 确认持久化
const saved = await page.evaluate(() => localStorage.getItem('rgoose_shortcuts'))
console.log('3. 持久化:', saved)

// 2. 进编辑器测试（同会话，store 已更新）
await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)
const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('X')
await page.waitForTimeout(200)

// 按 Ctrl+Shift+J (新绑定)
await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(600)
const h = await ed.evaluate(el => el.innerHTML)
console.log('4. 新绑定J后:', h.includes('<pre>') || h.includes('<code') ? '✓ 代码块已插入' : '✗')
console.log('   html:', h.slice(0, 80))

await browser.close()
