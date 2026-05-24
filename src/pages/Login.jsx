import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, UserPlus, Dumbbell } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useBranding from '../hooks/useBranding';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const navigate        = useNavigate();
  const branding        = useBranding();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser }       = useAuth();

  useEffect(() => {
    const routeExistingUser = async () => {
      if (currentUser) {
        const adminEmails = ['admin@gym.com', 'abhijiththirutheri@gmail.com'];
        if (adminEmails.includes(currentUser.email.toLowerCase())) {
          navigate('/admin', { replace: true });
          return;
        }
        const q = query(collection(db, 'members'), where('email', '==', currentUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const memberData = snap.docs[0].data();
          if (memberData.role && memberData.role !== 'Member') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/member', { replace: true });
          }
        } else {
          navigate('/admin', { replace: true });
        }
      }
    };
    routeExistingUser();
  }, [currentUser, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        // Members must exist in the system to register
        const q   = query(collection(db, 'members'), where('email', '==', email));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('unauthorized');
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/member');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        
        // Unified routing logic
        const adminEmails = ['admin@gym.com', 'abhijiththirutheri@gmail.com'];
        if (adminEmails.includes(email.toLowerCase())) {
          navigate('/admin');
          return;
        }

        // Check if user is in members collection
        const q = query(collection(db, 'members'), where('email', '==', email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const memberData = snap.docs[0].data();
          const role = memberData.role || 'Member';
          if (role !== 'Member') {
            // Staff / Custom roles go to admin
            navigate('/admin');
          } else {
            // Regular members go to member portal
            navigate('/member');
          }
        } else {
          // If not in members collection but logged in (legacy staff), default to admin
          navigate('/admin');
        }
      }
    } catch (err) {
      if (err.message === 'unauthorized') {
        setError('Email not found. Please ask the Admin to add you first.');
      } else {
        setError(isRegistering
          ? 'Failed to register. Password must be 6+ characters.'
          : 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const accent = branding.brandColor || '#ff4500';

  return (
    <div className="login-container" style={{
      background: `radial-gradient(ellipse at 40% 0%, ${accent}22 0%, transparent 55%),
                   radial-gradient(ellipse at 100% 100%, ${accent}11 0%, transparent 50%),
                   #0a0a0a`,
    }}>
      <div className="login-box glass-card animate-fade-in" style={{ borderColor: `${accent}33` }}>

        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to Site
        </Link>

        {/* ── Brand header ── */}
        <div className="login-brand-header">
          {branding.logoURL ? (
            <img
              src={branding.logoURL}
              alt={branding.gymName}
              className="login-brand-logo"
              style={{ borderColor: `${accent}44` }}
            />
          ) : (
            <div className="login-brand-icon" style={{ background: `${accent}22`, color: accent }}>
              <Dumbbell size={32} />
            </div>
          )}

          <div className="login-brand-name">
            {(() => {
              const full      = branding.gymName || 'PROBURN';
              const highlight = branding.gymNameHighlight || 'BURN';
              const idx       = full.toUpperCase().indexOf(highlight.toUpperCase());
              if (idx === -1) return <span style={{ color: accent }}>{full}</span>;
              return (
                <>
                  {full.slice(0, idx)}
                  <span style={{ color: accent }}>{full.slice(idx, idx + highlight.length)}</span>
                  {full.slice(idx + highlight.length)}
                </>
              );
            })()}
          </div>

          <div className="login-portal-label">
            {isRegistering ? <UserPlus size={14} /> : <LogIn size={14} />}
            {isRegistering ? 'Create Account' : 'Portal Login'}
          </div>

          {branding.tagline && (
            <div className="login-tagline">{branding.tagline}</div>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleAuth} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            {loading ? 'Please wait…' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle register/login */}
        <div className="login-toggle">
          <span>{isRegistering ? 'Already have an account?' : "First time member?"}</span>
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{ color: accent }}
          >
            {isRegistering ? 'Sign In' : 'Register Here'}
          </button>
        </div>
      </div>
    </div>
  );
}
