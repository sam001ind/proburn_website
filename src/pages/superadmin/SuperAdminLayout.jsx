import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import '../AdminLayout.css'; 
import '../admin/Admin.css';

export default function SuperAdminLayout() {
  const { currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!currentUser || !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-header" style={{ marginBottom: '2rem' }}>
          <h2>PROBURN<br/><span className="highlight">SUPER ADMIN</span></h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/superadmin/dashboard" className="nav-item">
            <LayoutDashboard size={20} />
            <span>Gym Management</span>
          </Link>
          <button 
            className="nav-item" 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              width: '100%', 
              cursor: 'pointer', 
              marginTop: 'auto',
              color: '#ff4444',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.8rem 1rem',
              fontSize: '1rem',
              justifyContent: 'flex-start'
            }} 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span style={{ fontWeight: 600 }}>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar glass-panel">
          <div className="topbar-right">
            <span>{currentUser.email}</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
