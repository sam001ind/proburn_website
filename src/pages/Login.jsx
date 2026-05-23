import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/admin');
  };

  return (
    <div className="login-container">
      <div className="login-box glass-card animate-fade-in">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Back to Site
        </Link>
        <div className="login-header">
          <LogIn className="text-accent" size={48} />
          <h2>Staff Portal</h2>
          <p>Sign in to manage Proburn activities</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="staff@proburn.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-full">Sign In</button>
        </form>
      </div>
    </div>
  );
}
