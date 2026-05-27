import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FileText, Plus, Edit, Trash2, Home, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../../../components/Modal';
import { useTenant } from '../../../context/TenantContext';

export default function PagesList() {
  const [pages, setPages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', slug: '', isHome: false });
  const navigate = useNavigate();
  const { activeGymId, activeGymData } = useTenant();

  useEffect(() => {
    if (!activeGymId) return;
    const unsub = onSnapshot(query(collection(db, 'website_pages'), where('gymId', '==', activeGymId)), (snap) => {
      setPages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // If marking as home, unset other home pages (optional logic here, skipping for simplicity)
      await addDoc(collection(db, 'website_pages'), {
        gymId: activeGymId,
        title: formData.title,
        slug: slug,
        isHome: formData.isHome,
        createdAt: serverTimestamp(),
        sections: [] // Empty sections array to start
      });
      setIsModalOpen(false);
      setFormData({ title: '', slug: '', isHome: false });
    } catch (err) {
      alert("Error adding page: " + err.message);
    }
  };

  const deletePage = async (id) => {
    if (confirm("Are you sure you want to delete this page?")) {
      await deleteDoc(doc(db, 'website_pages', id));
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading pages...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pages</h1>
          <p className="admin-page-subtitle">Manage the pages of your website</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Page
        </button>
      </div>

      <div className="card">
        {pages.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No pages created yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page Title</th>
                  <th>Slug / URL</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <FileText size={16} className="text-muted" />
                        {page.title}
                        {page.isHome && <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}><Home size={10} style={{marginRight:'2px'}}/> Home</span>}
                      </div>
                    </td>
                    <td>
                      <a href={`/${activeGymData?.slug || 'proburn'}${page.isHome ? '' : `/${page.slug}`}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                        /{page.isHome ? '' : page.slug} <ExternalLink size={12} />
                      </a>
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71' }}>Published</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => navigate(`/admin/website/pages/${page.id}`)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4444', borderColor: 'rgba(255, 68, 68, 0.2)' }} onClick={() => deletePage(page.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Page" sidePanel>
        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Page Title *</label>
            <input required type="text" placeholder="e.g., About Us" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Custom Slug (optional)</label>
            <input type="text" placeholder="e.g., about-us" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            <small style={{color:'var(--text-muted)'}}>Leave blank to auto-generate from title</small>
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isHome" checked={formData.isHome} onChange={e => setFormData({...formData, isHome: e.target.checked})} style={{ width: 'auto' }} />
            <label htmlFor="isHome" style={{ margin: 0, cursor: 'pointer' }}>Set as Homepage</label>
          </div>
          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Page</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
