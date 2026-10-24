# MongoDB Atlas (إنتاج ثابت)

على Vercel الذاكرة المؤقتة (`USE_MEMORY_MONGO=1`) تسبب ضياع بيانات واختلاف `shopId` بين الطلبات.

## الخطوات

1. أنشئي cluster مجاني على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Network Access → اسمحي بـ `0.0.0.0/0` (أو IPات Vercel).
3. Database Access → مستخدم بكلمة مرور.
4. Connect → انسخي URI بصيغة:
   `mongodb+srv://USER:PASS@cluster.../aluna?retryWrites=true&w=majority`
5. في مشروع Vercel `aluna-api`:
   - عيّني `MONGO_URI` = رابط Atlas
   - احذفي أو عطّلي `USE_MEMORY_MONGO` (أو اتركيها؛ الكود يتجاهلها إذا كان URI بعيداً عن localhost)
   - اختياري أول مرة: `AUTO_SEED=1` و `SEED_TEST_ACCOUNTS=1` ثم عطّليهما بعد البذر
6. Redeploy الـ API.

بعدها الحجوزات والمراكز والصور تثبت عبر كل الـ instances.
