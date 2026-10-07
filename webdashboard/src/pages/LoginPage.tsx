import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, me, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (!loading && me) {
    return <Navigate to={me.role === 'admin' ? '/admin' : '/owner'} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email.trim(), password);
    } catch {
      setLocalError('تعذّر الدخول');
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card stack" onSubmit={onSubmit}>
        <div className="login-brand">
          <h2>ألونا</h2>
          <p className="muted">داشبورد الأدمن أو داشبورد المحل · نقداً · ل.س</p>
        </div>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {(localError || error) && <div className="error">{localError || error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
