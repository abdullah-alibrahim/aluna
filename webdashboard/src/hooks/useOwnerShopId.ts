import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveOwnerShop } from '../lib/ownerShop';

/**
 * Resolve the shop id from the URL against the shops that actually belong to
 * the logged-in owner. Demo/serverless environments can reseed ids, so a bookmarked
 * or cached id may no longer exist — in that case we transparently redirect to the
 * owner's current shop instead of surfacing "Not authorized" / "غير موجود".
 */
export function useOwnerShopId(section?: string) {
  const { shopId: paramId } = useParams();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');

    (async () => {
      try {
        const { shop } = await resolveOwnerShop(paramId);
        if (cancelled) return;

        if (!shop) {
          setError('ما في مركز مرتبط بالحساب');
          setReady(true);
          return;
        }

        if (paramId !== shop._id) {
          navigate(`/owner/shops/${shop._id}${section ? `/${section}` : ''}`, { replace: true });
        }

        setShopId(shop._id);
        setReady(true);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'تعذّر تحميل المركز');
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paramId, section, navigate]);

  return { shopId, ready, error };
}
