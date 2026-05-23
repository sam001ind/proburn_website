import { Fingerprint, LogIn, LogOut, Clock, Search, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './Admin.css';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Database Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by timestamp descending
      logs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      setAttendance(logs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const simulateBiometricScan = async () => {
    const randomMembers = ['Alex Johnson', 'Sarah Williams', 'Mike Chen', 'Emily Davis'];
    const memberName = randomMembers[Math.floor(Math.random() * randomMembers.length)];
    const types = ['Check-In', 'Check-Out'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    await addDoc(collection(db, 'attendance'), {
      memberId: 'M-' + Math.floor(1000 + Math.random() * 9000),
      memberName: memberName,
      type: type,
      timestamp: serverTimestamp(),
      method: 'Biometric Scanner 1'
    });
  };

  const manualCheckIn = async () => {
    const name = prompt("Enter Member Name to Check-In:");
    if (!name) return;
    await addDoc(collection(db, 'attendance'), {
      memberId: 'Manual-' + Math.floor(1000 + Math.random() * 9000),
      memberName: name,
      type: 'Check-In',
      timestamp: serverTimestamp(),
      method: 'Manual Entry'
    });
  };

  // Calculate active members
  const activeMembersMap = new Map();
  // Sort oldest to newest to correctly replay events and find current state
  const sortedForActive = [...attendance].sort((a, b) => {
    const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
    const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
    return timeA - timeB;
  });

  sortedForActive.forEach(log => {
    if (log.type === 'Check-In') {
      activeMembersMap.set(log.memberId, log);
    } else if (log.type === 'Check-Out') {
      activeMembersMap.delete(log.memberId);
    }
  });

  const activeMembersList = Array.from(activeMembersMap.values());
  const activeCount = activeMembersList.length;

  const calculateDuration = (ts) => {
    if (!ts) return 'Just now';
    const start = ts.toMillis ? ts.toMillis() : new Date(ts).getTime();
    const now = Date.now();
    const diffMins = Math.floor((now - start) / 60000);
    if (diffMins < 60) return `${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    if (ts.toDate) {
      return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return 'Today';
    if (ts.toDate) {
      return ts.toDate().toLocaleDateString();
    }
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1>Live Attendance</h1>
          <p style={{ color: 'var(--text-muted)' }}>Currently inside: <strong className="text-green">{activeCount} members</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline text-accent" onClick={simulateBiometricScan}>
            <Fingerprint size={18} /> Simulate Scanner
          </button>
          <button className="btn btn-primary" onClick={manualCheckIn}>
            <LogIn size={18} /> Manual Check-In
          </button>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <div className="filters-row" style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', padding: '0.5rem 1rem', borderRadius: '8px', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder="Search member logs..." style={{ background: 'transparent', border: 'none', color: 'var(--text)', marginLeft: '0.5rem', width: '100%', outline: 'none' }} />
          </div>
        </div>
        
        <table className="members-table">
          <thead>
            {filterQuery === 'active' ? (
              <tr>
                <th>Member Name</th>
                <th>Check-In Time</th>
                <th>Duration Inside</th>
                <th>Method</th>
              </tr>
            ) : (
              <tr>
                <th>Time</th>
                <th>Date</th>
                <th>Member Name</th>
                <th>Action</th>
                <th>Method</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Loading live attendance logs...</td></tr>
            ) : filterQuery === 'active' ? (
              activeMembersList.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No members currently in the gym.</td></tr>
              ) : activeMembersList.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.memberName}</strong> <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>({log.memberId})</span></td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--text-muted)" />
                    {formatTime(log.timestamp)}
                  </td>
                  <td>
                    <span className="plan-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Timer size={12} />
                      {calculateDuration(log.timestamp)}
                    </span>
                  </td>
                  <td>{log.method}</td>
                </tr>
              ))
            ) : (
              attendance.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No one has checked in yet.</td></tr>
              ) : attendance.map((log) => (
                <tr key={log.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--text-muted)" />
                    {formatTime(log.timestamp)}
                  </td>
                  <td>{formatDate(log.timestamp)}</td>
                  <td><strong>{log.memberName}</strong> <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>({log.memberId})</span></td>
                  <td>
                    <span className={`plan-badge ${log.type === 'Check-In' ? 'active' : 'expired'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {log.type === 'Check-In' ? <LogIn size={12} /> : <LogOut size={12} />}
                      {log.type}
                    </span>
                  </td>
                  <td>{log.method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
