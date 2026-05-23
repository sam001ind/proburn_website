import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Activity, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import '../admin/Admin.css';

export default function MemberDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.email) return;

    // Fetch Member Profile
    const qProfile = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubProfile = onSnapshot(qProfile, (snapshot) => {
      if (!snapshot.empty) {
        setProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setProfile(null);
      }
    });

    // Fetch Member Attendance Logs (By Name since our logs use memberName currently)
    // Note: We'll subscribe once we have the profile name or ID.
    return () => unsubProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!profile?.memberId) return;
    const qAtt = query(collection(db, 'attendance'), where('memberId', '==', profile.memberId));
    const unsubAtt = onSnapshot(qAtt, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAttendance(logs);
      setLoading(false);
    });
    return () => unsubAtt();
  }, [profile]);

  if (!profile) {
    return (
      <div className="members-container animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Account Setup Pending</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          Your email <strong>{currentUser?.email}</strong> has been registered successfully, but it hasn't been linked to a gym membership yet.
        </p>
        <p style={{ color: 'var(--text-muted)' }}>
          Please ask the Admin to update your email address in their database to instantly link your account!
        </p>
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>My Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Member ID: {profile.memberId}</p>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Award size={24} className="text-accent" /></div>
          <div className="stat-info">
            <h3>My Plan</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.plan}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Calendar size={24} className="text-green" /></div>
          <div className="stat-info">
            <h3>Joined Date</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.joined}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><Activity size={24} className="text-red" /></div>
          <div className="stat-info">
            <h3>Status</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span className={`status-badge ${profile.status.toLowerCase()}`}>{profile.status}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid var(--border)' }}>Recent Gym Activity</h3>
        <table className="members-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Action</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>Loading activity...</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No recent check-ins found.</td></tr>
            ) : attendance.slice(0, 5).map((log) => (
              <tr key={log.id}>
                <td>{formatTime(log.timestamp)}</td>
                <td><span className={`plan-badge ${log.type === 'Check-In' ? 'active' : 'expired'}`}>{log.type}</span></td>
                <td>{log.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
