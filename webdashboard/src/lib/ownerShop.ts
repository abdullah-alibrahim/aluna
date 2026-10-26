import { api } from './api';

/** Resolve a valid shop for the logged-in owner (handles serverless DB id drift). */
export async function resolveOwnerShop(preferredId?: string) {
  const shops = await api('/owner/shops');
  if (!shops?.length) return { shops: [] as any[], shop: null as any };
  const shop = (preferredId && shops.find((s: any) => s._id === preferredId)) || shops[0];
  return { shops, shop };
}

/**
 * Turn backend error codes into clear Arabic guidance.
 * `SHOP_NOT_FOUND` means the stored id no longer exists (demo DB reseed) — the
 * owner pages auto-redirect, this is the fallback message.
 */
export function arAuthError(message?: string, code?: string) {
  if (
    code === 'SHOP_NOT_FOUND' ||
    /shop not found|does not exist|مركز التجميل غير موجود/i.test(message || '')
  ) {
    return 'تغيّرت بيانات المركز (تحديث بيئة العرض) — يرجى فتح مركزك من «مراكزي»';
  }
  if (
    code === 'NOT_SHOP_OWNER' ||
    /not authorized|not your shop|غير مصرح/i.test(message || '')
  ) {
    return 'هذا المركز غير متاح لهذا الحساب — افتحي مركزك من «مراكزي»';
  }
  return message || '';
}
