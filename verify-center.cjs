const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 注入测试数据
  await page.evaluate(() => {
    const RAW = localStorage.getItem('rgoose_note_data');
    const data = RAW ? JSON.parse(RAW) : { notes: [], folders: [], plans: [], tags: [] };
    data.notes = (data.notes || []).filter(n => n.id !== 'test_note_center');
    data.notes.push({
      id: 'test_note_center', title: '居中验证笔记', folderId: 'system-root',
      deleted: false, tags: [],
      createdAt: Date.now(), updatedAt: Date.now(),
      canvasConfig: { zoom: 1, offsetX: 0, offsetY: 0 },
      blocks: [{
        id: 'test_todo_center', type: 'todo', title: '测试任务块',
        x: 2500, y: 1800, width: 260, minHeight: 90,
        status: 'todo', priority: 'high', dueDate: null, content: ''
      }],
      connections: []
    });
    localStorage.setItem('rgoose_note_data', JSON.stringify(data));
  });

  // 用应用内导航（先 reload 让 store 读到数据，再用 router.push）
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // 用 router.push 跳转（和点击任务项一致）
  await page.evaluate(() => {
    const app = document.querySelector('#app').__vue_app__;
    const router = app.config.globalProperties.$router;
    router.push('/note/test_note_center?b=test_todo_center');
  });
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    const block = document.querySelector('.note-block[data-block-id="test_todo_center"]');
    const blockRect = block ? block.getBoundingClientRect() : null;
    const blocksCount = document.querySelectorAll('.note-block').length;
    const url = location.hash;
    return {
      url, blocksCount,
      blockRect: blockRect ? { x: Math.round(blockRect.x), y: Math.round(blockRect.y) } : null,
      vp: { w: window.innerWidth, h: window.innerHeight }
    };
  });
  console.log('结果:', JSON.stringify(result, null, 2));

  await page.screenshot({ path: 'verify-center.png' });

  // 清理
  await page.evaluate(() => {
    const RAW = localStorage.getItem('rgoose_note_data');
    if (RAW) {
      const data = JSON.parse(RAW);
      data.notes = (data.notes || []).filter(n => n.id !== 'test_note_center');
      localStorage.setItem('rgoose_note_data', JSON.stringify(data));
    }
  });

  await browser.close();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
