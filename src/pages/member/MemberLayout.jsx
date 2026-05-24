import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User, LogOut, Clock, Activity, Dumbbell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import useBranding from '../../hooks/useBranding';
import './MemberLayout.css';

export default function MemberLayout() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { currentUser } = useAuth();
  const branding   = useBranding();
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
    { path: '/member/health', icon: <Activity size={20} />, label: 'My Health' },
  ];

  return (
    <div className="member-layout" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      
      {/* Top Bar */}
      <header className="member-topbar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {branding.logoURL ? (
            <img
              src={branding.logoURL}
              alt={branding.gymName}
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          ) : (
            <Dumbbell size={20} style={{ color: branding.brandColor || 'var(--accent)' }} />
          )}
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
            {(() => {
              const full = branding.gymName || 'PROBURN';
              const hi   = branding.gymNameHighlight || 'BURN';
              const idx  = full.toUpperCase().indexOf(hi.toUpperCase());
              if (idx === -1) return <span style={{ color: branding.brandColor || 'var(--accent)' }}>{full}</span>;
              return <>{full.slice(0, idx)}<span style={{ color: branding.brandColor || 'var(--accent)' }}>{full.slice(idx, idx + hi.length)}</span>{full.slice(idx + hi.length)}</>;
            })()}
          </h2>
        </div>

        <div className="topbar-user">
          <span className="member-name-text" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            {fullName}
          </span>
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="Avatar" className="avatar" style={{ objectFit: 'cover', width: '32px', height: '32px' }} />
          ) : (
            <div className="avatar" style={{ background: branding.brandColor || 'var(--accent)', width: '32px', height: '32px', fontSize: '12px' }}>{initials}</div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="member-content">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="member-bottom-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`member-nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label.replace('My ', '')}</span>
          </Link>
        ))}
        
        <button className="member-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </nav>

    </div>
  );
}
