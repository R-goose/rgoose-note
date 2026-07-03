import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(2000)

const url = page.url()
const noteId = url.split('/note/')[1]

// 找一条已有连线，用 dispatchEvent 触发双击
const result = await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  const conns = note?.connections || []
  return { connCount: conns.length, firstConnId: conns[0]?.id, firstLabel: conns[0]?.label, colors: conns.map(c => c.color) }
}, noteId)
console.log('当前笔记连线:', JSON.stringify(result))

if (result.firstConnId) {
  // dispatch dblclick 到 .connection-hit
  await page.evaluate(() => {
    const hit = document.querySelector('.connection-hit')
    if (hit) hit.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
  })
  await page.waitForTimeout(400)
  const editing = await page.locator('.conn-label-edit').count()
  console.log('1. dispatch双击进入编辑:', editing > 0 ? '是' : '否')

  if (editing > 0) {
    await page.locator('.conn-label-edit').fill('新文字内容')
    await page.locator('.conn-label-edit').press('Enter')
    await page.waitForTimeout(300)
    const after = await page.locator('.conn-label-text').first().textContent().catch(() => null)
    console.log('2. 提交后label:', after)
    const stored = await page.evaluate((nid) => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
      const ns = pinia._s.get('note')
      return ns.notes.find(n => n.id === nid)?.connections?.[0]?.label
    }, noteId)
    console.log('3. store持久化:', stored)
  }
}

await browser.close()
