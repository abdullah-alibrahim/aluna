import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { badgeTone, shopStatusAr } from '../../lib/labels';
import { Badge, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Toolbar, CardHeader } from '../../components/ui';

export default function AdminShops() {
  const nav = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const detailRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([api('/admin/shops/pending'), api('/admin/shops')]);
      setPending(p);
      setAll(a);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (detail && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [detail]);

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await api(`/admin/shops/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? note || 'مرفوض من الإدارة' : undefined,
        }),
      });
      setNote('');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const toggleFeatured = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/admin/shops/${id}/featured`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId('');
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return all;
    return all.filter((s) =>
      [s.name, s.ownerId?.name, s.cityId?.name, s.approvalStatus]
        .filter(Boolean)
        .some((v) => String(v).includes(term)),
    );
  }, [all, q]);

  if (loading) return <LoadingBlock />;

  return (
    <div className="stack">
      <PageHeader title="مراكز التجميل" subtitle={`${pending.length} بانتظار الموافقة · ${all.length} إجمالي`} actions={<button className="btn primary" onClick={() => nav('/admin/shops/new')}>إضافة مركز</button>} />
      <ErrorBanner message={error} />

      <div className="card stack">
        <CardHeader title={`بانتظار الموافقة (${pending.length})`} />
        {pending.length === 0 ? (
          <div className="banner success-banner">لا توجد طلبات معلّقة — كل المراكز تمت مراجعتها.</div>
        ) : (
          <>
            <input
              placeholder="ملاحظة الرفض (اختياري) — تُستخدم عند رفض طلب"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>المركز</th>
                    <th>المالك</th>
                    <th>المدينة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="row" style={{ flexWrap: 'nowrap' }}>
                          {s.images?.[0] ? <img src={s.images[0]} alt="" className="shop-thumb" loading="lazy" /> : null}
                          <strong>{s.name}</strong>
                        </div>
                      </td>
                      <td data-label="المالك">{s.ownerId?.name || '—'}</td>
                      <td data-label="المدينة">{s.cityId?.name || '—'}</td>
                      <td className="row">
                        <button type="button" disabled={busyId === s._id} onClick={() => setStatus(s._id, 'approved')}>
                          موافقة
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busyId === s._id}
                          onClick={() => setStatus(s._id, 'rejected')}
                        >
                          رفض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="card stack">
        <CardHeader
          title={`كل المراكز (${filtered.length})`}
          extra={
            <Toolbar>
              <input placeholder="بحث بالاسم أو المالك..." value={q} onChange={(e) => setQ(e.target.value)} />
            </Toolbar>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState title="لا نتائج" hint="جرّبي كلمة بحث أخرى" icon="🔍" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المركز</th>
                  <th>المالك</th>
                  <th>المدينة</th>
                  <th>الحالة</th>
                  <th>مميّز</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = s.approvalStatus || (s.isApproved ? 'approved' : 'pending');
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="row" style={{ flexWrap: 'nowrap' }}>
                          {s.images?.[0] ? <img src={s.images[0]} alt="" className="shop-thumb" loading="lazy" /> : null}
                          <strong>{s.name}</strong>
                        </div>
                      </td>
                      <td data-label="المالك">{s.ownerId?.name || '—'}</td>
                      <td data-label="المدينة">{s.cityId?.name || '—'}</td>
                      <td data-label="الحالة">
                        <Badge tone={badgeTone('shop', status)}>{shopStatusAr[status] || status}</Badge>
                      </td>
                      <td data-label="مميّز">
                        <Badge tone={s.isFeatured ? 'ok' : 'neutral'}>{s.isFeatured ? 'مميّز' : 'عادي'}</Badge>
                      </td>
                      <td className="row">
                        <button type="button" className="secondary" onClick={() => setDetail(s)}>
                          تفاصيل
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={busyId === s._id}
                          onClick={() => toggleFeatured(s._id)}
                        >
                          {s.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                        </button>
                        {status === 'approved' ? (
                          <button
                            type="button"
                            className="danger"
                            disabled={busyId === s._id}
                            onClick={() => {
                              if (confirm(`سحب الموافقة عن «${s.name}»؟ سيختفي من التطبيق.`)) {
                                setStatus(s._id, 'rejected');
                              }
                            }}
                          >
                            سحب الموافقة
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail ? (
        <div className="card stack shop-detail" ref={detailRef}>
          <div className="card-head">
            <strong>تفاصيل: {detail.name}</strong>
            <button type="button" className="secondary" onClick={() => setDetail(null)}>
              إغلاق
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <span className="muted small">المالك</span>
              <div>{detail.ownerId?.name || '—'}</div>
              <div className="muted small">{detail.ownerId?.email || ''}</div>
            </div>
            <div>
              <span className="muted small">المدينة والعنوان</span>
              <div>{detail.cityId?.name || '—'} · {detail.address || '—'}</div>
            </div>
            <div>
              <span className="muted small">الحالة</span>
              <div className="row">
                <Badge tone={badgeTone('shop', detail.approvalStatus || (detail.isApproved ? 'approved' : 'pending'))}>
                  {shopStatusAr[detail.approvalStatus || (detail.isApproved ? 'approved' : 'pending')] || '—'}
                </Badge>
                <Badge tone={detail.isFeatured ? 'ok' : 'neutral'}>{detail.isFeatured ? 'مميّز' : 'عادي'}</Badge>
              </div>
            </div>
            <div>
              <span className="muted small">التقييم</span>
              <div>{detail.rating ?? '—'} ({detail.reviewCount ?? 0} مراجعة)</div>
            </div>
            <div>
              <span className="muted small">الموقع</span>
              <div className="small" dir="ltr" style={{ textAlign: 'right' }}>
                {detail.location?.coordinates?.length
                  ? `${detail.location.coordinates[1]}, ${detail.location.coordinates[0]}`
                  : '—'}
              </div>
            </div>
            <div>
              <span className="muted small">فاصل المواعيد</span>
              <div>{detail.slotInterval ? `${detail.slotInterval} دقيقة` : '—'}</div>
            </div>
          </div>
          {detail.description ? <p className="muted">{detail.description}</p> : null}
          {detail.rejectionReason ? <div className="error-banner">سبب الرفض: {detail.rejectionReason}</div> : null}
          {detail.images?.length ? (
            <div className="row">
              {detail.images.map((src: string) => (
                <img key={src} src={src} alt="" className="media-thumb" style={{ width: 110, height: 110 }} loading="lazy" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
