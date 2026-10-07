import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../raw');
fs.mkdirSync(path.join(OUT, 'ios'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'android'), { recursive: true });

const URL = process.env.STORE_URL || 'http://127.0.0.1:8081/?storeDemo=1';

async function clickText(page, text) {
  const clicked = await page.evaluate((wanted) => {
    const all = [];
    const walk = (n) => {
      if (!n) return;
      if (n.nodeType === 3 && n.textContent?.trim()) {
        all.push({ t: n.textContent.trim(), el: n.parentElement });
      }
      n.childNodes?.forEach(walk);
    };
    walk(document.body);
    const hit = all.find((x) => x.t.includes(wanted));
    if (!hit?.el) return false;
    const el = hit.el.closest('[role=button],button') || hit.el;
    el.click();
    return true;
  }, text);
  await page.waitForTimeout(800);
  return clicked;
}

async function shot(page, name) {
  await page.waitForTimeout(600);
  const iosPath = path.join(OUT, 'ios', `${name}.png`);
  const andPath = path.join(OUT, 'android', `${name}.png`);
  await page.screenshot({ path: iosPath, type: 'png' });
  // android same content; compose script will resize
  fs.copyFileSync(iosPath, andPath);
  console.log('saved', name);
}

async function runDevice(deviceName, outPlatform) {
  const browser = await chromium.launch({ headless: true });
  const device = devices[deviceName];
  const context = await browser.newContext({
    ...device,
    locale: 'ar-SY',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1500);

  // Skip onboarding if present
  await clickText(page, 'تخطي');
  await page.waitForTimeout(500);
  await clickText(page, 'تصفح كزائر');
  await page.waitForTimeout(1500);

  // Home
  await shot(page, '01-home');

  // Explore tab
  await clickText(page, 'استكشف');
  await page.waitForTimeout(1000);
  await shot(page, '02-discover');

  // Back home then open first shop card if possible
  await clickText(page, 'الرئيسية');
  await page.waitForTimeout(800);
  // tap a shop name from demo
  const opened = await clickText(page, 'صالون لمسة ذهب');
  if (opened) {
    await page.waitForTimeout(1200);
    await shot(page, '03-shop');
    await clickText(page, 'احجزي الآن');
    await page.waitForTimeout(1000);
    await shot(page, '04-booking');
  } else {
    await shot(page, '03-shop');
    await shot(page, '04-booking');
  }

  // Profile / cash messaging screen
  await clickText(page, 'حسابي');
  await page.waitForTimeout(800);
  await shot(page, '05-cash');

  await browser.close();
  console.log('done', deviceName, outPlatform);
}

await runDevice('iPhone 14 Pro Max', 'ios');
console.log('ALL DONE');
