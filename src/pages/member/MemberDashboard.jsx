import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Activity, Calendar, Award, TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import confetti from 'canvas-confetti';
import '../admin/Admin.css';

export default function MemberDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [gymConfig, setGymConfig] = useState({ targetStreak: 0, plans: [] });
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [hasCelebratedStreak, setHasCelebratedStreak] = useState(false);

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

    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      setHolidays(snapshot.docs.map(doc => doc.data().date));
    });

    const unsubConfig = onSnapshot(doc(db, 'settings', 'gym_config'), (docSnap) => {
      if (docSnap.exists()) {
        setGymConfig(docSnap.data());
      }
    });

    return () => { unsubAtt(); unsubHolidays(); unsubConfig(); };
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

  let progressDescription = "";
  let historyData = [];
  if (profile?.weightHistory && profile.weightHistory.length > 0) {
    historyData = profile.weightHistory.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(entry.weight)
    }));

    if (profile.weightHistory.length >= 2) {
      const firstWeight = parseFloat(profile.weightHistory[0].weight);
      const lastWeight = parseFloat(profile.weightHistory[profile.weightHistory.length - 1].weight);
      const weightDiff = (lastWeight - firstWeight).toFixed(1);
      
      let bmiDiffStr = "";
      if (profile.height) {
        const hInMeters = parseFloat(profile.height) / 100;
        const firstBmi = parseFloat((firstWeight / (hInMeters * hInMeters)).toFixed(1));
        const currentBmi = parseFloat(bmi);
        const bmiDiff = (currentBmi - firstBmi).toFixed(1);
        if (bmiDiff < 0) bmiDiffStr = ` (BMI dropped by ${Math.abs(bmiDiff)} points)`;
        else if (bmiDiff > 0) bmiDiffStr = ` (BMI increased by ${bmiDiff} points)`;
      }
      
      const isUnderweight = bmiCategory === 'Underweight';
      
      if (weightDiff < 0) {
        if (isUnderweight) {
          progressDescription = `You've lost ${Math.abs(weightDiff)} kg${bmiDiffStr}.`;
        } else {
          progressDescription = `Great progress! You've lost ${Math.abs(weightDiff)} kg${bmiDiffStr}.`;
        }
      } else if (weightDiff > 0) {
        if (isUnderweight || bmiCategory === 'Normal (Indian Standard)') {
          progressDescription = `Awesome! You've gained ${weightDiff} kg${bmiDiffStr}.`;
        } else {
          progressDescription = `You've gained ${weightDiff} kg${bmiDiffStr}.`;
        }
      } else {
        progressDescription = `Your weight and BMI have remained stable since you started tracking.`;
      }
    }
  }

  // Calculate Streak
  const getLocalYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkInDates = new Set();
  attendance.forEach(log => {
    if (log.type === 'Check-In' && log.timestamp) {
      const d = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      checkInDates.add(getLocalYYYYMMDD(d));
    }
  });

  const holidayDates = new Set(holidays);

  let streak = 0;
  let curr = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = getLocalYYYYMMDD(curr);
    if (checkInDates.has(dateStr)) {
      streak++;
    } else {
      if (i === 0) {
        // Today not attended yet. Do not break streak.
      } else if (holidayDates.has(dateStr)) {
        // Holiday not attended. Do not break streak.
      } else {
        // Missed a regular day. Break streak.
        break;
      }
    }
    curr.setDate(curr.getDate() - 1);
  }

  // Confetti trigger
  useEffect(() => {
    if (streak > 0 && gymConfig.targetStreak > 0 && streak >= gymConfig.targetStreak && !hasCelebratedStreak) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff7b00', '#ffffff', '#eccc68'],
        disableForReducedMotion: true
      });
      setHasCelebratedStreak(true);
    }
  }, [streak, gymConfig.targetStreak, hasCelebratedStreak]);

  // Find plan features
  const activePlanDetails = gymConfig.plans?.find(p => p.name.toLowerCase() === profile.plan.toLowerCase())?.features || "No specific features configured for this plan.";

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>My Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Member ID: {profile.memberId}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card glass-card interactive-card" onClick={() => setShowPlanModal(true)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Award size={24} className="text-accent" /></div>
          <div className="stat-info">
            <p>My Plan</p>
            <h3>{profile.plan}</h3>
          </div>
        </div>
        <div className="stat-card glass-card interactive-card" onClick={() => navigate('/member/attendance')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Calendar size={24} className="text-green" /></div>
          <div className="stat-info">
            <p>Joined Date</p>
            <h3>{profile.joined}</h3>
          </div>
        </div>
        <div className="stat-card glass-card interactive-card" onClick={() => navigate('/member/billing')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Activity size={24} className="text-red" /></div>
          <div className="stat-info">
            <p>Membership Status</p>
            <h3>
              <span className={`status-badge ${profile.status.toLowerCase()}`}>{profile.status}</span>
            </h3>
          </div>
        </div>
        <div className="stat-card glass-card interactive-card" onClick={() => navigate('/member/attendance?filter=streak')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Flame size={24} style={{ color: '#ff7b00' }} /></div>
          <div className="stat-info">
            <p>Current Streak</p>
            <h3>{streak} {streak === 1 ? 'Day' : 'Days'}</h3>
          </div>
        </div>
      </div>

      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title={`${profile.plan} Plan Details`}>
        <div style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {activePlanDetails}
        </div>
      </Modal>

      {historyData.length >= 2 && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <TrendingUp size={18} className="text-accent" />
            Weight Progress Trend
          </h4>
          {progressDescription && (
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              {progressDescription}
            </p>
          )}
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke={bmiColor || "var(--accent)"} 
                  strokeWidth={4} 
                  dot={{ fill: bmiColor || 'var(--accent)', strokeWidth: 2, r: 5 }} 
                  activeDot={{ r: 7, fill: '#fff' }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="members-table-container glass-panel">
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid var(--border)' }}>Recent Gym Activity</h3>
        <table className="admin-table">
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
