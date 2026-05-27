import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Activity } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function FitPatLogin() {
  const navigate = useNavigate();
  const { setTenant } = useTenant();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, isSuperAdmin } = useAuth();

  useEffect(() => {
    const routeExistingUser = async () => {
      if (currentUser) {
        if (isSuperAdmin) {
          navigate('/fitpat/login', { replace: true });
          return;
        }
        
        // Find member data to check gymId and needsPasswordReset
        const q = query(collection(db, 'members'), where('email', '==', currentUser.email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const memberData = snap.docs[0].data();
          const userGymId = memberData.gymId;
          
          if (!userGymId) {
            setError('Your account is not associated with any gym.');
            return;
          }

          setTenant(userGymId);

          if (memberData.needsPasswordReset) {
            navigate(`/fitpat/partner/setup-password`, { replace: true });
            return;
          }

          if (memberData.role && memberData.role !== 'Member') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/member', { replace: true });
          }
        } else {
           setError('Could not find your gym profile.');
        }
      }
    };
    routeExistingUser();
  }, [currentUser, navigate, isSuperAdmin, setTenant]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // routeExistingUser will handle the redirect once currentUser updates
    } catch (err) {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const accent = '#10b981'; // FitPat Green branding

  return (
    <div className="login-container" style={{
      background: `radial-gradient(ellipse at 40% 0%, ${accent}22 0%, transparent 55%),
                   radial-gradient(ellipse at 100% 100%, ${accent}11 0%, transparent 50%),
                   #0a0a0a`,
    }}>
      <div className="login-box glass-card animate-fade-in" style={{ borderColor: `${accent}33` }}>

        {/* ── Brand header ── */}
        <div className="login-brand-header">
          <div className="login-brand-icon" style={{ background: `${accent}22`, color: accent }}>
            <Activity size={32} />
          </div>

          <div className="login-brand-name">
            <span style={{ color: accent }}>Fit</span>Pat
          </div>

          <div className="login-portal-label">
            <LogIn size={14} />
            Unified Gym Partner Login
          </div>

          <div className="login-tagline">Log in to manage your gym or access your member profile.</div>
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
            style={{ background: `linear-gradient(135deg, ${accent}, #059669)` }}
          >
            {loading ? 'Authenticating...' : 'Sign In to FitPat'}
          </button>
        </form>

      </div>
    </div>
  );
}
