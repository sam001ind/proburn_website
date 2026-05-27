import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function SetupPassword() {
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      // 1. Update password in Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // 2. Find and update the member document to remove needsPasswordReset flag
      const q = query(collection(db, 'members'), where('email', '==', currentUser.email));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const memberRef = doc(db, 'members', snap.docs[0].id);
        await updateDoc(memberRef, {
          needsPasswordReset: false
        });
        // 3. Redirect to admin portal
        navigate('/admin', { replace: true });
      } else {
        throw new Error("Could not find your member profile.");
      }
    } catch (err) {
      setError(err.message || 'Failed to update password.');
      setLoading(false);
    }
  };

  const accent = '#10b981'; // FitPat Green

  return (
    <div className="login-container" style={{
      background: `radial-gradient(ellipse at 40% 0%, ${accent}22 0%, transparent 55%),
                   radial-gradient(ellipse at 100% 100%, ${accent}11 0%, transparent 50%),
                   #0a0a0a`,
    }}>
      <div className="login-box glass-card animate-fade-in" style={{ borderColor: `${accent}33` }}>

        <div className="login-brand-header">
          <div className="login-brand-icon" style={{ background: `${accent}22`, color: accent }}>
            <ShieldCheck size={32} />
          </div>
          <div className="login-brand-name">
            Secure Your <span style={{ color: accent }}>Account</span>
          </div>
          <div className="login-tagline">
            Please set a new, secure password before accessing your Admin Portal.
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, marginTop: '1rem' }}
          >
            {loading ? 'Updating...' : 'Set Password & Continue'}
          </button>
        </form>

      </div>
    </div>
  );
}
