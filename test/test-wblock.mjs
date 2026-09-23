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

// 场景A：选中 BCD 设字重粗体
await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(200)
await page.locator('.block-style-toolbar button').filter({ hasText: '粗体' }).first().click()
await page.waitForTimeout(400)
console.log('A. 选中BCD设粗体:', await ed.evaluate(el => el.innerHTML))

// 场景B：取消选中，点字重常规，应该整块清除粗体统一
await page.keyboard.press('ArrowRight')
await page.keyboard.press('ArrowLeft')
await page.waitForTimeout(200)
await page.locator('.block-style-toolbar button').filter({ hasText: '常规' }).first().click()
await page.waitForTimeout(400)
const hB = await ed.evaluate(el => el.innerHTML)
console.log('B. 无选中点常规:', hB)
console.log('   粗体已清除:', !/<b|font-weight/i.test(hB))

// 场景C：无选中点字号大，应整块统一
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
const hC = await ed.evaluate(el => el.innerHTML)
const edStyle = await page.evaluate(() => window.getComputedStyle(document.querySelector('.text-editor')).fontSize)
console.log('C. 无选中点大:', hC, '| 计算字号:', edStyle)

await browser.close()
