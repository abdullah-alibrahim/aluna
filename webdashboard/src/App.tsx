import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import AdminHome from './pages/admin/AdminHome';
import AdminShops from './pages/admin/AdminShops';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminBookings from './pages/admin/AdminBookings';
import AdminTickets from './pages/admin/AdminTickets';
import OwnerHome from './pages/owner/OwnerHome';
import OwnerShopHome from './pages/owner/OwnerShopHome';
import OwnerBranches from './pages/owner/OwnerBranches';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerPos from './pages/owner/OwnerPos';

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/admin"
          element={
            <Guard role="admin">
              <Shell
                links={[
                  { to: '/admin', label: 'داشبورد الأدمن', end: true },
                  { to: '/admin/shops', label: 'الصالونات' },
                  { to: '/admin/withdrawals', label: 'السحوبات' },
                  { to: '/admin/bookings', label: 'الحجوزات' },
                  { to: '/admin/tickets', label: 'التذاكر' },
                ]}
              />
            </Guard>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="tickets" element={<AdminTickets />} />
        </Route>
        <Route
          path="/owner"
          element={
            <Guard role="owner">
              <Shell
                links={[
                  { to: '/owner', label: 'محلاتي', end: true },
                ]}
              />
            </Guard>
          }
        >
          <Route index element={<OwnerHome />} />
          <Route path="shops/:shopId" element={<OwnerShopHome />} />
          <Route path="shops/:shopId/branches" element={<OwnerBranches />} />
          <Route path="shops/:shopId/bookings" element={<OwnerBookings />} />
          <Route path="shops/:shopId/pos" element={<OwnerPos />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
