import { Search, Filter, MoreVertical, Database } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './Admin.css';

export default function Members() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');
  
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Database Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMembers(membersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const seedDatabase = async () => {
    const mockMembers = [
      { memberId: 'M-1042', name: 'Alex Johnson', plan: 'Elite', status: 'Active', joined: 'Oct 2023', expiry: 30 },
      { memberId: 'M-1043', name: 'Sarah Williams', plan: 'Pro', status: 'Active', joined: 'Nov 2023', expiry: 2 },
      { memberId: 'M-1044', name: 'Mike Chen', plan: 'Basic', status: 'Expired', joined: 'Jan 2024', expiry: -5 },
      { memberId: 'M-1045', name: 'Emily Davis', plan: 'Elite', status: 'Active', joined: 'Mar 2024', expiry: 8 },
      { memberId: 'M-1046', name: 'David Wilson', plan: 'Pro', status: 'Active', joined: 'Apr 2024', expiry: 12 },
      { memberId: 'M-1047', name: 'Jessica Taylor', plan: 'Basic', status: 'Expired', joined: 'Aug 2023', expiry: -15 },
      { memberId: 'M-1048', name: 'Robert Moore', plan: 'Elite', status: 'Active', joined: 'Feb 2024', expiry: 1 },
    ];
    for (const m of mockMembers) {
      await addDoc(collection(db, 'members'), m);
    }
    alert('Mock members added to Firebase!');
  };

  const getFilteredMembers = () => {
    if (!filterQuery) return allMembers;
    
    switch (filterQuery) {
      case 'active':
        return allMembers.filter(m => m.status === 'Active');
      case 'expired':
        return allMembers.filter(m => m.status === 'Expired');
      case 'expiring-3':
        return allMembers.filter(m => m.status === 'Active' && m.expiry > 0 && m.expiry <= 3);
      case 'expiring-10':
        return allMembers.filter(m => m.status === 'Active' && m.expiry > 3 && m.expiry <= 10);
      case 'expiring-15':
        return allMembers.filter(m => m.status === 'Active' && m.expiry > 10 && m.expiry <= 15);
      default:
        return allMembers;
    }
  };

  const members = getFilteredMembers();

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>Member Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {allMembers.length === 0 && (
            <button className="btn btn-outline" onClick={seedDatabase}>
              <Database size={18} /> Seed Data
            </button>
          )}
          <button className="btn btn-primary">+ Add Member</button>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder="Search by name or ID..." />
          </div>
          <button className="btn btn-outline"><Filter size={18} /> Filter</button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading members from Firebase...</td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td>{m.memberId || m.id.substring(0,6)}</td>
                <td><strong>{m.name}</strong></td>
                <td><span className={`plan-badge ${m.plan.toLowerCase()}`}>{m.plan}</span></td>
                <td>
                  <span className={`status-badge ${m.status.toLowerCase()}`}>
                    {m.status === 'Active' && m.expiry <= 15 ? `Expiring in ${m.expiry}d` : m.status}
                  </span>
                </td>
                <td>{m.joined}</td>
                <td>
                  <button className="icon-btn"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
