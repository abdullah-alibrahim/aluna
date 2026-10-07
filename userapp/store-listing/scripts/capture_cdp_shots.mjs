/**
 * Capture store screenshots via Chrome DevTools Protocol against Expo web.
 * Usage: node capture_cdp_shots.mjs
 * Requires Expo web at STORE_URL (default http://127.0.0.1:8081/?storeDemo=1)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../raw');
const URL = process.env.STORE_URL || 'http://127.0.0.1:8081/?storeDemo=1';
const WIDTH = 390;
const HEIGHT = 844;
const SCALE = 2;

fs.mkdirSync(path.join(OUT, 'ios'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'android'), { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cdp(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMsg = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', onMsg);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function getWsUrl() {
  // Prefer Playwright/Chromium launched locally
  const { chromium } = await import('playwright').catch(() => ({ chromium: null }));
  if (!chromium) throw new Error('playwright not installed');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
    locale: 'ar-SY',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 180000 });
  return { browser, page };
}

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
    const el = hit.el.closest('[role=button],button,a') || hit.el;
    el.click();
    return true;
  }, text);
  await sleep(900);
  return clicked;
}

async function shot(page, name) {
  await sleep(700);
  const iosPath = path.join(OUT, 'ios', `${name}.png`);
  const andPath = path.join(OUT, 'android', `${name}.png`);
  await page.screenshot({ path: iosPath, type: 'png' });
  fs.copyFileSync(iosPath, andPath);
  console.log('saved', name, iosPath);
}

async function main() {
  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
  } catch {
    console.log('Installing playwright chromium...');
    const { execSync } = await import('child_process');
    execSync('npx playwright install chromium', { stdio: 'inherit', cwd: path.join(__dirname, '../../') });
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
    locale: 'ar-SY',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await sleep(2500);

  await clickText(page, 'تخطي');
  await sleep(400);
  await clickText(page, 'تصفح كزائر');
  await sleep(2000);

  // Wait for demo shops
  for (let i = 0; i < 15; i++) {
    const has = await page.evaluate(() => document.body.innerText.includes('صالون لمسة ذهب'));
    if (has) break;
    await sleep(500);
  }

  await shot(page, '01-home');

  await clickText(page, 'استكشف');
  await sleep(1200);
  await shot(page, '02-discover');

  await clickText(page, 'الرئيسية');
  await sleep(800);
  const opened = await clickText(page, 'صالون لمسة ذهب');
  if (!opened) {
    // tap first shop card image area
    await page.evaluate(() => {
      const all = [];
      const walk = (n) => {
        if (!n) return;
        if (n.nodeType === 3 && n.textContent?.includes('لمسة')) all.push(n.parentElement);
        n.childNodes?.forEach(walk);
      };
      walk(document.body);
      all[0]?.click();
    });
    await sleep(1200);
  } else {
    await sleep(1200);
  }

  // Enter booking
  await clickText(page, 'احجزي الآن');
  await sleep(1500);
  await shot(page, '03-booking');

  // Select first service then continue to staff/group
  await page.evaluate(() => {
    const texts = [];
    const walk = (n) => {
      if (!n) return;
      if (n.nodeType === 3 && n.textContent?.trim()) texts.push({ t: n.textContent.trim(), el: n.parentElement });
      n.childNodes?.forEach(walk);
    };
    walk(document.body);
    const svc = texts.find((x) => x.t.includes('قص وتصفيف'));
    (svc?.el?.closest('[role=button],button') || svc?.el)?.click();
  });
  await sleep(600);
  await clickText(page, 'التالي');
  await sleep(1000);

  // Enable group booking
  await clickText(page, 'حجز جماعي');
  await sleep(600);
  // Add companion if button exists
  await clickText(page, 'إضافة مرافق'); // matches "+ إضافة مرافق"
  await sleep(500);
  await shot(page, '05-group');

  // Continue to time then confirmation (cash)
  await clickText(page, 'التالي');
  await sleep(1000);
  // pick first slot
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[role=button],button')];
    const slot = buttons.find((b) => /\d/.test(b.textContent || '') && (b.textContent || '').length < 12);
    slot?.click();
  });
  await sleep(500);
  await clickText(page, 'التالي');
  await sleep(1200);
  await shot(page, '04-cash');

  await browser.close();
  console.log('ALL DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
