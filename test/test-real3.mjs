import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('ABCDEFGH')
await page.waitForTimeout(300)

// 用真实鼠标拖选 BCD：获取字符位置后用 mouse 拖动
const box = await ed.boundingBox()
// 先定位到编辑器，用键盘选中
await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight') // 到 B
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)
console.log('sel:', await page.evaluate(() => window.getSelection().toString()))

// 点字号大
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
let h = await ed.evaluate(el => el.innerHTML)
console.log('1st 大(16):', h)

// 关键：点击后选区还在吗？
const selAfter = await page.evaluate(() => ({
  sel: window.getSelection().toString(),
  active: document.activeElement?.classList?.contains('text-editor')
}))
console.log('after click, sel:', JSON.stringify(selAfter))

// 直接再点字号特大（不重新选中）
await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
h = await ed.evaluate(el => el.innerHTML)
console.log('2nd 特大(20):', h)

// 直接再点字号小（不重新选中）
await page.locator('.block-style-toolbar button').filter({ hasText: '小' }).first().click()
await page.waitForTimeout(400)
h = await ed.evaluate(el => el.innerHTML)
console.log('3rd 小(12):', h)

await browser.close()
