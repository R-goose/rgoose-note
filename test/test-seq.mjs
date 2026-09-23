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

await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)

async function clickAndReport(label, btnText) {
  const before = await page.evaluate(() => window.getSelection().toString())
  await page.locator('.block-style-toolbar button').filter({ hasText: btnText }).first().click()
  await page.waitForTimeout(400)
  const after = await page.evaluate(() => window.getSelection().toString())
  const h = await ed.evaluate(el => el.innerHTML)
  console.log(`${label} | sel before:${JSON.stringify(before)} after:${JSON.stringify(after)} | ${h}`)
}

await clickAndReport('1st 大', '大')
await clickAndReport('2nd 特大', '特大')
await clickAndReport('3rd 小', '小')
await clickAndReport('4th 中', '中')

await browser.close()
