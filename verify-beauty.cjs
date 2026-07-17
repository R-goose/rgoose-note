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
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { localStorage.setItem('rgoose_theme', 'dark'); });
  await page.goto('http://localhost:5174/#/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const cardBg = await page.evaluate(() => {
    const c = document.querySelector('.stat-card');
    return c ? getComputedStyle(c).backgroundColor : null;
  });
  const blobInDark = await page.evaluate(() => {
    const c = document.querySelector('.stat-card');
    return c ? parseFloat(getComputedStyle(c, '::before').opacity).toFixed(2) : null;
  });
  console.log('暗黑主题:', theme, '卡片背景:', cardBg, '光晕透明度:', blobInDark);
  await page.screenshot({ path: 'verify-dash-dark.png' });
  await browser.close();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
