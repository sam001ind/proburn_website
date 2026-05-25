import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ArrowLeft, Plus, MoveUp, MoveDown, Trash2, Settings, Type, Image as ImageIcon, Layout, Grid } from 'lucide-react';
import Modal from '../../../components/Modal';

// A mapping of generic section types to their default configurations
const SECTION_TYPES = {
  hero: { name: 'Hero Banner', icon: <Layout size={20} />, defaultData: { title: 'Welcome', subtitle: 'Subtitle goes here', buttonText: 'Click Here', buttonLink: '#', image: '' } },
  textImage: { name: 'Text & Image', icon: <ImageIcon size={20} />, defaultData: { title: 'Section Title', text: 'Some descriptive text.', image: '', imagePosition: 'right' } },
  featuresGrid: { name: 'Features Grid', icon: <Grid size={20} />, defaultData: { title: 'Our Features', items: [{ title: 'Feature 1', description: 'Desc 1', icon: '' }] } },
  richText: { name: 'Rich Text', icon: <Type size={20} />, defaultData: { content: '<h1>Heading</h1><p>Paragraph</p>' } }
};

export default function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'website_pages', pageId), (docSnap) => {
      if (docSnap.exists()) {
        setPage({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/admin/website/pages');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [pageId, navigate]);

  const updatePageSections = async (newSections) => {
    try {
      await updateDoc(doc(db, 'website_pages', pageId), { sections: newSections });
    } catch (err) {
      alert("Error updating sections: " + err.message);
    }
  };

  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type: type,
      data: SECTION_TYPES[type].defaultData
    };
    updatePageSections([...(page.sections || []), newSection]);
    setIsSectionModalOpen(false);
  };

  const removeSection = (index) => {
    if(confirm("Delete this section?")) {
      const newSections = [...(page.sections || [])];
      newSections.splice(index, 1);
      updatePageSections(newSections);
    }
  };

  const moveSection = (index, direction) => {
    const newSections = [...(page.sections || [])];
    if (direction === 'up' && index > 0) {
      const temp = newSections[index];
      newSections[index] = newSections[index - 1];
      newSections[index - 1] = temp;
    } else if (direction === 'down' && index < newSections.length - 1) {
      const temp = newSections[index];
      newSections[index] = newSections[index + 1];
      newSections[index + 1] = temp;
    }
    updatePageSections(newSections);
  };

  const saveSectionData = (index, newData) => {
    const newSections = [...(page.sections || [])];
    newSections[index].data = newData;
    updatePageSections(newSections);
    setEditingSectionIndex(null);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading editor...</div>;
  if (!page) return null;

  const sections = page.sections || [];

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => navigate('/admin/website/pages')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="admin-page-title">Editing: {page.title}</h1>
            <p className="admin-page-subtitle">Add and rearrange blocks for this page</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsSectionModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Block
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
        {sections.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>This page is empty. Add a block to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsSectionModalOpen(true)}>
              Add Block
            </button>
          </div>
        ) : (
          sections.map((sec, index) => (
            <div key={sec.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                  {SECTION_TYPES[sec.type]?.icon || <Layout size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{SECTION_TYPES[sec.type]?.name || sec.type}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {sec.data?.title || 'No Title'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                  <MoveUp size={14} />
                </button>
                <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}>
                  <MoveDown size={14} />
                </button>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }} onClick={() => setEditingSectionIndex(index)}>
                  <Settings size={14} /> Edit
                </button>
                <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4444', borderColor: 'rgba(255, 68, 68, 0.2)' }} onClick={() => removeSection(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Block Modal */}
      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Select Block Type">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Object.entries(SECTION_TYPES).map(([type, config]) => (
            <div 
              key={type} 
              className="card" 
              style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem', transition: 'all 0.2s', border: '1px solid transparent' }}
              onClick={() => addSection(type)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>{config.icon}</div>
              <strong>{config.name}</strong>
            </div>
          ))}
        </div>
      </Modal>

      {/* Edit Block Settings Modal */}
      {editingSectionIndex !== null && (
        <SectionSettingsModal 
          section={sections[editingSectionIndex]} 
          onClose={() => setEditingSectionIndex(null)}
          onSave={(data) => saveSectionData(editingSectionIndex, data)}
        />
      )}
    </div>
  );
}

// A dynamic form based on the block type
function SectionSettingsModal({ section, onClose, onSave }) {
  const [formData, setFormData] = useState(section.data);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData.items];
    newArray[index] = { ...newArray[index], [field]: value };
    handleChange('items', newArray);
  };

  const addArrayItem = () => {
    const newArray = [...(formData.items || []), { title: '', description: '', icon: '' }];
    handleChange('items', newArray);
  };

  const removeArrayItem = (index) => {
    const newArray = [...formData.items];
    newArray.splice(index, 1);
    handleChange('items', newArray);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit ${SECTION_TYPES[section.type]?.name}`} sidePanel>
      <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
        
        {/* Render fields dynamically based on section type */}
        {section.type === 'hero' && (
          <>
            <div className="form-group"><label>Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div className="form-group"><label>Subtitle</label><input type="text" value={formData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} /></div>
            <div className="form-group"><label>Button Text</label><input type="text" value={formData.buttonText} onChange={e => handleChange('buttonText', e.target.value)} /></div>
            <div className="form-group"><label>Button Link</label><input type="text" value={formData.buttonLink} onChange={e => handleChange('buttonLink', e.target.value)} /></div>
            <div className="form-group"><label>Background Image URL</label><input type="text" value={formData.image} onChange={e => handleChange('image', e.target.value)} /></div>
          </>
        )}

        {section.type === 'textImage' && (
          <>
            <div className="form-group"><label>Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div className="form-group"><label>Text</label><textarea rows="4" value={formData.text} onChange={e => handleChange('text', e.target.value)} /></div>
            <div className="form-group"><label>Image URL</label><input type="text" value={formData.image} onChange={e => handleChange('image', e.target.value)} /></div>
            <div className="form-group"><label>Image Position</label>
              <select value={formData.imagePosition} onChange={e => handleChange('imagePosition', e.target.value)} className="form-input">
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {section.type === 'featuresGrid' && (
          <>
            <div className="form-group"><label>Section Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Grid Items</label>
              {(formData.items || []).map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                  </div>
                  <div className="form-group"><label>Item Title</label><input type="text" value={item.title} onChange={e => handleArrayChange(idx, 'title', e.target.value)} /></div>
                  <div className="form-group"><label>Description</label><input type="text" value={item.description} onChange={e => handleArrayChange(idx, 'description', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={addArrayItem} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Item</button>
            </div>
          </>
        )}

        {section.type === 'richText' && (
          <div className="form-group"><label>HTML Content</label><textarea rows="10" value={formData.content} onChange={e => handleChange('content', e.target.value)} /></div>
        )}

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
