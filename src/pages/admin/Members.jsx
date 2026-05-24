import { Search, Filter, MoreVertical, Database, Edit2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import './Admin.css';

export default function Members() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');
  
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member',
    plan: 'Basic',
    duration: '30',
    joined: new Date().toISOString().split('T')[0],
    photoURL: '',
    height: '',
    weight: ''
  });

  const openAddModal = () => {
    setEditingMemberId(null);
    setFormData({ name: '', email: '', role: 'Member', plan: 'Basic', duration: '30', joined: new Date().toISOString().split('T')[0], photoURL: '', height: '', weight: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMemberId(member.id);
    setFormData({
      name: member.name,
      email: member.email || '',
      role: member.role || 'Member',
      plan: member.plan === 'N/A' ? 'Basic' : member.plan,
      duration: member.expiry ? member.expiry.toString() : '30',
      joined: new Date().toISOString().split('T')[0], // Assuming we don't edit joined date, just reset form picker to today
      photoURL: member.photoURL || '',
      height: member.height || '',
      weight: member.weight || ''
    });
    setIsModalOpen(true);
  };

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

  const handleAddMember = async (e) => {
    e.preventDefault();
    const isStaff = formData.role === 'Staff';
    
    try {
      if (editingMemberId) {
        const memberRef = doc(db, 'members', editingMemberId);
        await updateDoc(memberRef, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: isStaff ? 'N/A' : formData.plan,
          expiry: isStaff ? 999 : parseInt(formData.duration),
          photoURL: formData.photoURL,
          height: formData.height,
          weight: formData.weight
        });
      } else {
        const newMember = {
          memberId: (isStaff ? 'S-' : 'M-') + Math.floor(1000 + Math.random() * 9000),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: isStaff ? 'N/A' : formData.plan,
          status: 'Active',
          joined: new Date(formData.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          expiry: isStaff ? 999 : parseInt(formData.duration),
          photoURL: formData.photoURL,
          height: formData.height,
          weight: formData.weight
        };
        await addDoc(collection(db, 'members'), newMember);
      }
      setIsModalOpen(false);
      setEditingMemberId(null);
      setFormData({ name: '', email: '', role: 'Member', plan: 'Basic', duration: '30', joined: new Date().toISOString().split('T')[0], photoURL: '', height: '', weight: '' });
    } catch (err) {
      alert("Error saving member: " + err.message);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoURL: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

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
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Member / Staff</button>
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
              <th>Role</th>
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
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {m.photoURL ? (
                      <img src={m.photoURL} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <strong>{m.name}</strong>
                  </div>
                </td>
                <td>{m.role || 'Member'}</td>
                <td>
                  {m.plan === 'N/A' ? (
                    <span className="text-secondary">Staff</span>
                  ) : (
                    <span className={`plan-badge ${m.plan.toLowerCase()}`}>{m.plan}</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${m.status.toLowerCase()}`}>
                    {m.status === 'Active' && m.expiry <= 15 ? `Expiring in ${m.expiry}d` : m.status}
                  </span>
                </td>
                <td>{m.joined}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" onClick={() => openEditModal(m)}><Edit2 size={18} /></button>
                  <button className="icon-btn"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMemberId ? "Edit Person" : "Add New Person"}>
        <form className="modal-form" onSubmit={handleAddMember}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Photo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} id="photo-upload" style={{ display: 'none' }} />
            <label htmlFor="photo-upload" style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 500 }}>
              {formData.photoURL ? 'Change Photo' : 'Upload Photo'}
            </label>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. member@email.com" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Height (cm)</label>
              <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="e.g. 175" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 70.5" />
            </div>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Member">Gym Member</option>
              <option value="Staff">Staff / Trainer</option>
            </select>
          </div>
          {formData.role === 'Member' && (
            <>
              <div className="form-group">
                <label>Membership Plan</label>
                <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration</label>
                <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}>
                  <option value="30">1 Month (30 Days)</option>
                  <option value="90">3 Months (90 Days)</option>
                  <option value="180">6 Months (180 Days)</option>
                  <option value="365">1 Year (365 Days)</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label>Joined Date</label>
            <input type="date" required value={formData.joined} onChange={e => setFormData({...formData, joined: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingMemberId ? "Update Database" : "Save to Database"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
