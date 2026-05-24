import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Activity, Calendar, Award, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import '../admin/Admin.css';

export default function MemberDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBmiInfo, setShowBmiInfo] = useState(false);

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

  // Calculate BMI
  let bmi = null;
  let bmiCategory = '';
  let bmiColor = '';
  if (profile.height && profile.weight) {
    const hInMeters = parseFloat(profile.height) / 100;
    const wInKg = parseFloat(profile.weight);
    if (hInMeters > 0) {
      bmi = (wInKg / (hInMeters * hInMeters)).toFixed(1);
      const bmiVal = parseFloat(bmi);
      if (bmiVal < 18.5) { bmiCategory = 'Underweight'; bmiColor = '#ffb142'; }
      else if (bmiVal <= 22.9) { bmiCategory = 'Normal (Indian Standard)'; bmiColor = '#2ed573'; }
      else if (bmiVal <= 24.9) { bmiCategory = 'Overweight'; bmiColor = '#eccc68'; }
      else { bmiCategory = 'Obese'; bmiColor = '#ff4757'; }
    }
  }

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

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Activity size={20} className="text-accent" />
            Health Analytics
            <Info size={18} className="text-secondary" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setShowBmiInfo(true)} />
          </h3>
        </div>

        <Modal isOpen={showBmiInfo} onClose={() => setShowBmiInfo(false)} title="Understanding Your BMI">
          <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 1rem 0' }}><strong>Body Mass Index (BMI)</strong> is calculated by dividing your weight in kilograms by the square of your height in meters (kg/m²).</p>
            <p style={{ margin: '0 0 1.5rem 0' }}>We use the <strong>Indian Medical Guidelines</strong> which are stricter than global standards due to higher health risks at lower weights.</p>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#ffb142' }}>Under</span>
                <span style={{ color: '#2ed573' }}>Normal</span>
                <span style={{ color: '#eccc68' }}>Over</span>
                <span style={{ color: '#ff4757' }}>Obese</span>
              </div>
              
              <div style={{ position: 'relative', width: '100%', height: '24px', borderRadius: '12px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: '17.5%', backgroundColor: '#ffb142' }} title="Underweight" />
                <div style={{ width: '22.5%', backgroundColor: '#2ed573' }} title="Normal" />
                <div style={{ width: '10%', backgroundColor: '#eccc68' }} title="Overweight" />
                <div style={{ width: '50%', backgroundColor: '#ff4757' }} title="Obese" />
                
                {bmi && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: `${Math.min(Math.max(((parseFloat(bmi) - 15) / 20) * 100, 5), 95)}%`, 
                    width: '4px', 
                    height: '100%', 
                    background: '#fff', 
                    boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                    transform: 'translateX(-50%)'
                  }} />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                 <span>15</span>
                 <span>18.5</span>
                 <span>23</span>
                 <span>25</span>
                 <span>35+</span>
              </div>
              
              {bmi && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Your Current BMI: <strong style={{ color: bmiColor, fontSize: '1.2rem' }}>{bmi}</strong></p>
                  <p style={{ margin: '0.25rem 0 0 0', color: bmiColor, fontWeight: 'bold' }}>{bmiCategory}</p>
                </div>
              )}
            </div>

            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li><strong>Under 18.5:</strong> Underweight</li>
              <li><strong>18.5 - 22.9:</strong> Normal / Healthy</li>
              <li><strong>23.0 - 24.9:</strong> Overweight</li>
              <li><strong>25.0+:</strong> Obese</li>
            </ul>
          </div>
        </Modal>

        {profile.height && profile.weight ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Height</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{profile.height} cm</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Weight</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{profile.weight} kg</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${bmiColor}` }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Current BMI</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: bmiColor }}>{bmi}</p>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', color: bmiColor }}>{bmiCategory}</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your height and weight haven't been added yet.</p>
            <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>Ask the admin/front desk to update your profile to unlock Health Analytics!</p>
          </div>
        )}
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
