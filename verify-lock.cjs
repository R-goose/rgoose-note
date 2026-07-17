const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('[err]', msg.text().slice(0,120)); });
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 注入测试笔记：3个块
  await page.evaluate(() => {
    const RAW = localStorage.getItem('rgoose_note_data');
    const data = RAW ? JSON.parse(RAW) : { notes: [], folders: [], plans: [], tags: [] };
    const noteId = 'test_lock_layer';
    data.notes = (data.notes || []).filter(n => n.id !== noteId);
    data.notes.push({
      id: noteId, title: '锁定图层测试', folderId: 'system-root',
      deleted: false, tags: [], createdAt: Date.now(), updatedAt: Date.now(),
      canvasConfig: { zoom: 1, offsetX: 0, offsetY: 0 },
      blocks: [
        { id: 'blk_a', type: 'text', content: '底层块 A', x: 200, y: 200, width: 220, minHeight: 80, zIndex: 0 },
        { id: 'blk_b', type: 'text', content: '中层块 B', x: 280, y: 260, width: 220, minHeight: 80, zIndex: 1 },
        { id: 'blk_c', type: 'text', content: '锁定块 C', x: 360, y: 320, width: 220, minHeight: 80, locked: true, zIndex: 2 }
      ],
      connections: []
    });
    localStorage.setItem('rgoose_note_data', JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 导航到该笔记
  await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    app.config.globalProperties.$router.push('/note/test_lock_layer');
  });
  await new Promise(r => setTimeout(r, 2000));

  // 检查锁定块 C 的状态
  const lockState = await page.evaluate(() => {
    const c = document.querySelector('.note-block[data-block-id="blk_c"]');
    if (!c) return { found: false };
    const cs = getComputedStyle(c);
    const editor = c.querySelector('.text-editor');
    const resizeHandles = c.querySelectorAll('.resize-handle');
    return {
      found: true,
      lockedClass: c.classList.contains('locked'),
      borderStyle: cs.borderStyle,
      editorEditable: editor ? editor.getAttribute('contenteditable') : null,
      resizeHandleCount: resizeHandles.length,
      resizeHandleVisible: Array.from(resizeHandles).filter(h => getComputedStyle(h).display !== 'none').length
    };
  });
  console.log('锁定块 C 状态:', JSON.stringify(lockState, null, 2));

  // 测试置顶：点击块 A 的置顶按钮
  const aBefore = await page.evaluate(() => {
    const a = document.querySelector('.note-block[data-block-id="blk_a"]');
    return a ? getComputedStyle(a).zIndex : null;
  });
  console.log('块A置顶前 zIndex:', aBefore);

  await page.evaluate(() => {
    const a = document.querySelector('.note-block[data-block-id="blk_a"]');
    if (!a) return;
    const btns = a.querySelectorAll('.action-btn');
    // 找到置顶按钮（第3个，标题为"置顶"）
    const frontBtn = Array.from(btns).find(b => b.getAttribute('title') === '置顶');
    if (frontBtn) frontBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const aAfter = await page.evaluate(() => {
    const a = document.querySelector('.note-block[data-block-id="blk_a"]');
    return a ? getComputedStyle(a).zIndex : null;
  });
  console.log('块A置顶后 zIndex:', aAfter, aAfter > aBefore ? '✅ 置顶生效' : '❌ 未生效');

  await page.screenshot({ path: 'verify-lock.png' });

  // 清理
  await page.evaluate(() => {
    const RAW = localStorage.getItem('rgoose_note_data');
    if (RAW) {
      const data = JSON.parse(RAW);
      data.notes = (data.notes || []).filter(n => n.id !== 'test_lock_layer');
      localStorage.setItem('rgoose_note_data', JSON.stringify(data));
    }
  });
  await browser.close();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
