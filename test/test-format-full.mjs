import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const exepath = getBrowserPath()
const browser = await chromium.launch({ headless: true, executablePath: exepath })
const page = await browser.newPage()
const errors = []
page.on('pageerror', err => errors.push('PAGE: ' + err.message))

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

// 点第一个笔记卡片进入编辑器
await page.locator('.note-card').first().click()
await page.waitForTimeout(1000)
await page.screenshot({ path: 'e:/大师的/shot-editor.png' })

// 找文本块编辑器
const editors = await page.locator('.text-editor').count()
console.log('text editors:', editors)

if (editors === 0) {
  // 可能需要新建块，点画布空白添加
  console.log('no editors, trying to find canvas...')
  const blocks = await page.locator('.note-block, [class*=block]').count()
  console.log('blocks:', blocks)
}

const ed = page.locator('.text-editor').first()
// 填入测试文字
await ed.click()
await page.waitForTimeout(200)
await ed.evaluate(el => { el.innerHTML = 'ABCDEFGHIJ'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)

// 选中 CDE（第3-5个字符）
await ed.evaluate(el => {
  const range = document.createRange()
  const text = el.firstChild
  range.setStart(text, 2)
  range.setEnd(text, 5)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)

const selInfo = await ed.evaluate(() => {
  const s = window.getSelection()
  return s.toString()
})
console.log('selected:', JSON.stringify(selInfo))

// 找加粗按钮（工具栏里含 B 的按钮）
const boldBtn = page.locator('.block-style-toolbar button:has(strong)').first()
const boldCount = await boldBtn.count().catch(() => 0)
console.log('bold btn count:', boldCount)

if (boldCount > 0) {
  await boldBtn.click()
  await page.waitForTimeout(300)
  const html = await ed.evaluate(el => el.innerHTML)
  console.log('after bold html:', html)
  const hasBold = html.includes('<b>') || html.includes('bold') || html.includes('700')
  console.log('BOLD APPLIED:', hasBold)
}

// 测试字号按钮
await ed.evaluate(el => {
  const range = document.createRange()
  const text = el.firstChild
  range.setStart(text, 0)
  range.setEnd(text, 3)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)

// 找"大"字号按钮
const sizeBtn = page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first()
const sizeCount = await sizeBtn.count().catch(() => 0)
console.log('size btn count:', sizeCount)
if (sizeCount > 0) {
  await sizeBtn.click()
  await page.waitForTimeout(300)
  const html2 = await ed.evaluate(el => el.innerHTML)
  console.log('after fontsize html:', html2)
  console.log('FONTSIZE APPLIED:', html2.includes('font-size') || html2.includes('16'))
}

await page.screenshot({ path: 'e:/大师的/shot-result.png' })
console.log('errors:', errors)
await browser.close()
