import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const result = await page.evaluate(() => {
  const ed = document.querySelector('.text-editor')
  if (!ed) return 'no editor'
  ed.innerHTML = 'ABCDEFGHIJ'
  ed.focus()

  // 选中 CDE
  const range = document.createRange()
  range.setStart(ed.firstChild, 2)
  range.setEnd(ed.firstChild, 5)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)

  const selText = sel.toString()
  const log = ['sel:' + selText]

  // 测试 execCommand fontSize 各种方式
  const r1 = document.execCommand('styleWithCSS', false, true)
  log.push('styleWithCSS:' + r1)
  const r2 = document.execCommand('fontSize', false, '7')
  log.push('fontSize ret:' + r2)
  document.execCommand('styleWithCSS', false, false)
  log.push('html after fontSize7:' + ed.innerHTML)

  // 检查生成的节点
  const fonts = ed.querySelectorAll('font')
  const spans = ed.querySelectorAll('span')
  log.push('font count:' + fonts.length + ' span count:' + spans.length)

  return log.join('\n')
})

console.log(result)
await browser.close()
