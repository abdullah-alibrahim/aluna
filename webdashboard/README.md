# ألونا — لوحة الويب

داشبورد ويب (عربي RTL) للأدمن ومالك الصالون، متصل بنفس Backend.

## التشغيل

```bash
cd webdashboard
cp .env.example .env
# عبّي Firebase + VITE_API_URL
npm install
npm run dev
```

يفتح على `http://localhost:5173`

## الدخول

- حساب **admin** → `/admin`
- حساب **owner** → `/owner`

## الميزات

- أدمن: صالونات معلّقة، موافقة/رفض، سحوبات، حجوزات
- مالك: صالونات، فروع، حجوزات، نقطة بيع/فواتير/مصاريف
