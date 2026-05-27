import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Modal from '../../components/Modal';
import { Plus, Building2, User, Globe, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperDashboard() {
  const [gyms, setGyms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingGymId, setEditingGymId] = useState(null);
  const [formData, setFormData] = useState({ gymName: '', slug: '', adminEmail: '', customDomain: '', status: 'active' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gyms'), (snapshot) => {
      setGyms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleCreateOrEditGym = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      
      if (editingGymId) {
        // Edit mode
        await updateDoc(doc(db, 'gyms', editingGymId), {
          name: formData.gymName,
          customDomain: formData.customDomain.toLowerCase().trim() || null,
          status: formData.status || 'active'
        });
        alert("Gym updated successfully!");
      } else {
        // Create mode
        await setDoc(doc(db, 'gyms', slug), {
          name: formData.gymName,
          slug: slug,
          createdAt: new Date().toISOString(),
          status: formData.status || 'active',
          customDomain: formData.customDomain.toLowerCase().trim() || null
        });

        // 2. Create Auth User using Secondary App
        await createUserWithEmailAndPassword(secondaryAuth, formData.adminEmail, 'password');

        // 3. Create the first Admin Member for this gym
        const memberId = 'MEM' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'members', memberId), {
          gymId: slug,
          memberId: memberId,
          name: "Admin User",
          email: formData.adminEmail,
          role: "Admin",
          status: "active",
          joinedDate: new Date().toISOString(),
          needsPasswordReset: true
        });

        // 4. Create basic Theme settings
        await setDoc(doc(db, 'website_settings', `${slug}_theme`), {
          gymId: slug,
          type: 'theme',
          logoText: formData.gymName,
          primaryColor: '#007bff',
          bgColor: '#ffffff',
          surfaceColor: '#f8f9fa'
        });

        // 5. Create the Admin Role with all permissions
        const allMenus = ['dashboard', 'members', 'staff', 'billing', 'attendance', 'homepage', 'roles', 'settings'];
        const allWidgets = ['total_members', 'active_members', 'expired_members', 'expiring_members', 'currently_in_gym', 'growth', 'todays_collection', 'weekly_collection', 'monthly_collection', 'yearly_collection', 'due_amount', 'total_expenses', 'revenue_chart', 'upcoming_classes'];
        
        await setDoc(doc(db, 'roles', slug + '_admin'), {
          gymId: slug,
          name: 'Admin',
          maxUsers: 5,
          menus: allMenus,
          widgets: allWidgets
        });
        alert("Gym created successfully!");
      }

      setIsModalOpen(false);
      setEditingGymId(null);
      setFormData({ gymName: '', slug: '', adminEmail: '', customDomain: '', status: 'active' });
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const openEditModal = (gym) => {
    setEditingGymId(gym.id);
    setFormData({
      gymName: gym.name,
      slug: gym.slug,
      adminEmail: '', // Not editable here
      customDomain: gym.customDomain || '',
      status: gym.status || 'active'
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingGymId(null);
    setFormData({ gymName: '', slug: '', adminEmail: '', customDomain: '', status: 'active' });
    setIsModalOpen(true);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gym Management</h1>
          <p className="admin-page-subtitle">Manage all active tenants on the platform</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add New Gym
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {gyms.map(gym => (
          <div key={gym.id} className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="var(--accent)" /> {gym.name}
              </span>
              <button className="btn-icon" onClick={() => openEditModal(gym)} title="Edit Gym">
                <Edit size={16} />
              </button>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={16}/> /{gym.slug}</span>
              {gym.customDomain && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={16} color="var(--accent)" /> {gym.customDomain}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Status: {gym.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <Link to={`/superadmin/website/${gym.slug}/pages`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>Build Website</Link>
              <a href={`${window.location.origin}/${gym.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>View Site</a>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGymId(null); }} title={editingGymId ? "Edit Gym Details" : "Create New Gym Tenant"}>
        <form onSubmit={handleCreateOrEditGym} className="modal-form">
          <div className="form-group">
            <label>Gym Name</label>
            <input 
              type="text" 
              required 
              value={formData.gymName} 
              onChange={e => setFormData({...formData, gymName: e.target.value})}
              placeholder="e.g. ProBurn Fitness" 
            />
          </div>
          <div className="form-group">
            <label>URL Slug (Unique ID)</label>
            <input 
              type="text" 
              required 
              disabled={!!editingGymId}
              value={formData.slug} 
              onChange={e => setFormData({...formData, slug: e.target.value})}
              placeholder="e.g. proburn-fitness" 
            />
            <small style={{color: 'var(--text-muted)'}}>This will be used for the URL: /{formData.slug || 'slug'}</small>
          </div>
          {!editingGymId && (
            <div className="form-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                required 
                value={formData.adminEmail} 
                onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                placeholder="admin@gym.com" 
              />
            </div>
          )}
          <div className="form-group">
            <label>Custom Domain (Optional)</label>
            <input 
              type="text" 
              value={formData.customDomain} 
              onChange={e => setFormData({...formData, customDomain: e.target.value})}
              placeholder="e.g. www.ironfitness.com" 
            />
            <small style={{color: 'var(--text-muted)'}}>Requires DNS configuration to point to this platform.</small>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); setEditingGymId(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (editingGymId ? 'Save Changes' : 'Create Gym')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
