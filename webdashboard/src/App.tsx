import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Shell from './components/Shell';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminShops = lazy(() => import('./pages/admin/AdminShops'));
const AdminCreateShop = lazy(() => import('./pages/admin/AdminCreateShop'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminCities = lazy(() => import('./pages/admin/AdminCities'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminFinances = lazy(() => import('./pages/admin/AdminFinances'));
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const OwnerHome = lazy(() => import('./pages/owner/OwnerHome'));
const OwnerShopHome = lazy(() => import('./pages/owner/OwnerShopHome'));
const OwnerBranches = lazy(() => import('./pages/owner/OwnerBranches'));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings'));
const OwnerPos = lazy(() => import('./pages/owner/OwnerPos'));
const OwnerBookingsAll = lazy(() => import('./pages/owner/OwnerBookingsAll'));
const OwnerTickets = lazy(() => import('./pages/owner/OwnerTickets'));
const OwnerWallet = lazy(() => import('./pages/owner/OwnerWallet'));
const OwnerProfile = lazy(() => import('./pages/owner/OwnerProfile'));
const OwnerCreateShop = lazy(() => import('./pages/owner/OwnerCreateShop'));
const OwnerServices = lazy(() => import('./pages/owner/OwnerServices'));
const OwnerStaff = lazy(() => import('./pages/owner/OwnerStaff'));
const OwnerCoupons = lazy(() => import('./pages/owner/OwnerCoupons'));
const OwnerEditShop = lazy(() => import('./pages/owner/OwnerEditShop'));
const OwnerPortfolio = lazy(() => import('./pages/owner/OwnerPortfolio'));
const OwnerNotifications = lazy(() => import('./pages/owner/OwnerNotifications'));

function PageFallback() {
  return (
    <div className="loading-block" style={{ minHeight: '40vh' }}>
      <div className="spinner" />
      <span className="muted">جاري التحميل...</span>
    </div>
  );
}

function Guard({ role, children }: { role: 'admin' | 'owner'; children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-wrap">
        <div className="loading-block">
          <div className="spinner" />
          <span className="muted">جاري التحميل...</span>
        </div>
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== role) return <Navigate to={me.role === 'admin' ? '/admin' : '/owner'} replace />;
  return <>{children}</>;
}

const adminLinks = [
  { to: '/admin', label: 'الرئيسية', end: true },
  { to: '/admin/shops', label: 'مراكز التجميل' },
  { to: '/admin/bookings', label: 'الحجوزات' },
  { to: '/admin/tickets', label: 'التذاكر' },
  { to: '/admin/finances', label: 'المالية' },
  { to: '/admin/withdrawals', label: 'السحوبات' },
  { to: '/admin/cities', label: 'المدن' },
  { to: '/admin/categories', label: 'التصنيفات' },
  { to: '/admin/banners', label: 'البانرات' },
  { to: '/admin/faqs', label: 'الأسئلة الشائعة' },
  { to: '/admin/settings', label: 'الإعدادات' },
  { to: '/admin/notifications', label: 'الإشعارات' },
  { to: '/admin/profile', label: 'الملف الشخصي' },
];

const ownerLinks = [
  { to: '/owner', label: 'مراكزي', end: true },
  { to: '/owner/bookings', label: 'الحجوزات' },
  { to: '/owner/tickets', label: 'الدعم' },
  { to: '/owner/wallet', label: 'المحفظة' },
  { to: '/owner/notifications', label: 'الإشعارات' },
  { to: '/owner/create-shop', label: 'إضافة مركز' },
  { to: '/owner/profile', label: 'الملف الشخصي' },
];

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/admin"
            element={
              <Guard role="admin">
                <Shell links={adminLinks} />
              </Guard>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="shops/new" element={<AdminCreateShop />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="cities" element={<AdminCities />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="finances" element={<AdminFinances />} />
            <Route path="faqs" element={<AdminFAQs />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route
            path="/owner"
            element={
              <Guard role="owner">
                <Shell links={ownerLinks} />
              </Guard>
            }
          >
            <Route index element={<OwnerHome />} />
            <Route path="bookings" element={<OwnerBookingsAll />} />
            <Route path="tickets" element={<OwnerTickets />} />
            <Route path="wallet" element={<OwnerWallet />} />
            <Route path="notifications" element={<OwnerNotifications />} />
            <Route path="profile" element={<OwnerProfile />} />
            <Route path="create-shop" element={<OwnerCreateShop />} />
            <Route path="shops/:shopId" element={<OwnerShopHome />} />
            <Route path="shops/:shopId/branches" element={<OwnerBranches />} />
            <Route path="shops/:shopId/bookings" element={<OwnerBookings />} />
            <Route path="shops/:shopId/pos" element={<OwnerPos />} />
            <Route path="shops/:shopId/services" element={<OwnerServices />} />
            <Route path="shops/:shopId/staff" element={<OwnerStaff />} />
            <Route path="shops/:shopId/coupons" element={<OwnerCoupons />} />
            <Route path="shops/:shopId/edit" element={<OwnerEditShop />} />
            <Route path="shops/:shopId/portfolio" element={<OwnerPortfolio />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
