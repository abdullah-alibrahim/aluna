/** Shop approval helpers — backend: isApproved + approvalStatus + rejectionReason */

export type ShopApprovalFields = {
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  rejectionReason?: string | null;
  status?: string;
};

export const isShopRejected = (shop?: ShopApprovalFields | null): boolean => {
  if (!shop || shop.isApproved) return false;
  return (
    shop.approvalStatus === 'rejected' ||
    shop.status === 'rejected' ||
    !!shop.rejectionReason
  );
};

/** نشط | مرفوض | بانتظار الموافقة */
export const getShopApprovalLabel = (shop?: ShopApprovalFields | null): string => {
  if (!shop) return 'بانتظار الموافقة';
  if (shop.isApproved || shop.approvalStatus === 'approved') return 'نشط';
  if (isShopRejected(shop)) return 'مرفوض';
  return 'بانتظار الموافقة';
};
