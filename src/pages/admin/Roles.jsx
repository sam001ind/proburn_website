import { Shield, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import './Admin.css';

const PERMISSION_TREE = [
  {
    id: 'dashboard',
    label: 'Dashboard (Main Menu)',
    type: 'menu',
    children: [
      { id: 'total_members', label: 'Total Members Stat', type: 'widget' },
      { id: 'active_members', label: 'Active Members Stat', type: 'widget' },
      { id: 'expired_members', label: 'Expired Members Stat', type: 'widget' },
      { id: 'expiring_members', label: 'Expiring Members Stats', type: 'widget' },
      { id: 'currently_in_gym', label: 'Currently in Gym Stat', type: 'widget' },
      { id: 'growth', label: 'Growth Stat', type: 'widget' },
      { id: 'todays_collection', label: "Today's Collection Stat", type: 'widget' },
      { id: 'weekly_collection', label: 'Weekly Collection Stat', type: 'widget' },
      { id: 'monthly_collection', label: 'Monthly Collection Stat', type: 'widget' },
      { id: 'yearly_collection', label: 'Yearly Collection Stat', type: 'widget' },
      { id: 'due_amount', label: 'Due Amount Stat', type: 'widget' },
      { id: 'total_expenses', label: 'Total Expenses Stat', type: 'widget' },
      { id: 'revenue_chart', label: 'Revenue Analytics Chart', type: 'widget' },
      { id: 'upcoming_classes', label: 'Upcoming Classes Widget', type: 'widget' }
    ]
  },
  { id: 'members', label: 'Member Management (Main Menu)', type: 'menu', children: [] },
  { id: 'staff', label: 'Staff Management (Main Menu)', type: 'menu', children: [] },
  { id: 'billing', label: 'Billing & Payments (Main Menu)', type: 'menu', children: [] },
  { id: 'attendance', label: 'Attendance (Main Menu)', type: 'menu', children: [] },
  { id: 'homepage', label: 'Homepage Editor (Main Menu)', type: 'menu', children: [] },
  { id: 'roles', label: 'Role Management (Main Menu)', type: 'menu', children: [] },
  { id: 'settings', label: 'Settings (Holidays/Streaks)', type: 'menu', children: [] }
];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(['dashboard']); // Auto-expand dashboard by default
  const [formData, setFormData] = useState({
    name: '',
    maxUsers: '',
    menus: [],
    widgets: []
  });

  const toggleNode = (nodeId) => {
    if (expandedNodes.includes(nodeId)) {
      setExpandedNodes(expandedNodes.filter(id => id !== nodeId));
    } else {
      setExpandedNodes([...expandedNodes, nodeId]);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'roles'), (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rolesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTreeCheckbox = (item, isChecked) => {
    if (item.type === 'menu') {
      const newMenus = isChecked 
        ? [...formData.menus, item.id] 
        : formData.menus.filter(id => id !== item.id);
      
      let newWidgets = [...formData.widgets];
      if (item.children && item.children.length > 0) {
        const childIds = item.children.map(c => c.id);
        if (isChecked) {
          newWidgets = [...new Set([...newWidgets, ...childIds])];
        } else {
          newWidgets = newWidgets.filter(id => !childIds.includes(id));
        }
      }
      setFormData({ ...formData, menus: newMenus, widgets: newWidgets });
    } else {
      const newWidgets = isChecked
        ? [...formData.widgets, item.id]
        : formData.widgets.filter(id => id !== item.id);
      setFormData({ ...formData, widgets: newWidgets });
    }
  };

  const openAddModal = () => {
    setEditingRoleId(null);
    setFormData({ name: '', maxUsers: '', menus: [], widgets: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      maxUsers: role.maxUsers || '',
      menus: role.permissions?.menus || [],
      widgets: role.permissions?.widgets || []
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (role) => {
    setEditingRoleId(null);
    setFormData({
      name: role.name + ' (Copy)',
      maxUsers: role.maxUsers || '',
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
    const isSuperAdminEdit = editingRoleId && roles.find(r => r.id === editingRoleId)?.name === 'Super Admin';

    if (formData.name.toLowerCase() === 'super admin' && !isSuperAdminEdit) {
      alert('The "Super Admin" role is a system reserved name. Please choose a different name.');
      return;
    }

    try {
      const maxUsersInt = formData.maxUsers ? parseInt(formData.maxUsers) : 0;
      if (editingRoleId) {
        await updateDoc(doc(db, 'roles', editingRoleId), {
          name: formData.name,
          maxUsers: maxUsersInt,
          permissions: {
            menus: formData.menus,
            widgets: formData.widgets
          }
        });
      } else {
        await addDoc(collection(db, 'roles'), {
          name: formData.name,
          maxUsers: maxUsersInt,
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
          menus: PERMISSION_TREE.map(m => m.id),
          widgets: PERMISSION_TREE.flatMap(m => m.children.map(w => w.id))
        }
      });
      alert('Super Admin role created!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const isSuperAdminEditing = editingRoleId && roles.find(r => r.id === editingRoleId)?.name === 'Super Admin';

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
          <Shield size={28} className="text-accent" />
          Role Management
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!roles.find(r => r.name === 'Super Admin') && (
             <button className="btn btn-outline" onClick={seedSuperAdmin}>
               <Shield size={18} /> Initialize Super Admin
             </button>
          )}
          <button className="btn btn-primary" onClick={openAddModal}>+ Create Role</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>User Limit</th>
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
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                    {r.name === 'Super Admin' ? 'Unlimited' : (r.maxUsers ? r.maxUsers : 'Unlimited')}
                  </span>
                </td>
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
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="icon-btn" onClick={() => openEditModal(r)} title="Edit Role"><Edit2 size={18} /></button>
                    <button className="icon-btn" onClick={() => handleDuplicate(r)} title="Duplicate Role"><Copy size={18} /></button>
                    {r.name !== 'Super Admin' && (
                      <button className="icon-btn" onClick={() => handleDelete(r.id)} title="Delete Role"><Trash2 size={18} className="text-red" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && !loading && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No custom roles created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoleId ? "Edit Role" : "Create New Role"}>
        <form className="modal-form" onSubmit={handleSave} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="form-group">
            <label>Role Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Trainer, Front Desk" disabled={isSuperAdminEditing} />
          </div>
          <div className="form-group">
            <label>Max Allowed Users (Leave blank for unlimited)</label>
            <input type="number" min="1" value={formData.maxUsers} onChange={e => setFormData({...formData, maxUsers: e.target.value})} placeholder="e.g. 5" />
          </div>

          <div className="form-group" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            <label style={{ marginTop: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Menu & Sub-Menu Permissions</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PERMISSION_TREE.map(menu => {
                const hasChildren = menu.children && menu.children.length > 0;
                const isExpanded = expandedNodes.includes(menu.id);
                
                return (
                <div key={menu.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', gap: '0.5rem' }}>
                    {hasChildren ? (
                      <button 
                        type="button" 
                        onClick={() => toggleNode(menu.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    ) : (
                      <div style={{ width: '18px' }} /> /* Placeholder for alignment */
                    )}
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.menus.includes(menu.id)} 
                        onChange={(e) => handleTreeCheckbox(menu, e.target.checked)} 
                        style={{ transform: 'scale(1.2)' }}
                      />
                      {menu.label}
                    </label>
                  </div>
                  
                  {hasChildren && isExpanded && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.5rem 1rem 1rem 2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                      {menu.children.map(widget => (
                        <label key={widget.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.widgets.includes(widget.id)} 
                            onChange={(e) => handleTreeCheckbox(widget, e.target.checked)} 
                          />
                          {widget.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingRoleId ? "Update Role" : "Create Role"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
