export default function TermsPage() {
  return (
    <div className="login-wrap" style={{ alignItems: 'start', paddingTop: '3rem' }}>
      <article className="card login-card stack" style={{ width: 'min(720px, 100%)' }}>
        <h1 style={{ margin: 0, fontFamily: 'Playfair Display, Cairo, serif', color: 'var(--primary-dark)' }}>
          شروط الاستخدام — ألونا
        </h1>
        <p className="muted">آخر تحديث: {new Date().toLocaleDateString('ar-SY')}</p>
        <p>
          ألونا منصة لحجز مواعيد الصالونات في سوريا. الحجز عبر التطبيق والدفع نقداً عند الصالون ما لم يُذكر
          غير ذلك.
        </p>
        <p>
          الإلغاء وإعادة الجدولة يخضعان لسياسة كل صالون. التطبيق وسيط تقني وليس مسؤولاً عن جودة الخدمة داخل
          الصالون.
        </p>
        <p>
          يحق لنا تعليق الحساب عند إساءة الاستخدام أو الحجوزات الوهمية المتكررة. باستخدامك للتطبيق فإنك توافق
          على هذه الشروط وسياسة الخصوصية.
        </p>
        <p className="muted">للاستفسار: support@aluna.app</p>
      </article>
    </div>
  );
}
