import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, LogOut, Settings, CreditCard, Clock } from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { path: '/admin/members', icon: <Users size={20} />, label: 'Members' },
    { path: '/admin/attendance', icon: <Clock size={20} />, label: 'Attendance' },
    { path: '/admin/classes', icon: <Calendar size={20} />, label: 'Classes' },
    { path: '/admin/billing', icon: <CreditCard size={20} />, label: 'Billing' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-header">
          <h2>PRO<span>BURN</span> MIS</h2>
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
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link logout text-red">
            <LogOut size={20} />
            <span>Logout / Exit</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar glass-panel">
          <div className="topbar-search">
            <input type="text" placeholder="Search members, classes, or transactions..." />
          </div>
          <div className="topbar-user">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
