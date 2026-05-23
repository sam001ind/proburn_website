import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Login.css';

export default function MemberLogin() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        // Check if email exists in members collection first
        const q = query(collection(db, 'members'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('unauthorized');
        }

        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/member');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/member');
      }
    } catch (err) {
      if (err.message === 'unauthorized') {
        setError("Email not found. Please ask the Admin to add you first.");
      } else {
        setError(isRegistering ? 'Failed to register. Please ensure your password is 6+ characters.' : 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      <div className="login-box glass-card animate-fade-in" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Back to Site
        </Link>
        <div className="login-header">
          {isRegistering ? <UserPlus className="text-accent" size={48} /> : <LogIn className="text-accent" size={48} />}
          <h2>Member Portal</h2>
          <p>{isRegistering ? 'Create your digital gym account' : 'Sign in to your member account'}</p>
        </div>
        <form onSubmit={handleAuth} className="login-form">
          {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isRegistering ? 'Already have an account?' : "Don't have a login yet?"}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginLeft: '0.5rem', fontWeight: 'bold' }}
            >
              {isRegistering ? 'Sign In' : 'Register Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
