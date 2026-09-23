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
await page.keyboard.type('ABCDEFGH')
await page.waitForTimeout(300)

// 先选中 BCD 设字号16（制造行内字号）
await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(200)
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
console.log('1. 局部选中BCD设16:', await ed.evaluate(el => el.innerHTML))

// 关键测试：取消选中（用方向键让光标折叠），再点字号"特大"，应该整块统一
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(200)
await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(200)
const selBefore = await page.evaluate(() => window.getSelection().toString())
console.log('2. 取消选中后 sel:', JSON.stringify(selBefore))

await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
const h2 = await ed.evaluate(el => el.innerHTML)
const blockFontSize = await page.evaluate(() => {
  const b = document.querySelector('.note-block.selected')
  return null
})
console.log('3. 无选中点特大(20)后 html:', h2)
const hasInlineFontSize = /font-size/i.test(h2)
console.log('   行内font-size已清除:', !hasInlineFontSize)

// 验证整块字号
const blockStyle = await page.evaluate(() => {
  const ed = document.querySelector('.text-editor')
  return window.getComputedStyle(ed).fontSize
})
console.log('4. 整块计算字号:', blockStyle)

await browser.close()
