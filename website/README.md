# Aluna Landing Website

موقع هبوط عربي فخم لتطبيق **ألونا** مع روابط تحميل App Store و Google Play.

## التشغيل

```bash
cd website
npm install
npm run dev
```

يفتح عادة على `http://localhost:5173`.

## روابط المتاجر

عدّلي في `.env`:

```
VITE_APP_STORE_URL=https://apps.apple.com/...
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=...
```

أو عدّلي القيم الافتراضية في `src/config.ts`.

## البناء للرفع

```bash
npm run build
```

المخرجات في `dist/` — جاهزة لأي استضافة ثابتة (Hostinger / Netlify / Vercel).
