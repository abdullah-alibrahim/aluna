import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function OwnerProfile() {
  const { me } = useAuth();
  const [name, setName] = useState(me?.name || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([api('/auth/me'), api('/faqs/owner').catch(() => [])])
      .then(([u, f]) => {
        setName(u.name || '');
        setPhone(u.phone || '');
        setFaqs(Array.isArray(f) ? f : f?.faqs || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/auth/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) });
      setMsg('تم تحديث الملف');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      await api('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: password }),
      });
      setPassword('');
      setConfirm('');
      setMsg('تم تغيير كلمة المرور');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="الملف الشخصي" subtitle={me?.email || ''} />
      <ErrorBanner message={error} />
      {msg ? <div className="banner success-banner">{msg}</div> : null}

      <form className="card stack" onSubmit={saveProfile}>
        <CardHeader title="بيانات الحساب" />
        <div className="form-grid">
          <Field label="الاسم" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" required />
          </Field>
          <Field label="رقم الهاتف">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+963 9xx xxx xxx"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </Field>
          <Field label="البريد الإلكتروني" hint="لا يمكن تغييره من هنا" className="span-2">
            <input value={me?.email || ''} readOnly disabled />
          </Field>
        </div>
        <div className="row">
          <button type="submit">حفظ التغييرات</button>
        </div>
      </form>

      <form className="card stack" onSubmit={savePassword}>
        <CardHeader title="تغيير كلمة المرور" extra={<span className="muted small">6 أحرف على الأقل</span>} />
        <div className="form-grid">
          <Field label="كلمة المرور الجديدة" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              minLength={6}
              required
            />
          </Field>
          <Field label="تأكيد كلمة المرور" required>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••"
              minLength={6}
              required
            />
          </Field>
        </div>
        <div className="row">
          <button type="submit">تحديث كلمة المرور</button>
        </div>
      </form>

      <div className="card stack">
        <CardHeader title="أسئلة شائعة للمراكز" />
        {faqs.length === 0 ? (
          <p className="muted">لا محتوى حالياً</p>
        ) : (
          faqs.map((f) => (
            <details key={f._id} className="faq-item">
              <summary>{f.question}</summary>
              <p className="muted">{f.answer}</p>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
