import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)

// 彻底清空：直接设 innerHTML 为纯文本
await ed.evaluate(el => {
  el.innerHTML = 'HELLOWORLD'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(400)

// 选中 LLOW
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1)
  r.setEnd(el.firstChild, 5)
  const s = window.getSelection()
  s.removeAllRanges(); s.addRange(r)
  el.focus()
  // 手动触发 saveSelection（模拟真实 mouseup）
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)
console.log('selected:', await page.evaluate(() => window.getSelection().toString()))

// 测试1: 字号"大"(16)
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
const h1 = await ed.evaluate(el => el.innerHTML)
console.log('AFTER SIZE:', h1)

// 重置
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 测试2: 字重"粗体"(700)
await page.locator('.block-style-toolbar button').filter({ hasText: '粗体' }).first().click()
await page.waitForTimeout(400)
const h2 = await ed.evaluate(el => el.innerHTML)
console.log('AFTER WEIGHT:', h2)

// 重置
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 测试3: 加粗
await page.locator('.block-style-toolbar button:has(strong)').first().click()
await page.waitForTimeout(400)
const h3 = await ed.evaluate(el => el.innerHTML)
console.log('AFTER BOLD:', h3)

// 重置
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 测试4: 颜色(红)
await page.locator('.block-style-toolbar button').filter({ hasText: '红' }).first().click().catch(() => {})
await page.waitForTimeout(400)
const h4 = await ed.evaluate(el => el.innerHTML)
console.log('AFTER COLOR:', h4)

await browser.close()
