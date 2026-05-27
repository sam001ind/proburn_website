import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import DynamicPage from './pages/DynamicPage';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import MemberLayout from './pages/member/MemberLayout';
import Dashboard from './pages/admin/Dashboard';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberHealth from './pages/member/MemberHealth';
import MemberAttendance from './pages/member/MemberAttendance';
import MemberBilling from './pages/member/MemberBilling';
import Members from './pages/admin/Members';
import Staff from './pages/admin/Staff';
import Billing from './pages/admin/Billing';
import Attendance from './pages/admin/Attendance';
import Holidays from './pages/admin/settings/Holidays';
import Streaks from './pages/admin/settings/Streaks';
import Plans from './pages/admin/settings/Plans';
import Roles from './pages/admin/Roles';
import Leads from './pages/admin/Leads';
import Branches from './pages/admin/settings/Branches';
import PagesList from './pages/admin/website/PagesList';
import PageEditor from './pages/admin/website/PageEditor';
import NavigationEditor from './pages/admin/website/NavigationEditor';
import ThemeEditor from './pages/admin/website/ThemeEditor';
import ClockInSettings from './pages/admin/settings/ClockInSettings';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import SuperDashboard from './pages/superadmin/SuperDashboard';
import FitPatLogin from './pages/FitPatLogin';
import SetupPassword from './pages/SetupPassword';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import ProtectedRoute from './components/ProtectedRoute';
import { TenantProvider } from './context/TenantContext';

function App() {
  return (
    <TenantProvider>
    <AuthProvider>
      <BranchProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* SaaS Admin Portal routes */}
          <Route path="/fitpat/login" element={<Login />} />

          {/* Unified FitPat Login */}
          <Route path="/fitpat/partner/login" element={<FitPatLogin />} />
          <Route path="/fitpat/partner/setup-password" element={<SetupPassword />} />

          <Route path="/" element={<Navigate to="/fitpat/partner/login" replace />} />
          
          <Route path="/member" element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MemberDashboard />} />
            <Route path="health" element={<MemberHealth />} />
            <Route path="attendance" element={<MemberAttendance />} />
            <Route path="billing" element={<MemberBilling />} />
          </Route>

          <Route path="/superadmin" element={
            <ProtectedRoute>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperDashboard />} />
            <Route path="website/:gymId">
              <Route index element={<Navigate to="pages" replace />} />
              <Route path="pages" element={<PagesList />} />
              <Route path="pages/:pageId" element={<PageEditor />} />
              <Route path="navigation" element={<NavigationEditor />} />
              <Route path="theme" element={<ThemeEditor />} />
            </Route>
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="staff" element={<Staff />} />
            <Route path="billing" element={<Billing />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leads" element={<Leads />} />

            <Route path="settings">
              <Route index element={<Navigate to="clockin" replace />} />
              <Route path="clockin"  element={<ClockInSettings />} />
              <Route path="roles"    element={<Roles />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="streaks"  element={<Streaks />} />
              <Route path="branches" element={<Branches />} />
            </Route>
          </Route>
          {/* Dynamic Pages Fallback (must be at the bottom) */}
          <Route path="/:gymSlug" element={<DynamicPage isHome={true} />} />
          <Route path="/:gymSlug/:pageSlug" element={<DynamicPage />} />
        </Routes>
      </BrowserRouter>
      </BranchProvider>
    </AuthProvider>
    </TenantProvider>
  );
}

export default App;
