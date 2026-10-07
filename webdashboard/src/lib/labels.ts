export const bookingStatusAr: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكّد',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  no_show: 'لم يحضر',
};

export const shopStatusAr: Record<string, string> = {
  pending: 'بانتظار الموافقة',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export const withdrawalStatusAr: Record<string, string> = {
  pending: 'معلّق',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

export const ticketStatusAr: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'محلولة',
  closed: 'مغلقة',
};

export function badgeTone(kind: 'booking' | 'shop' | 'withdrawal' | 'ticket', status?: string): string {
  const s = status || '';
  if (kind === 'booking') {
    if (s === 'completed' || s === 'confirmed') return 'ok';
    if (s === 'cancelled' || s === 'no_show') return 'bad';
    return 'warn';
  }
  if (kind === 'shop') {
    if (s === 'approved') return 'ok';
    if (s === 'rejected') return 'bad';
    return 'warn';
  }
  if (kind === 'withdrawal') {
    if (s === 'completed' || s === 'approved') return 'ok';
    if (s === 'rejected') return 'bad';
    return 'warn';
  }
  if (s === 'resolved' || s === 'closed') return 'ok';
  return 'warn';
}

export function formatDate(value?: string | Date) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
}
