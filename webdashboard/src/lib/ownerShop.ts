import { api } from './api';

/** Resolve a valid shop for the logged-in owner (handles serverless DB id drift). */
export async function resolveOwnerShop(preferredId?: string) {
  const shops = await api('/owner/shops');
  if (!shops?.length) return { shops: [] as any[], shop: null as any };
  const shop = (preferredId && shops.find((s: any) => s._id === preferredId)) || shops[0];
  return { shops, shop };
}

export function arAuthError(message?: string) {
  if (!message) return '';
  if (/not authorized|not your shop|shop not found|does not exist/i.test(message)) {
    return 'المركز غير متاح حالياً — ارجعي لمراكزي وافتحي المركز من جديد';
  }
  return message;
}
