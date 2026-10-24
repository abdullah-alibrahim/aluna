import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, CardHeader, Field } from '../../components/ui';

export default function OwnerHome() {
  const [shops, setShops] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');

  const load = () =>
    Promise.all([api('/owner/shops'), api('/owner/wallet')])
      .then(([s, w]) => {
        setShops(s);
        setWallet(w.wallet || w);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const requestWithdraw = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      alert('أدخلي مبلغاً صحيحاً');
      return;
    }
    setWithdrawing(true);
    try {
      await api('/owner/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: value,
          payoutDetails: 'طلب سحب من لوحة الويب',
        }),
      });
      setAmount('');
      await load();
      alert('تم إرسال طلب السحب');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader
        title="مراكزي"
        subtitle="إدارة مراكز التجميل والحجوزات والمحفظة"
        actions={
          <Link to="/owner/create-shop" className="btn-link">
            + إضافة مركز
          </Link>
        }
      />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard icon="🏪" label="مراكز تجميلي" value={shops.length} hint="مركز مسجّل باسمك" />
        <StatCard icon="💰" label="رصيد المحفظة" value={money(wallet?.balance)} hint="نقداً · ل.س" />
      </div>

      <div className="quick-links">
        <Link to="/owner/bookings" className="quick-link">
          <strong>📅 الحجوزات</strong>
          <span className="muted">كل المراكز</span>
        </Link>
        <Link to="/owner/tickets" className="quick-link">
          <strong>💬 الدعم</strong>
          <span className="muted">تذاكر ورسائل</span>
        </Link>
        <Link to="/owner/wallet" className="quick-link">
          <strong>💳 المحفظة</strong>
          <span className="muted">رصيد وسحب</span>
        </Link>
        <Link to="/owner/profile" className="quick-link">
          <strong>👤 الملف</strong>
          <span className="muted">الحساب والإعدادات</span>
        </Link>
      </div>

      <div className="card stack">
        <CardHeader title="طلب سحب" extra={<span className="muted small">يراجعه الأدمن ثم يحوّل المبلغ</span>} />
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Field label="المبلغ (ل.س)" className="grow">
            <input
              type="number"
              min="1"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ maxWidth: 260 }}
            />
          </Field>
          <button type="button" disabled={withdrawing} onClick={requestWithdraw}>
            {withdrawing ? 'جاري الإرسال...' : 'إرسال طلب'}
          </button>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="card">
          <EmptyState
            title="ما عندك مراكز بعد"
            hint="أضيفي مركزاً من «إضافة مركز» في القائمة"
            icon="🏪"
          />
        </div>
      ) : (
        <div className="stack">
          {shops.map((s) => {
            const status = s.approvalStatus || (s.isApproved ? 'approved' : 'pending');
            return (
              <div key={s._id} className="card shop-card">
                <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                  {s.images?.[0] ? (
                    <img src={s.images[0]} alt="" className="shop-thumb" loading="lazy" />
                  ) : null}
                  <div>
                    <div className="title-row">
                      <strong style={{ fontSize: '1.05rem' }}>{s.name}</strong>
                      <Badge tone={badgeTone('shop', status)}>{shopStatusAr[status] || status}</Badge>
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {s.address || s.cityId?.name || 'مركز تجميل'}
                    </div>
                  </div>
                </div>
                <div className="row">
                  <Link to={`/owner/shops/${s._id}`}>
                    <button type="button">داشبورد المحل</button>
                  </Link>
                  <Link to={`/owner/shops/${s._id}/bookings`}>
                    <button type="button" className="secondary">
                      الحجوزات
                    </button>
                  </Link>
                  <Link to={`/owner/shops/${s._id}/pos`}>
                    <button type="button" className="secondary">
                      نقطة البيع
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
