import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBanner, LoadingBlock, PageHeader, CardHeader, Field } from '../../components/ui';

export default function AdminProfile() {
  const { me } = useAuth();
  const [name, setName] = useState(me?.name || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/auth/me')
      .then((u) => {
        setName(u.name || '');
        setPhone(u.phone || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone }),
      });
      setMsg('تم تحديث الملف');
      setError('');
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
            <input placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="رقم الهاتف">
            <input
              placeholder="+963 9xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <Field label="تأكيد كلمة المرور" required>
            <input
              type="password"
              placeholder="••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </Field>
        </div>
        <div className="row">
          <button type="submit">تحديث كلمة المرور</button>
        </div>
      </form>
    </div>
  );
}
