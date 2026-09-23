import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const URL = 'http://localhost:5173/'

const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath(), args: ['--disable-web-security'] })
const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const setup = await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const noteStore = app.config.globalProperties.$pinia._s.get('note')
  const note = noteStore.createNote('真实粘贴pre')
  noteStore.addBlock(note.id, { type: 'text', content: '<p><br></p>', x: 80, y: 80, width: 460, height: 300 })
  return { noteId: note.id }
})
await page.evaluate((id) => {
  document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/note/' + id)
}, setup.noteId)
await page.waitForTimeout(1800)

const mdContent = '```\nlog()\n```'
await page.evaluate((md) => navigator.clipboard.writeText(md), mdContent)
await page.waitForTimeout(200)

await page.click('.text-editor')
await page.waitForTimeout(200)
await page.keyboard.press('Control+v')
await page.waitForTimeout(900)

const detail = await page.evaluate(() => {
  const editor = document.querySelector('.text-editor')
  const pre = editor.querySelector('pre')
  const code = editor.querySelector('pre code')
  const block = document.querySelector('.note-block')
  const blockRect = block.getBoundingClientRect()
  if (!pre) return { html: editor.innerHTML, noPre: true }
  const preRect = pre.getBoundingClientRect()
  const codeRect = code?.getBoundingClientRect()
  return {
    html: editor.innerHTML,
    codeAbovePreBox: codeRect ? codeRect.bottom <= preRect.top + 2 : null,
    codeInsidePreBox: codeRect ? (codeRect.top >= preRect.top - 2 && codeRect.bottom <= preRect.bottom + 2) : null,
    preTop: Math.round(preRect.top - blockRect.top),
    codeTop: codeRect ? Math.round(codeRect.top - blockRect.top) : null,
    preBottom: Math.round(preRect.bottom - blockRect.top),
    codeBottom: codeRect ? Math.round(codeRect.bottom - blockRect.top) : null,
  }
})
console.log(JSON.stringify(detail, null, 2))

await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const noteStore = app.config.globalProperties.$pinia._s.get('note')
  const note = noteStore.notes.find(n => n.title === '真实粘贴pre')
  if (note) noteStore.deleteNote(note.id)
})
await browser.close()
