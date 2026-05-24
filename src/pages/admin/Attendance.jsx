import { Fingerprint, LogIn, LogOut, Clock, Search, Timer, Users, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import './Admin.css';
import './Attendance.css';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [attendance, setAttendance]   = useState([]);
  const [loading, setLoading]         = useState(true);
  
  const { globalSearchTerm } = useOutletContext() || { globalSearchTerm: '' };
  const [localSearchTerm, setLocalSearchTerm]           = useState('');
  const { activeBranch } = useBranch();

  useEffect(() => {
    if (!activeBranch) {
      setAttendance([]);
      setLoading(false);
      return;
    }
    const qAtt = query(collection(db, 'attendance'), where('branchId', '==', activeBranch.id));
    const unsub = onSnapshot(qAtt, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => {
        const tA = a.timestamp?.toMillis?.() ?? 0;
        const tB = b.timestamp?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setAttendance(logs);
      setLoading(false);
    });
    return () => unsub();
  }, [activeBranch]);

  const simulateScan = async () => {
    if (!activeBranch) return;
    const names = ['Alex Johnson', 'Sarah Williams', 'Mike Chen', 'Emily Davis'];
    await addDoc(collection(db, 'attendance'), {
      memberId:   'M-' + Math.floor(1000 + Math.random() * 9000),
      memberName: names[Math.floor(Math.random() * names.length)],
      type:       Math.random() > 0.5 ? 'Check-In' : 'Check-Out',
      timestamp:  serverTimestamp(),
      method:     'Biometric Scanner 1',
      branchId:   activeBranch.id
    });
  };

  const manualCheckIn = async () => {
    if (!activeBranch) return;
    const name = prompt('Enter Member Name to Check-In:');
    if (!name) return;
    await addDoc(collection(db, 'attendance'), {
      memberId:   'Manual-' + Math.floor(1000 + Math.random() * 9000),
      memberName: name,
      type:       'Check-In',
      timestamp:  serverTimestamp(),
      method:     'Manual Entry',
      branchId:   activeBranch.id
    });
  };

  /* Active members */
  const activeMap = new Map();
  [...attendance]
    .sort((a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0))
    .forEach(log => {
      if (log.type === 'Check-In') activeMap.set(log.memberId, log);
      else activeMap.delete(log.memberId);
    });
  const activeMembersList = Array.from(activeMap.values());
  const activeCount = activeMembersList.length;

  /* Helpers */
  const fmtTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDate = (ts) => {
    if (!ts) return 'Today';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtDuration = (ts) => {
    if (!ts) return 'Just now';
    const ms   = Date.now() - (ts.toMillis?.() ?? new Date(ts).getTime());
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  /* Filtered rows */
  const rows = filterQuery === 'active' ? activeMembersList : attendance;
  const getFilteredLogs = () => {
    let filtered = rows;

    const searchTerm = (globalSearchTerm || localSearchTerm || '').toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(l => 
        (l.memberName || '').toLowerCase().includes(searchTerm) ||
        (l.memberId || '').toLowerCase().includes(searchTerm)
      );
    }
    return filtered;
  };

  const filtered = getFilteredLogs();

  /* Checkins and checkouts today */
  const todayStr = new Date().toLocaleDateString();
  const todayIn  = attendance.filter(l => l.type === 'Check-In'  && fmtDate(l.timestamp) === todayStr).length;
  const todayOut = attendance.filter(l => l.type === 'Check-Out' && fmtDate(l.timestamp) === todayStr).length;

  return (
    <div className="admin-container animate-fade-in">

      {/* ── Header ── */}
      <div className="admin-header">
        <div>
          <h1><Activity size={22} className="text-accent" /> Live Attendance</h1>
          <p>Real-time gym entry & exit log</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={simulateScan} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fingerprint size={16} /> Simulate Scanner
          </button>
          <button className="btn btn-primary" onClick={manualCheckIn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogIn size={16} /> Manual Check-In
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="attn-summary-row">
        <div className="attn-summary-card accent">
          <div className="attn-summary-icon"><Users size={20} /></div>
          <div>
            <div className="attn-summary-value">{activeCount}</div>
            <div className="attn-summary-label">Currently Inside</div>
          </div>
        </div>
        <div className="attn-summary-card green">
          <div className="attn-summary-icon"><LogIn size={20} /></div>
          <div>
            <div className="attn-summary-value">{todayIn}</div>
            <div className="attn-summary-label">Check-Ins Today</div>
          </div>
        </div>
        <div className="attn-summary-card red">
          <div className="attn-summary-icon"><LogOut size={20} /></div>
          <div>
            <div className="attn-summary-value">{todayOut}</div>
            <div className="attn-summary-label">Check-Outs Today</div>
          </div>
        </div>
        <div className="attn-summary-card blue">
          <div className="attn-summary-icon"><Clock size={20} /></div>
          <div>
            <div className="attn-summary-value">{attendance.length}</div>
            <div className="attn-summary-label">Total Log Entries</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="attn-table-card">

        {/* Search bar */}
        <div className="attn-table-toolbar">
          <div className="attn-search">
            <Search size={15} />
            <input
              type="text" 
              placeholder="Search by name or member ID..." 
              value={localSearchTerm}
              onChange={e => setLocalSearchTerm(e.target.value)}
            />
          </div>
          <span className="attn-count-badge">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="attn-table-wrap">
          <table className="attn-table">
            <thead>
              {filterQuery === 'active' ? (
                <tr>
                  <th>Member</th>
                  <th>Check-In Time</th>
                  <th>Duration Inside</th>
                  <th>Method</th>
                </tr>
              ) : (
                <tr>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Action</th>
                  <th>Method</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="attn-empty">Loading live logs…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="attn-empty">No records found.</td></tr>
              ) : filterQuery === 'active' ? (
                filtered.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className="attn-member-name">{log.memberName}</span>
                      <span className="attn-member-id">{log.memberId}</span>
                    </td>
                    <td className="attn-time"><Clock size={13} />{fmtTime(log.timestamp)}</td>
                    <td>
                      <span className="attn-badge green">
                        <Timer size={12} />{fmtDuration(log.timestamp)}
                      </span>
                    </td>
                    <td className="attn-method">{log.method}</td>
                  </tr>
                ))
              ) : (
                filtered.map(log => (
                  <tr key={log.id}>
                    <td className="attn-time"><Clock size={13} />{fmtTime(log.timestamp)}</td>
                    <td className="attn-date">{fmtDate(log.timestamp)}</td>
                    <td>
                      <span className="attn-member-name">{log.memberName}</span>
                      <span className="attn-member-id">{log.memberId}</span>
                    </td>
                    <td>
                      <span className={`attn-badge ${log.type === 'Check-In' ? 'green' : 'red'}`}>
                        {log.type === 'Check-In' ? <LogIn size={12} /> : <LogOut size={12} />}
                        {log.type}
                      </span>
                    </td>
                    <td className="attn-method">{log.method}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
