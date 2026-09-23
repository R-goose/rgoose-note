import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)

// 真实键盘输入
await page.keyboard.type('ABCDEFGH')
await page.waitForTimeout(300)

// 真实键盘选中：Home 然后按住 Shift 向右
await page.keyboard.press('Home')
await page.waitForTimeout(100)
for (let i = 0; i < 3; i++) {
  await page.keyboard.press('Shift+ArrowRight')
}
await page.waitForTimeout(300)
console.log('selected:', await page.evaluate(() => window.getSelection().toString()))

// 第一次：真实点击字号"大"
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
console.log('1st:', await ed.evaluate(el => el.innerHTML))

// 重新选中 BCDE（光标已变，需重新选）
await ed.click({ position: { x: 10, y: 10 } })
await page.waitForTimeout(200)
await page.keyboard.press('Home')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)
console.log('reselected:', await page.evaluate(() => window.getSelection().toString()))

// 第二次：真实点击字号"特大"
await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
console.log('2nd:', await ed.evaluate(el => el.innerHTML))

// 第三次：真实点击字号"小"
await ed.click({ position: { x: 10, y: 10 } })
await page.waitForTimeout(200)
await page.keyboard.press('Home')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)
await page.locator('.block-style-toolbar button').filter({ hasText: '小' }).first().click()
await page.waitForTimeout(400)
console.log('3rd:', await ed.evaluate(el => el.innerHTML))

await browser.close()
