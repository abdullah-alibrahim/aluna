export default function PrivacyPage() {
  return (
    <div className="login-wrap" style={{ alignItems: 'start', paddingTop: '3rem' }}>
      <article className="card login-card stack" style={{ width: 'min(720px, 100%)' }}>
        <h1 style={{ margin: 0, fontFamily: 'Playfair Display, Cairo, serif', color: 'var(--primary-dark)' }}>
          سياسة الخصوصية — ألونا
        </h1>
        <p className="muted">آخر تحديث: {new Date().toLocaleDateString('ar-SY')}</p>
        <p>
          تجمع ألونا بيانات الحساب (الاسم، الهاتف/البريد)، حجوزاتك، وموقعك التقريبي عند السماح بذلك لعرض
          الصالونات القريبة. الدفع داخل التطبيق نقداً عند الصالون.
        </p>
        <p>
          لا نبيع بياناتك. نشارك مع الصالون فقط ما يلزم لتنفيذ الحجز. يمكنك طلب حذف الحساب عبر الدعم داخل
          التطبيق أو بالتواصل معنا.
        </p>
        <p>
          الإشعارات اختيارية ويمكن تعطيلها من إعدادات الجهاز. نحفظ الجلسة بشكل آمن عبر خدمات المصادقة.
        </p>
        <p className="muted">للاستفسار: support@aluna.app</p>
      </article>
    </div>
  );
}
