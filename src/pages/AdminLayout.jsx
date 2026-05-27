import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Calendar, LogOut, Settings, CreditCard, Clock, Shield, Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Home, UserPlus, Building2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useBranch } from '../context/BranchContext';
import { useTenant } from '../context/TenantContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { activeGymId, activeGymData } = useTenant();
  const { branches, activeBranch, setActiveBranch } = useBranch();
  const [userRoleData, setUserRoleData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const [expandedMenus, setExpandedMenus] = useState(['settings', 'homepage']);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // If no active gym is resolved yet, show a loading spinner or empty layout
  if (!activeGymId && currentUser) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Gym Workspace...</div>;
  }

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // 1. Fetch user's role string from members collection
    const qMember = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubMember = onSnapshot(qMember, (memberSnap) => {
      if (!memberSnap.empty) {
        const memberData = memberSnap.docs[0].data();
        const roleName = memberData.role || 'Member';
        
        // 2. Fetch the role's permissions from roles collection
        const qRole = query(collection(db, 'roles'), where('name', '==', roleName), where('gymId', '==', activeGymId));
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

  // Live count of new leads
  useEffect(() => {
    if (!activeGymId) return;
    const unsub = onSnapshot(
      query(collection(db, 'leads'), where('status', '==', 'New'), where('gymId', '==', activeGymId)),
      (snap) => setNewLeadsCount(snap.size)
    );
    return () => unsub();
  }, []);

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
    { id: 'staff', path: '/admin/staff', icon: <UserCog size={20} />, label: 'Staff' },
    { id: 'attendance', path: '/admin/attendance', icon: <Clock size={20} />, label: 'Attendance' },
    { id: 'billing', path: '/admin/billing', icon: <CreditCard size={20} />, label: 'Billing' },
    {
      id: 'leads', path: '/admin/leads', icon: <UserPlus size={20} />, label: 'Leads',
      badge: newLeadsCount > 0 ? newLeadsCount : null
    },
    { 
      id: 'website', 
      icon: <Home size={20} />, 
      label: 'Website Builder',
      subMenus: [
        { path: '/admin/website/pages',      label: '📄 Pages' },
        { path: '/admin/website/navigation', label: '🔗 Navigation' },
        { path: '/admin/website/theme',      label: '🎨 Theme Settings' },
      ]
    },
    { 
      id: 'settings', 
      icon: <Settings size={20} />, 
      label: 'Settings',
      subMenus: [
        { path: '/admin/settings/clockin',   label: '⏱ Clock-In Settings' },
        { path: '/admin/settings/branches',  label: '🏢 Branches' },
        { path: '/admin/settings/roles',     label: '🛡 Role Management' },
        { path: '/admin/settings/holidays',  label: '📅 Holidays' },
        { path: '/admin/settings/streaks',   label: '🔥 Streaks' },
      ]
    },

  ];

  const toggleSubMenu = (id) => {
    if (expandedMenus.includes(id)) {
      setExpandedMenus(expandedMenus.filter(m => m !== id));
    } else {
      setExpandedMenus([...expandedMenus, id]);
    }
  };

  // RBAC Filtering logic for sidebar
  const visibleNavItems = navItems.filter(item => {
    // Hide Website Builder completely if running as native mobile app
    if (Capacitor.isNativePlatform() && item.id === 'website') return false;
    
    if (userRoleData?.name === 'Super Admin' || userRoleData?.name === 'Admin') return true;
    return userRoleData?.permissions?.menus?.includes(item.id);
  });

  const handleMobileNav = () => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {window.innerWidth <= 768 && !isCollapsed && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{activeGymData?.name || 'PROBURN'}</h2>
          {window.innerWidth <= 768 && (
            <button onClick={() => setIsCollapsed(true)} style={{ background: 'none', border: 'none', color: 'white' }}>✕</button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <div key={item.id}>
              {item.subMenus ? (
                <>
                  <button 
                    onClick={() => toggleSubMenu(item.id)}
                    className={`sidebar-link ${location.pathname.startsWith('/admin/' + item.id) ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {expandedMenus.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {expandedMenus.includes(item.id) && !isCollapsed && (
                    <div className="sub-menu-container">
                      {item.subMenus.map(sub => (
                        <Link 
                          key={sub.path} 
                          to={sub.path}
                          onClick={handleMobileNav}
                          className={`sidebar-sub-link ${location.pathname === sub.path ? 'active' : ''}`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link 
                  to={item.path === '/admin' ? '/admin/dashboard' : item.path}
                  onClick={handleMobileNav}
                  className={`sidebar-link ${(location.pathname === item.path || location.pathname === item.path + '/dashboard') ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '50px',
                      padding: '1px 7px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      minWidth: '20px',
                      textAlign: 'center',
                    }}>{item.badge}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
          
          <button className="sidebar-link logout" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%', marginTop: '1rem' }} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="icon-btn" 
              style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={24} />
            </button>
            <div className="topbar-search" style={{ flexGrow: 1, maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ width: '100%' }} 
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="topbar-user">
            {/* Branch switcher */}
            {branches && branches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1rem' }}>
                <Building2 size={15} style={{ color: 'var(--text-secondary)' }} />
                <select
                  value={activeBranch?.id || ''}
                  onChange={e => {
                    const branch = branches.find(b => b.id === e.target.value);
                    if (branch) setActiveBranch(branch);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '0.3rem 0.7rem',
                    fontSize: '0.82rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    maxWidth: '160px',
                  }}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} style={{ background: '#0f1a2e' }}>
                      {b.branchName || b.gymName || 'Branch'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet context={{ globalSearchTerm }} />
        </div>
      </main>
    </div>
  );
}
