import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const URL = 'http://localhost:5173/'

const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const setup = await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const noteStore = app.config.globalProperties.$pinia._s.get('note')
  const note = noteStore.createNote('pre框位置')
  noteStore.addBlock(note.id, { type: 'text', content: '<p><br></p>', x: 80, y: 80, width: 460, height: 300 })
  return { noteId: note.id }
})
await page.evaluate((id) => {
  document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/note/' + id)
}, setup.noteId)
await page.waitForTimeout(1800)

await page.evaluate((md) => {
  const editor = document.querySelector('.text-editor')
  editor.focus()
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  const dt = new DataTransfer()
  dt.setData('text/plain', md)
  editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
}, '```\nlog()\n```')
await page.waitForTimeout(900)

const detail = await page.evaluate(() => {
  const editor = document.querySelector('.text-editor')
  const pre = editor.querySelector('pre')
  const code = editor.querySelector('pre code')
  if (!pre || !code) return { html: editor.innerHTML, noPre: !pre, noCode: !code }
  const preRect = pre.getBoundingClientRect()
  const codeRect = code.getBoundingClientRect()
  const preCs = getComputedStyle(pre)
  const codeCs = getComputedStyle(code)
  return {
    html: editor.innerHTML,
    preRect: { top: Math.round(preRect.top), bottom: Math.round(preRect.bottom), left: Math.round(preRect.left), height: Math.round(preRect.height) },
    codeRect: { top: Math.round(codeRect.top), bottom: Math.round(codeRect.bottom), left: Math.round(codeRect.left), height: Math.round(codeRect.height) },
    codeAbovePreBox: codeRect.bottom <= preRect.top + 2,
    codeInsidePreBox: codeRect.top >= preRect.top - 2 && codeRect.bottom <= preRect.bottom + 2,
    prePosition: preCs.position,
    prePaddingTop: preCs.paddingTop,
    preBg: preCs.backgroundColor,
    codePosition: codeCs.position,
    codeDisplay: codeCs.display,
    codeColor: codeCs.color,
    codeOffsetParent: code.offsetParent?.tagName,
    codeOffsetTop: code.offsetTop,
    preChildren: [...pre.childNodes].map(n => n.nodeType === 3 ? `text:"${n.textContent}"` : `<${n.nodeName.toLowerCase()}>`),
  }
})
console.log(JSON.stringify(detail, null, 2))

await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const noteStore = app.config.globalProperties.$pinia._s.get('note')
  const note = noteStore.notes.find(n => n.title === 'pre框位置')
  if (note) noteStore.deleteNote(note.id)
})
await browser.close()
