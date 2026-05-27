import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Link as LinkIcon, MoveUp, MoveDown, ArrowLeft } from 'lucide-react';
import { Dumbbell } from 'lucide-react';

const PreviewNavbar = ({ links, theme }) => {
  const parts = theme?.logoHighlight ? (theme.logoText || 'PROBURN').split(theme.logoHighlight) : [(theme?.logoText || 'PROBURN'), ''];

  return (
    <nav className="navbar" style={{ position: 'relative', background: theme?.surfaceColor || 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="navbar-container container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff' }}>
          {theme?.logoUrl ? (
            <img src={theme.logoUrl} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <Dumbbell color={theme?.primaryColor || "var(--accent)"} size={24} />
          )}
          <span>{parts[0]}<span style={{ color: theme?.primaryColor || "var(--accent)" }}>{theme?.logoHighlight}</span>{parts[1] || ''}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {links.map((link, i) => (
            <div key={i} style={{ color: theme?.bgColor === '#ffffff' ? '#333' : '#eee', fontSize: '0.9rem', fontWeight: 500 }}>
              {link.label}
              {link.subLinks && link.subLinks.length > 0 && (
                <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
              )}
            </div>
          ))}
          <div style={{ color: theme?.primaryColor || "var(--accent)", fontSize: '0.9rem', fontWeight: 600 }}>
            Portal Login
          </div>
          <button className="btn" style={{ background: theme?.primaryColor || "var(--accent)", color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px' }}>
            Join Now
          </button>
        </div>

      </div>
    </nav>
  );
};

export default function NavigationEditor() {
  const { gymId: activeGymId } = useParams();
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [theme, setTheme] = useState(null);
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
        setLinks([
          { label: 'Home', path: '/' },
          { label: 'Classes', path: '/classes' },
          { label: 'Plans', path: '/plans' }
        ]);
      }
      setLoading(false);
    };
    
    fetchNav();

    const unsubTheme = onSnapshot(doc(db, 'website_settings', `${activeGymId}_theme`), (snap) => {
      if (snap.exists()) {
        setTheme(snap.data());
      }
    });

    return () => unsubTheme();
  }, [activeGymId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!activeGymId) throw new Error("No active gym found");
      await setDoc(doc(db, 'website_settings', `${activeGymId}_navigation`), { links, gymId: activeGymId, type: 'navigation' });
    } catch (err) {
      alert("Error saving navigation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => setLinks([...links, { label: 'New Link', path: '/new-path', subLinks: [] }]);
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

  if (loading) return <div style={{ padding: '2rem' }}>Loading editor...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f0f13' }}>
      
      {/* Left Pane: Live Preview Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/superadmin/website/${activeGymId}/pages`)}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Pages
            </button>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Navigation Menu Editor</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {saving && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saving...</span>}
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} style={{ marginRight: '0.5rem' }} /> Save Navigation
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: theme?.bgColor || '#000' }}>
          <PreviewNavbar links={links} theme={theme} />
          
          <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
            <h1 style={{ fontSize: '3rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff' }}>Preview Area</h1>
            <p style={{ color: theme?.bgColor === '#ffffff' ? '#555' : '#ccc' }}>See your navigation update in real time above.</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Tools */}
      <div style={{ width: '400px', background: 'var(--surface)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <LinkIcon size={18} color="var(--accent)" /> Menu Links Properties
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {links.map((link, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => moveLink(idx, 'up')} disabled={idx === 0}><MoveUp size={12} /></button>
                    <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => moveLink(idx, 'down')} disabled={idx === links.length - 1}><MoveDown size={12} /></button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" className="form-input" placeholder="Label" value={link.label} onChange={(e) => updateLink(idx, 'label', e.target.value)} />
                    <input type="text" className="form-input" placeholder="URL Path" value={link.path} onChange={(e) => updateLink(idx, 'path', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => addSubLink(idx)} title="Add Sub-link"><Plus size={14} /></button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4444', borderColor: 'rgba(255,68,68,0.2)' }} onClick={() => removeLink(idx)}><Trash2 size={14} /></button>
                  </div>
                </div>

                {link.subLinks && link.subLinks.length > 0 && (
                  <div style={{ marginTop: '0.8rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {link.subLinks.map((sub, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input type="text" className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} placeholder="Label" value={sub.label} onChange={(e) => updateSubLink(idx, sIdx, 'label', e.target.value)} />
                          <input type="text" className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} placeholder="Path" value={sub.path} onChange={(e) => updateSubLink(idx, sIdx, 'path', e.target.value)} />
                        </div>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4444', border: 'none' }} onClick={() => removeSubLink(idx, sIdx)}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem' }} onClick={addLink}>
            <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add New Link
          </button>
        </div>
      </div>
    </div>
  );
}
