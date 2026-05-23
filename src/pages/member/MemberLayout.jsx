import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Calendar, LogOut, Clock, Activity } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import '../AdminLayout.css'; // Reuse same layout styles

export default function MemberLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const navItems = [
    { path: '/member', icon: <User size={20} />, label: 'My Profile' },
    { path: '/member/attendance', icon: <Clock size={20} />, label: 'My Attendance' },
    { path: '/member/billing', icon: <Activity size={20} />, label: 'My Billing' },
  ];

  return (
    <div className="admin-layout" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-header">
          <h2>MEMBER<span>PORTAL</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text)' }} onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar glass-panel">
          <div className="topbar-search">
            <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Welcome Back!</h3>
          </div>
          <div className="topbar-user">
            <div className="avatar" style={{ background: 'var(--accent)' }}>M</div>
            <span>Member</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
