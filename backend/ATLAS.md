# MongoDB Atlas (قاعدة الإنتاج الثابتة)

**الحالة: مُفعّلة على الإنتاج ✅**

| العنصر | القيمة |
|---|---|
| Cluster | `aluna-cluster` (M0 — Free) |
| المزوّد / المنطقة | AWS / N. Virginia `us-east-1` (نفس منطقة دوال Vercel الافتراضية `iad1`) |
| إصدار MongoDB | 8.0.x |
| قاعدة البيانات | `aluna` |
| مستخدم قاعدة البيانات | `aluna_app` (دور: `readWriteAnyDatabase@admin`) |
| الشبكة | `0.0.0.0/0` — لأن Vercel Serverless يتصل من IPات متغيرة |

## ما تغيّر في Vercel (مشروع `aluna-api`)

- `MONGO_URI` = رابط Atlas (Production + Preview) — نوعه **Secret**.
- `USE_MEMORY_MONGO` = **محذوف** من Production وPreview.
- `AUTO_SEED` غير مفعّل، لذلك إعادة النشر **لا** تمسح أو تعيد بذر البيانات.

> ⚠️ لا تُكتب كلمة مرور قاعدة البيانات في هذا الملف ولا في أي ملف داخل الريبو (المستودع عام).
> الرابط الكامل محفوظ في Vercel → Settings → Environment Variables.
> لتدوير كلمة المرور: Atlas → Database Access → `aluna_app` → Edit → Edit Password، ثم حدّث `MONGO_URI` في Vercel وأعد النشر.

## كيفية التحقق سريعاً

```bash
curl -s https://aluna-api-flax.vercel.app/api/health | python3 -m json.tool
# يجب أن يظهر: "db": { "mode": "remote", "state": "connected", ... }
```

`mode: remote` = متصل بـ Atlas، و`memory` = قاعدة مؤقتة في الذاكرة (لا تستخدمها في الإنتاج).

## البذر (مرة واحدة فقط)

```bash
cd backend
MONGO_URI='<atlas-uri>' USE_MEMORY_MONGO=0 npm run seed:syria
MONGO_URI='<atlas-uri>' USE_MEMORY_MONGO=0 npm run seed:test-accounts
```

تم تنفيذ البذر مرة واحدة على Atlas: 13 مدينة، 7 تصنيفات، 5 مراكز تجريبية، مركز اختبار واحد، خدمات/موظفون/فروع/حجوزات، وحسابات الاختبار الثلاثة.

## التطوير المحلي

اتركي `backend/.env` كما هو (`mongodb://127.0.0.1:27017/salonapp` + `USE_MEMORY_MONGO=1`) — الكود يتجاهل `USE_MEMORY_MONGO` تلقائياً إذا كان `MONGO_URI` بعيداً، فيمكنك استخدام Atlas محلياً بلصق الرابط في `.env` دون تغيير أي كود.
