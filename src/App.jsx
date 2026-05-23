import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import MemberLogin from './pages/MemberLogin';
import AdminLayout from './pages/AdminLayout';
import MemberLayout from './pages/member/MemberLayout';
import Dashboard from './pages/admin/Dashboard';
import MemberDashboard from './pages/member/MemberDashboard';
import Members from './pages/admin/Members';
import Billing from './pages/admin/Billing';
import Attendance from './pages/admin/Attendance';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />
          
          <Route path="/member" element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MemberDashboard />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="billing" element={<Billing />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
