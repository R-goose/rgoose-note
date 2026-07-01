import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
const logs = []
page.on('console', msg => { if (msg.text().includes('[FMT]')) logs.push(msg.text()) })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)

// 真实键盘输入
await page.keyboard.type('ABCDEFGHIJ')
await page.waitForTimeout(300)

// 用键盘选中 CDE：先 Home 到开头，然后 Shift+Right ×3
await page.keyboard.press('Home')
await page.waitForTimeout(100)
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)

const sel = await page.evaluate(() => window.getSelection().toString())
console.log('keyboard selected:', JSON.stringify(sel))

// 检查保存的选区
const saved = await page.evaluate(() => {
  // 模拟真实流程：mouseup 已触发 saveSelection
  return true
})

// 点击"大"字号按钮 - 真实点击
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(500)

console.log('=== FMT LOGS ===')
logs.forEach(l => console.log(l))

const html = await ed.evaluate(el => el.innerHTML)
console.log('final html:', html)

await browser.close()
