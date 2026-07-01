import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 新建一个干净笔记
await page.locator('button, .btn').filter({ hasText: /新建|创建|New|\+/ }).first().click().catch(() => {})
await page.waitForTimeout(1200)

// 找文本块，没有就双击画布新建
let editors = await page.locator('.text-editor').count()
if (editors === 0) {
  // 双击画布新建块
  const canvas = page.locator('.canvas-container, .editor-canvas, [class*=canvas]').first()
  await canvas.dblclick().catch(() => {})
  await page.waitForTimeout(800)
  editors = await page.locator('.text-editor').count()
}
console.log('editors:', editors)

if (editors > 0) {
  const ed = page.locator('.text-editor').first()
  await ed.click()
  await page.waitForTimeout(200)
  // 清空并输入干净内容
  await ed.press('Control+a')
  await page.keyboard.press('Delete')
  await page.keyboard.type('HELLOWORLD')
  await page.waitForTimeout(200)

  // 选中 LLOW (第2-5字符) 用键盘
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowRight')
  for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight')
  await page.waitForTimeout(200)
  console.log('selected:', await page.evaluate(() => window.getSelection().toString()))

  // 点击字号"大"(16)
  await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
  await page.waitForTimeout(400)
  const h1 = await ed.evaluate(el => el.innerHTML)
  console.log('after size:', h1)
  console.log('SIZE only on selected:', /font-size:\s*16px/i.test(h1) && h1.includes('16px'))
}

await browser.close()
