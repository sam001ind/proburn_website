import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, LogOut, Settings, CreditCard, Clock, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import './AdminLayout.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const [userRoleData, setUserRoleData] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // 1. Fetch user's role string from members collection
    const qMember = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubMember = onSnapshot(qMember, (memberSnap) => {
      if (!memberSnap.empty) {
        const memberData = memberSnap.docs[0].data();
        const roleName = memberData.role || 'Member';
        
        // 2. Fetch the role's permissions from roles collection
        const qRole = query(collection(db, 'roles'), where('name', '==', roleName));
        onSnapshot(qRole, (roleSnap) => {
          if (!roleSnap.empty) {
            setUserRoleData({ name: roleName, ...roleSnap.docs[0].data() });
          } else {
            // Default basic role info if custom role deleted or missing
            setUserRoleData({ name: roleName, permissions: { menus: [], widgets: [] } });
          }
        });
      } else {
        // Fallback for default admin account
        if (currentUser.email === 'admin@gym.com' || currentUser.email === 'abhijiththirutheri@gmail.com') {
           setUserRoleData({ name: 'Super Admin' });
        }
      }
    });

    return () => unsubMember();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const navItems = [
    { id: 'dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { id: 'members', path: '/admin/members', icon: <Users size={20} />, label: 'Members' },
    { id: 'attendance', path: '/admin/attendance', icon: <Clock size={20} />, label: 'Attendance' },
    { id: 'billing', path: '/admin/billing', icon: <CreditCard size={20} />, label: 'Billing' },
    { id: 'roles', path: '/admin/roles', icon: <Shield size={20} />, label: 'Roles' },
    { id: 'settings', path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  // RBAC Filtering logic for sidebar
  const visibleNavItems = navItems.filter(item => {
    if (userRoleData?.name === 'Super Admin') return true;
    return userRoleData?.permissions?.menus?.includes(item.id);
  });

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-header">
          <h2>PRO<span>BURN</span> MIS</h2>
        </div>
        
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path === '/admin' ? '/admin/dashboard' : item.path}
              className={`sidebar-link ${(location.pathname === item.path || location.pathname === item.path + '/dashboard') ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button className="sidebar-link logout" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </nav>
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
