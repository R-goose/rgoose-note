import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const exepath = getBrowserPath()
const browser = await chromium.launch({ headless: true, executablePath: exepath })
const page = await browser.newPage()
const errors = []
page.on('pageerror', err => errors.push('PAGE: ' + err.message))

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 点第一个笔记进入编辑器
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const editors = await page.locator('.text-editor').count()
console.log('text editors:', editors)
const blocks = await page.locator('.note-block').count()
console.log('note blocks:', blocks)

if (editors === 0) {
  console.log('NO EDITORS - screenshot saved')
  await page.screenshot({ path: 'e:/大师的/shot-noeditor.png' })
  const html = await page.evaluate(() => document.querySelector('.main-content')?.innerHTML?.slice(0, 800))
  console.log('main html:', html)
  await browser.close()
  process.exit(0)
}

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = 'ABCDEFGHIJ'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)

// 选中 CDE
await ed.evaluate(el => {
  const range = document.createRange()
  range.setStart(el.firstChild, 2)
  range.setEnd(el.firstChild, 5)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)
console.log('selected:', await ed.evaluate(() => window.getSelection().toString()))

// 测试1: 加粗
const boldBtn = page.locator('.block-style-toolbar button:has(strong)').first()
if (await boldBtn.count()) {
  await boldBtn.click()
  await page.waitForTimeout(300)
  const html = await ed.evaluate(el => el.innerHTML)
  console.log('[BOLD] html:', html)
  console.log('[BOLD] applied:', /<b>|bold/i.test(html))
}

// 重新选中 FGH
await ed.evaluate(el => {
  el.innerHTML = 'ABCDEFGHIJ'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(200)
await ed.evaluate(el => {
  const range = document.createRange()
  range.setStart(el.firstChild, 5)
  range.setEnd(el.firstChild, 8)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)

// 测试2: 字号"大"(16)
const sizeBtn = page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first()
if (await sizeBtn.count()) {
  await sizeBtn.click()
  await page.waitForTimeout(300)
  const html2 = await ed.evaluate(el => el.innerHTML)
  console.log('[SIZE] html:', html2)
  console.log('[SIZE] applied:', /font-size|16px/i.test(html2))
}

// 测试3: 字重"粗体"(700)
await ed.evaluate(el => {
  el.innerHTML = 'ABCDEFGHIJ'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(200)
await ed.evaluate(el => {
  const range = document.createRange()
  range.setStart(el.firstChild, 0)
  range.setEnd(el.firstChild, 4)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)
const weightBtn = page.locator('.block-style-toolbar button').filter({ hasText: '粗体' }).first()
if (await weightBtn.count()) {
  await weightBtn.click()
  await page.waitForTimeout(300)
  const html3 = await ed.evaluate(el => el.innerHTML)
  console.log('[WEIGHT] html:', html3)
  console.log('[WEIGHT] applied:', /font-weight|700/i.test(html3))
}

console.log('errors:', errors)
await browser.close()
