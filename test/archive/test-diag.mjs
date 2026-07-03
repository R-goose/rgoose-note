import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('首页URL:', page.url())
const noteItems = await page.locator('.note-item').count()
console.log('note-item数:', noteItems)

await page.locator('.note-item').first().click()
await page.waitForTimeout(2000)
console.log('点击后URL:', page.url())
console.log('note-block数:', await page.locator('.note-block').count())

// 诊断 store
const diag = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  return {
    currentNoteId: ns.currentNoteId,
    notesCount: ns.notes.length,
    firstNoteBlocks: ns.notes[0]?.blocks?.length,
    currentNoteBlocks: ns.currentNote?.blocks?.length
  }
})
console.log('store诊断:', JSON.stringify(diag))

await browser.close()
