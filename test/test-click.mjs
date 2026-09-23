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

// 检查按钮是否存在
const btnInfo = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.block-style-toolbar button')]
  return btns.map(b => ({ text: b.textContent.trim(), hasMousedownPrevent: true })).slice(0, 20)
})
console.log('toolbar buttons:', JSON.stringify(btnInfo))

// 在点击前检查选区
const beforeClick = await page.evaluate(() => ({
  activeIsEditor: document.activeElement?.classList?.contains('text-editor'),
  sel: window.getSelection().toString()
}))
console.log('before click:', JSON.stringify(beforeClick))

// 用真实鼠标操作点击字号"大"按钮 - 先看按钮位置
const sizeBtn = page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first()
const box = await sizeBtn.boundingBox()
console.log('size btn box:', JSON.stringify(box))

// 关键：用 dispatchEvent 模拟带 preventDefault 的 mousedown + click
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.block-style-toolbar button')]
  const btn = btns.find(b => b.textContent.trim() === '大')
  if (!btn) { console.log('NO 大 BUTTON'); return 'no btn' }
  // 模拟 Vue @mousedown.prevent
  btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  btn.click()
  return 'clicked'
})
await page.waitForTimeout(400)

const afterHtml = await ed.evaluate(el => el.innerHTML)
console.log('after size html:', afterHtml)
console.log('size applied:', /font-size/i.test(afterHtml))

await browser.close()
