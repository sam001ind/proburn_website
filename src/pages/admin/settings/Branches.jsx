import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";;
import { db } from '../../../firebase'; 
import { useTenant } from '../../../context/TenantContext';
import { Plus, Edit2, Trash2, Building2, DatabaseZap } from 'lucide-react';
import Modal from '../../../components/Modal';
import '../Admin.css';

export default function Branches() {
  const { activeGymId } = useTenant();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    gymName: '',
    gymNameHighlight: '',
    branchName: '',
    tagline: '',
    brandColor: '#ff4500',
    isDefault: false
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'branches'), where('gymId', '==', activeGymId), where('gymId', '==', activeGymId)), (snap) => {
      setBranches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ gymName: '', gymNameHighlight: '', branchName: '', tagline: '', brandColor: '#ff4500', isDefault: false });
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingId(b.id);
    setFormData({
      gymName: b.gymName || '',
      gymNameHighlight: b.gymNameHighlight || '',
      branchName: b.branchName || '',
      tagline: b.tagline || '',
      brandColor: b.brandColor || '#ff4500',
      isDefault: !!b.isDefault
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, 'branches', editingId), formData);
    } else {
      await addDoc(collection(db, 'branches'), { ...formData, gymId: activeGymId });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this branch? Data tied to it will become orphaned!")) {
      await deleteDoc(doc(db, 'branches', id));
    }
  };

  const handleMigrateData = async () => {
    const defaultBranch = branches.find(b => b.isDefault) || branches[0];
    if (!defaultBranch) return alert("Please create a branch first.");

    if (!confirm(`This will assign ALL existing records (Members, Staff, Billing, etc.) that have no branch to the "${defaultBranch.branchName || defaultBranch.gymName}" branch. Continue?`)) return;

    setLoading(true);
    try {
      const collectionsToMigrate = ['members', 'transactions', 'attendance', 'leads'];
      let updatedCount = 0;

      for (const colName of collectionsToMigrate) {
        const snap = await getDocs(collection(db, colName));
        for (const document of snap.docs) {
          const data = document.data();
          if (!data.branchId && (!data.branchIds || data.branchIds.length === 0)) {
            // It's legacy, it has no branch
            if (data.role && data.role !== 'Member') {
              // Staff
              await updateDoc(doc(db, colName, document.id), { branchIds: [defaultBranch.id] });
            } else {
              // Standard record
              await updateDoc(doc(db, colName, document.id), { branchId: defaultBranch.id });
            }
            updatedCount++;
          }
        }
      }
      alert(`Migration complete! Successfully assigned ${updatedCount} legacy records to ${defaultBranch.branchName || defaultBranch.gymName}.`);
    } catch (err) {
      alert("Error migrating: " + err.message);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6">Loading branches...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Manage Branches</h1>
          <p className="subtitle">Add or edit gym locations</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleMigrateData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#eab308', color: '#eab308' }}>
            <DatabaseZap size={18} /> Migrate Legacy Data
          </button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Branch
          </button>
        </div>
      </div>

      <div className="table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Gym Brand</th>
              <th>Color</th>
              <th>Default</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div className="avatar" style={{ background: `${b.brandColor || '#ff4500'}22`, color: b.brandColor || '#ff4500' }}>
                      <Building2 size={16} />
                    </div>
                    {b.branchName || b.gymName}
                  </div>
                </td>
                <td>{b.gymName} {b.gymNameHighlight}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: b.brandColor || '#ff4500' }} />
                    {b.brandColor || '#ff4500'}
                  </div>
                </td>
                <td>{b.isDefault ? 'Yes' : '-'}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button className="icon-btn" onClick={() => openEditModal(b)} title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(b.id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">No branches found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title={editingId ? "Edit Branch" : "New Branch"} onClose={() => setIsModalOpen(false)}>
          <form className="modal-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Internal Branch Name (e.g. Downtown)</label>
              <input type="text" value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Brand Prefix (e.g. PRO)</label>
                <input type="text" value={formData.gymName} onChange={e => setFormData({...formData, gymName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Brand Highlight (e.g. BURN)</label>
                <input type="text" value={formData.gymNameHighlight} onChange={e => setFormData({...formData, gymNameHighlight: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Brand Color</label>
                <input type="color" value={formData.brandColor} onChange={e => setFormData({...formData, brandColor: e.target.value})} style={{ height: '42px', padding: '0 4px' }} />
              </div>
              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', marginTop: '28px', gap: '8px' }}>
                <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} id="isDefaultCheck" />
                <label htmlFor="isDefaultCheck" style={{ margin: 0, cursor: 'pointer' }}>Set as Default Branch</label>
              </div>
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Create Branch"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
