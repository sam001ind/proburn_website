import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User, Calendar, LogOut, Clock, Activity, Dumbbell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import '../AdminLayout.css'; 

export default function MemberLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    const qProfile = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubProfile = onSnapshot(qProfile, (snapshot) => {
      if (!snapshot.empty) {
        setProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });
    return () => unsubProfile();
  }, [currentUser]);

  const fullName = profile?.name || 'Member';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0];
  let initials = firstName.charAt(0).toUpperCase();
  if (nameParts.length > 1) {
    initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  }

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
        <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0', fontSize: '1.5rem' }}>
            PRO<span className="text-accent">BURN</span> <Dumbbell className="text-accent" size={24} />
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Member Portal</span>
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
            <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Welcome, {firstName}!</h3>
          </div>
          <div className="topbar-user">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Avatar" className="avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="avatar" style={{ background: 'var(--accent)' }}>{initials}</div>
            )}
            <span>{fullName}</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
