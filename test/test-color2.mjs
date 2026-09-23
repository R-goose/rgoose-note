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
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)

// 检查颜色按钮数量和属性
const btnInfo = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.block-style-toolbar button.color-btn')]
  return btns.map(b => ({ title: b.title, bg: b.style.background, hasClick: !!b.onclick }))
})
console.log('color buttons:', JSON.stringify(btnInfo))

// 选中 ELLO
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 直接在 evaluate 里测 foreColor（绕过 Vue）
const direct = await page.evaluate(() => {
  const ed = document.querySelector('.text-editor')
  document.execCommand('styleWithCSS', false, true)
  const r = document.execCommand('foreColor', false, '#ff0000')
  document.execCommand('styleWithCSS', false, false)
  return { ret: r, html: ed.innerHTML }
})
console.log('direct foreColor:', JSON.stringify(direct))

await browser.close()
