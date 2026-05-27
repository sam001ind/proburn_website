import { Search, Filter, MoreVertical, Database, Edit2 } from 'lucide-react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, where } from "firebase/firestore";;
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import ImageUpload from '../../components/ImageUpload';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext'; 
import { useTenant } from '../../context/TenantContext';
import './Admin.css';

export default function Staff() {
  const { activeGymId } = useTenant();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');
  
  const [allStaff, setAllStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { globalSearchTerm } = useOutletContext() || { globalSearchTerm: '' };
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const { activeBranch, branches } = useBranch();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    joined: new Date().toISOString().split('T')[0],
    photoURL: '',
    branchIds: []
  });

  const openAddModal = () => {
    setEditingMemberId(null);
    setFormData({ 
      name: '', email: '', role: roles.length > 0 && roles[0].name !== 'Super Admin' ? roles[0].name : 'Trainer', 
      joined: new Date().toISOString().split('T')[0], photoURL: '', 
      branchIds: activeBranch ? [activeBranch.id] : [] 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingMemberId(staff.id);
    setFormData({
      name: staff.name,
      email: staff.email || '',
      role: staff.role || 'Trainer',
      joined: new Date().toISOString().split('T')[0], 
      photoURL: staff.photoURL || '',
      branchIds: staff.branchIds || (staff.branchId ? [staff.branchId] : [])
    });
    setIsModalOpen(true);
  };

  // Live Database Listener
  useEffect(() => {
    if (!activeBranch) {
      setAllStaff([]);
      setLoading(false);
      return;
    }
    const unsubMembers = onSnapshot(query(collection(db, 'members'), where('gymId', '==', activeGymId), where('gymId', '==', activeGymId)), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStaff(membersData.filter(m => m.role && m.role !== 'Member' && (m.branchIds?.includes(activeBranch.id) || m.branchId === activeBranch.id)));
      setLoading(false);
    });
    const unsubRoles = onSnapshot(query(collection(db, 'roles'), where('gymId', '==', activeGymId), where('gymId', '==', activeGymId)), (snapshot) => {
      const rolesData = snapshot.docs.map(doc => doc.data());
      setRoles(rolesData);
    });
    return () => { unsubMembers(); unsubRoles(); };
  }, [activeBranch]);

  const seedDatabase = async () => {
    const mockStaff = [
      { memberId: 'S-1001', name: 'Admin Manager', role: 'Super Admin', status: 'Active', joined: 'Oct 2023', plan: 'N/A', expiry: 999 },
      { memberId: 'S-1002', name: 'John Trainer', role: 'Trainer', status: 'Active', joined: 'Jan 2024', plan: 'N/A', expiry: 999 }
    ];
    for (const m of mockStaff) {
      await addDoc(collection(db, 'members'), { ...m, gymId: activeGymId });
    }
    alert('Mock staff added to Firebase!');
  };

  const getFilteredStaff = () => {
    let filtered = allStaff;

    if (filterQuery) {
      switch (filterQuery) {
        case 'active':
          filtered = filtered.filter(m => m.status === 'Active');
          break;
        case 'inactive':
          filtered = filtered.filter(m => m.status !== 'Active');
          break;
      }
    }

    const searchTerm = (globalSearchTerm || localSearchTerm || '').toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(m => 
        (m.name || '').toLowerCase().includes(searchTerm) ||
        (m.id || '').toLowerCase().includes(searchTerm) ||
        (m.email || '').toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const staffList = getFilteredStaff();

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMemberId) {
        const staffRef = doc(db, 'members', editingMemberId);
        
        await updateDoc(staffRef, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          photoURL: formData.photoURL,
          branchIds: formData.branchIds
        });
      } else {
        const newStaff = {
          memberId: 'S-' + Math.floor(1000 + Math.random() * 9000),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: 'N/A',
          status: 'Active',
          joined: new Date(formData.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          expiry: 999,
          photoURL: formData.photoURL,
          branchIds: formData.branchIds
        };
        await addDoc(collection(db, 'members'), { ...newStaff, gymId: activeGymId });
      }
      setIsModalOpen(false);
      setEditingMemberId(null);
      setFormData({ name: '', email: '', role: roles.length > 0 ? roles[0].name : 'Trainer', joined: new Date().toISOString().split('T')[0], photoURL: '' });
    } catch (err) {
      alert("Error saving staff: " + err.message);
    }
  };


  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1>Staff Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage trainers, coaches and front-desk staff</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {allStaff.length === 0 && (
            <button className="btn btn-outline" onClick={seedDatabase}>
              <Database size={18} /> Seed Staff
            </button>
          )}
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Staff Member</button>
        </div>
      </div>


      <div className="members-table-container glass-panel">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={localSearchTerm}
              onChange={e => setLocalSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline"><Filter size={18} /> Filter</button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading staff from Firebase...</td></tr>
            ) : staffList.map((m) => (
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
                <td>{m.role}</td>
                <td>
                  <span className={`status-badge ${m.status?.toLowerCase()}`}>
                    {m.status}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMemberId ? "Edit Staff" : "Add New Staff"}>
        <form className="modal-form" onSubmit={handleAddStaff}>
          <ImageUpload
            value={formData.photoURL}
            onChange={(url) => setFormData({ ...formData, photoURL: url })}
            storagePath="staff/photos"
            label="Staff Photo"
            width={400}
            height={400}
            maxMB={2}
          />
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. staff@email.com" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Super Admin">Super Admin</option>
              {roles.filter(r => r.name !== 'Super Admin').map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assigned Branches</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              {branches.map(b => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.branchIds.includes(b.id)} 
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({...formData, branchIds: [...formData.branchIds, b.id]});
                      } else {
                        setFormData({...formData, branchIds: formData.branchIds.filter(id => id !== b.id)});
                      }
                    }} 
                  />
                  {b.branchName || b.gymName}
                </label>
              ))}
            </div>
          </div>
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
