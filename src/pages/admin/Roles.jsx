import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import './Admin.css';

const AVAILABLE_MENUS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Member Management' },
  { id: 'billing', label: 'Billing & Payments' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'roles', label: 'Role Management' }
];

const AVAILABLE_WIDGETS = [
  { id: 'total_members', label: 'Total Members Stat' },
  { id: 'active_members', label: 'Active Members Stat' },
  { id: 'expired_members', label: 'Expired Members Stat' },
  { id: 'expiring_members', label: 'Expiring Members Stats' },
  { id: 'currently_in_gym', label: 'Currently in Gym Stat' },
  { id: 'growth', label: 'Growth Stat' },
  { id: 'todays_collection', label: "Today's Collection Stat" },
  { id: 'weekly_collection', label: 'Weekly Collection Stat' },
  { id: 'monthly_collection', label: 'Monthly Collection Stat' },
  { id: 'yearly_collection', label: 'Yearly Collection Stat' },
  { id: 'due_amount', label: 'Due Amount Stat' },
  { id: 'total_expenses', label: 'Total Expenses Stat' },
  { id: 'revenue_chart', label: 'Revenue Analytics Chart' },
  { id: 'upcoming_classes', label: 'Upcoming Classes Widget' }
];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    menus: [],
    widgets: []
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'roles'), (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rolesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (type, id) => {
    setFormData(prev => {
      const currentList = prev[type];
      if (currentList.includes(id)) {
        return { ...prev, [type]: currentList.filter(item => item !== id) };
      } else {
        return { ...prev, [type]: [...currentList, id] };
      }
    });
  };

  const openAddModal = () => {
    setEditingRoleId(null);
    setFormData({ name: '', menus: [], widgets: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      menus: role.permissions?.menus || [],
      widgets: role.permissions?.widgets || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role? Users assigned to this role will lose their custom access.')) {
      await deleteDoc(doc(db, 'roles', id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.name.toLowerCase() === 'super admin') {
      alert('The "Super Admin" role is a system reserved name. Please choose a different name.');
      return;
    }

    try {
      if (editingRoleId) {
        await updateDoc(doc(db, 'roles', editingRoleId), {
          name: formData.name,
          permissions: {
            menus: formData.menus,
            widgets: formData.widgets
          }
        });
      } else {
        await addDoc(collection(db, 'roles'), {
          name: formData.name,
          permissions: {
            menus: formData.menus,
            widgets: formData.widgets
          }
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving role: ' + err.message);
    }
  };

  const seedSuperAdmin = async () => {
    // Automatically sets up the Super Admin role in DB if missing, though our code bypasses it anyway. It's good to have it visible.
    try {
      await setDoc(doc(db, 'roles', 'super-admin-id'), {
        name: 'Super Admin',
        permissions: {
          menus: AVAILABLE_MENUS.map(m => m.id),
          widgets: AVAILABLE_WIDGETS.map(w => w.id)
        }
      });
      alert('Super Admin role created!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>Role Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!roles.find(r => r.name === 'Super Admin') && (
             <button className="btn btn-outline" onClick={seedSuperAdmin}>
               <Shield size={18} /> Initialize Super Admin
             </button>
          )}
          <button className="btn btn-primary" onClick={openAddModal}>+ Create Role</button>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Menu Access</th>
              <th>Widget Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Loading roles...</td></tr>
            ) : roles.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {r.name === 'Super Admin' ? <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,69,0,0.2)', color: 'var(--accent)', borderRadius: '10px' }}>Full Access</span> : 
                      r.permissions?.menus?.map(m => (
                        <span key={m} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>{m}</span>
                      ))
                    }
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {r.name === 'Super Admin' ? <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,69,0,0.2)', color: 'var(--accent)', borderRadius: '10px' }}>Full Access</span> : 
                      r.permissions?.widgets?.map(w => (
                        <span key={w} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>{w}</span>
                      ))
                    }
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {r.name !== 'Super Admin' && (
                    <>
                      <button className="icon-btn" onClick={() => openEditModal(r)}><Edit2 size={18} /></button>
                      <button className="icon-btn" onClick={() => handleDelete(r.id)}><Trash2 size={18} className="text-red" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {roles.length === 0 && !loading && (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No custom roles created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoleId ? "Edit Role" : "Create New Role"}>
        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Role Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Trainer, Front Desk" />
          </div>

          <div className="form-group">
            <label style={{ marginTop: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Menu Access</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              {AVAILABLE_MENUS.map(menu => (
                <label key={menu.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={formData.menus.includes(menu.id)} onChange={() => handleCheckboxChange('menus', menu.id)} />
                  {menu.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ marginTop: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Dashboard Widget Access</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              {AVAILABLE_WIDGETS.map(widget => (
                <label key={widget.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={formData.widgets.includes(widget.id)} onChange={() => handleCheckboxChange('widgets', widget.id)} />
                  {widget.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingRoleId ? "Update Role" : "Create Role"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
