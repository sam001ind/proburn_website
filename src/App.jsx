import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import HomePage from './pages/HomePage';
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
import HeroEditor from './pages/admin/homepage/HeroEditor';
import FeaturesEditor from './pages/admin/homepage/FeaturesEditor';
import ClassesEditor from './pages/admin/homepage/ClassesEditor';
import ContactEditor from './pages/admin/homepage/ContactEditor';
import BrandingEditor from './pages/admin/homepage/BrandingEditor';
import NavbarEditor from './pages/admin/homepage/NavbarEditor';
import SectionsManager from './pages/admin/homepage/SectionsManager';
import ClockInSettings from './pages/admin/settings/ClockInSettings';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/login" replace /> : <HomePage />} />
          <Route path="/login" element={<Login />} />
          
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
            <Route path="homepage">
              <Route index element={<Navigate to="navbar" replace />} />
              <Route path="navbar" element={<NavbarEditor />} />
              <Route path="branding" element={<BrandingEditor />} />
              <Route path="sections" element={<SectionsManager />} />
              <Route path="hero" element={<HeroEditor />} />
              <Route path="features" element={<FeaturesEditor />} />
              <Route path="classes" element={<ClassesEditor />} />
              <Route path="plans" element={<Plans />} />
              <Route path="contact" element={<ContactEditor />} />
            </Route>
            <Route path="settings">
              <Route index element={<Navigate to="clockin" replace />} />
              <Route path="clockin"  element={<ClockInSettings />} />
              <Route path="roles"    element={<Roles />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="streaks"  element={<Streaks />} />
              <Route path="branches" element={<Branches />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
