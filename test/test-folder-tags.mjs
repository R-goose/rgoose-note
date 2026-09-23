import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const URL = 'http://localhost:5173/'

let pass = 0, fail = 0
const results = []
function ok(name) { pass++; results.push(`  PASS  ${name}`) }
function bad(name, detail) { fail++; results.push(`  FAIL  ${name}` + (detail ? ` -> ${detail}` : '')) }

const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

try {
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const setup = await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__
    const noteStore = app.config.globalProperties.$pinia._s.get('note')
    const tagStore = app.config.globalProperties.$pinia._s.get('tag')
    const folder = noteStore.createFolder('标签显示测试夹')
    const tag = tagStore.createTag('重要', '#e74c3c')
    const note = noteStore.createNote('夹内带标签笔记XYZ', folder.id)
    noteStore.addBlock(note.id, { type: 'text', content: '<p>内容</p>', x: 80, y: 80, width: 300, height: 100 })
    noteStore.setNoteTags(note.id, [tag.id])
    const noteNoTag = noteStore.createNote('夹内无标签笔记XYZ', folder.id)
    noteStore.addBlock(noteNoTag.id, { type: 'text', content: '<p>y</p>', x: 80, y: 80, width: 300, height: 100 })
    return { folderId: folder.id, noteId: note.id, noteNoTagId: noteNoTag.id, tagId: tag.id, folderName: folder.name }
  })

  await page.evaluate(() => {
    document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/notes')
  })
  await page.waitForTimeout(1200)

  await page.fill('.search-input, input[placeholder*="搜索"]', 'XYZ')
  await page.waitForTimeout(800)

  const searchResult = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.note-card')]
    const tagged = cards.find(c => c.querySelector('.note-card-title')?.textContent?.includes('带标签'))
    const untagged = cards.find(c => c.querySelector('.note-card-title')?.textContent?.includes('无标签'))
    return {
      totalCards: cards.length,
      taggedHasTags: tagged ? tagged.querySelectorAll('.note-tag-chip').length : -1,
      taggedFirstTag: tagged?.querySelector('.note-tag-chip')?.textContent?.trim(),
      untaggedHasTags: untagged ? untagged.querySelectorAll('.note-tag-chip').length : -1,
    }
  })
  if (searchResult.taggedHasTags > 0 && searchResult.taggedFirstTag === '重要') {
    ok(`搜索结果中带标签笔记显示标签（${searchResult.taggedFirstTag}）`)
  } else {
    bad('搜索结果未显示标签', JSON.stringify(searchResult))
  }
  if (searchResult.untaggedHasTags === 0) ok('无标签笔记不显示标签区域')
  else bad('无标签笔记显示异常', JSON.stringify(searchResult))

  await page.evaluate(() => {
    document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/notes?folder=' + setup_folderId)
  }.toString().replace('setup_folderId', `"${setup.folderId}"`))
  await page.waitForTimeout(1000)
  await page.locator('.folder-card').first().click().catch(() => {})
  await page.waitForTimeout(1500)

  const folderResult = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.note-card')]
    const tagged = cards.find(c => c.querySelector('.note-card-title')?.textContent?.includes('带标签'))
    return {
      totalCards: cards.length,
      tagCount: tagged ? tagged.querySelectorAll('.note-tag-chip').length : -1,
      firstTag: tagged?.querySelector('.note-tag-chip')?.textContent?.trim(),
    }
  })
  if (folderResult.tagCount > 0 && folderResult.firstTag === '重要') ok(`文件夹视图笔记卡片显示标签（${folderResult.firstTag}）`)
  else bad('文件夹视图未显示标签', JSON.stringify(folderResult))

  await page.evaluate((setup) => {
    const app = document.querySelector('#app').__vue_app__
    const noteStore = app.config.globalProperties.$pinia._s.get('note')
    noteStore.deleteNote(setup.noteId)
    noteStore.deleteNote(setup.noteNoTagId)
    noteStore.deleteFolder(setup.folderId)
  }, setup)
} catch (e) {
  bad('测试异常', e.message)
} finally {
  await browser.close()
}

console.log('\n========== 文件夹/搜索面板标签显示测试 ==========')
console.log(`通过: ${pass}  失败: ${fail}`)
console.log(results.join('\n'))
console.log('==================================================')
process.exit(fail > 0 ? 1 : 0)
