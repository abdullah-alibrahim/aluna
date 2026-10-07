import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import { badgeTone, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

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
        body: JSON.stringify({ amount: value }),
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
      <PageHeader title="داشبورد المحل" subtitle="اختاري صالوناً لإدارة الحجوزات ونقطة البيع" />
      <ErrorBanner message={error} />

      <div className="grid">
        <StatCard label="صالوناتي" value={shops.length} />
        <StatCard label="رصيد المحفظة" value={money(wallet?.balance)} hint="نقداً · ل.س" />
      </div>

      <div className="card stack">
        <strong>طلب سحب</strong>
        <div className="row">
          <input
            placeholder="المبلغ"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <button type="button" disabled={withdrawing} onClick={requestWithdraw}>
            {withdrawing ? 'جاري الإرسال...' : 'إرسال طلب'}
          </button>
        </div>
        <div className="muted small">يراجع الأدمن الطلب ثم يحوّل المبلغ.</div>
      </div>

      {shops.length === 0 ? (
        <div className="card">
          <EmptyState title="ما عندك صالونات بعد" hint="أضيفي صالوناً من تطبيق المالك أولاً" />
        </div>
      ) : (
        <div className="stack">
          {shops.map((s) => {
            const status = s.approvalStatus || (s.isApproved ? 'approved' : 'pending');
            return (
              <div key={s._id} className="card shop-card">
                <div>
                  <div className="title-row">
                    <strong style={{ fontSize: '1.05rem' }}>{s.name}</strong>
                    <Badge tone={badgeTone('shop', status)}>{shopStatusAr[status] || status}</Badge>
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {s.address || s.cityId?.name || 'صالون'}
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
