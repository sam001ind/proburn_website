import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams } from 'react-router-dom';
import { Save, Plus, Trash2, Link as LinkIcon, MoveUp, MoveDown } from 'lucide-react';
import WebsiteNav from './WebsiteNav';

export default function NavigationEditor() {
  const { gymId: activeGymId } = useParams();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNav = async () => {
      if (!activeGymId) return;
      const docRef = doc(db, 'website_settings', `${activeGymId}_navigation`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().links) {
        setLinks(docSnap.data().links);
      } else {
        // Default links
        setLinks([
          { label: 'Home', path: '/' },
          { label: 'Classes', path: '/classes' },
          { label: 'Plans', path: '/plans' }
        ]);
      }
      setLoading(false);
    };
    fetchNav();
  }, [activeGymId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!activeGymId) throw new Error("No active gym found");
      await setDoc(doc(db, 'website_settings', `${activeGymId}_navigation`), { links, gymId: activeGymId, type: 'navigation' });
      alert('Navigation saved successfully!');
    } catch (err) {
      alert("Error saving navigation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { label: 'New Link', path: '/new-path', subLinks: [] }]);
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const addSubLink = (parentIndex) => {
    const newLinks = [...links];
    if (!newLinks[parentIndex].subLinks) newLinks[parentIndex].subLinks = [];
    newLinks[parentIndex].subLinks.push({ label: 'New Sub-link', path: '/new-sub-path' });
    setLinks(newLinks);
  };

  const updateSubLink = (parentIndex, subIndex, field, value) => {
    const newLinks = [...links];
    newLinks[parentIndex].subLinks[subIndex][field] = value;
    setLinks(newLinks);
  };

  const removeSubLink = (parentIndex, subIndex) => {
    const newLinks = [...links];
    newLinks[parentIndex].subLinks.splice(subIndex, 1);
    setLinks(newLinks);
  };

  const removeLink = (index) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const moveLink = (index, direction) => {
    const newLinks = [...links];
    if (direction === 'up' && index > 0) {
      const temp = newLinks[index];
      newLinks[index] = newLinks[index - 1];
      newLinks[index - 1] = temp;
    } else if (direction === 'down' && index < newLinks.length - 1) {
      const temp = newLinks[index];
      newLinks[index] = newLinks[index + 1];
      newLinks[index + 1] = temp;
    }
    setLinks(newLinks);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading navigation settings...</div>;

  return (
    <div className="admin-page-container">
      <WebsiteNav gymId={activeGymId} />
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Navigation Menu</h1>
          <p className="admin-page-subtitle">Build the main menu for your gym's website</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} style={{ marginRight: '0.4rem' }} /> {saving ? 'Saving...' : 'Save Navigation'}
        </button>
      </div>

      <div className="card" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
          <LinkIcon size={20} color="var(--accent)" /> Menu Links
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {links.map((link, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.3rem' }} onClick={() => moveLink(idx, 'up')} disabled={idx === 0}><MoveUp size={14} /></button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem' }} onClick={() => moveLink(idx, 'down')} disabled={idx === links.length - 1}><MoveDown size={14} /></button>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Label</label>
                  <input type="text" className="form-input" value={link.label} onChange={(e) => updateLink(idx, 'label', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>URL Path</label>
                  <input type="text" className="form-input" value={link.path} onChange={(e) => updateLink(idx, 'path', e.target.value)} />
                </div>
                <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.6rem' }} onClick={() => addSubLink(idx)} title="Add Sub-link">
                    <Plus size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.6rem', color: '#ff4444', borderColor: 'rgba(255,68,68,0.2)' }} onClick={() => removeLink(idx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Sub-links */}
              {link.subLinks && link.subLinks.length > 0 && (
                <div style={{ marginTop: '1rem', marginLeft: '3rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {link.subLinks.map((sub, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input type="text" className="form-input" placeholder="Sub-link Label" value={sub.label} onChange={(e) => updateSubLink(idx, sIdx, 'label', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="text" className="form-input" placeholder="Sub-link URL" value={sub.path} onChange={(e) => updateSubLink(idx, sIdx, 'path', e.target.value)} />
                      </div>
                      <button className="btn btn-outline" style={{ padding: '0.6rem', color: '#ff4444', border: 'none' }} onClick={() => removeSubLink(idx, sIdx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-outline" style={{ marginTop: '2rem', width: '100%', padding: '1rem' }} onClick={addLink}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Link
        </button>
      </div>
    </div>
  );
}
