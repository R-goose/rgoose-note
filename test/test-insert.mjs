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

// 清空输入干净内容
await page.keyboard.type('HELLO')
await page.waitForTimeout(200)

// 测试1: Ctrl+Shift+L 插入无序列表
await page.keyboard.press('Control+Shift+KeyL')
await page.waitForTimeout(500)
let h = await ed.evaluate(el => el.innerHTML)
console.log('1. Ctrl+Shift+L 无序列表:', h)
console.log('   含 <ul>:', /<ul>/i.test(h))

// 清空重新输入
await ed.evaluate(el => { el.innerHTML = 'HELLO'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(200)

// 测试2: Ctrl+Shift+K 插入代码块
await page.keyboard.press('Control+Shift+KeyK')
await page.waitForTimeout(500)
h = await ed.evaluate(el => el.innerHTML)
console.log('2. Ctrl+Shift+K 代码块:', h)
console.log('   含 <pre>:', /<pre>/i.test(h))

// 清空
await ed.evaluate(el => { el.innerHTML = 'HELLO'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(200)

// 测试3: Ctrl+Shift+T 插入表格
await page.keyboard.press('Control+Shift+KeyT')
await page.waitForTimeout(500)
h = await ed.evaluate(el => el.innerHTML)
console.log('3. Ctrl+Shift+T 表格:', h.includes('<table>') ? '含<table>' : h.slice(0,60))
console.log('   含 <table>:', /<table>/i.test(h))

// 测试4: Ctrl+K 插入链接（应打开链接弹窗）
await ed.evaluate(el => { el.innerHTML = 'HELLO'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(200)
await page.keyboard.press('Control+KeyK')
await page.waitForTimeout(500)
const linkModal = await page.locator('.link-modal, [class*=link-modal], .modal-overlay').count()
console.log('4. Ctrl+K 链接弹窗:', linkModal > 0 ? '打开' : '未打开')

// 测试5: 确认画布快捷键不受影响 - Escape 关闭后按 N 新建块
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
// 确保不在编辑态
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
const blocksBefore = await page.locator('.note-block').count()
await page.keyboard.press('KeyN')
await page.waitForTimeout(800)
const blocksAfter = await page.locator('.note-block').count()
console.log('5. 画布N键新建(非编辑态):', blocksBefore, '→', blocksAfter, blocksAfter === blocksBefore + 1 ? '✓' : '✗')

await browser.close()
