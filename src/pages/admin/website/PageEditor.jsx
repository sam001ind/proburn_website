import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ArrowLeft, Plus, MoveUp, MoveDown, Trash2, Settings, Type, Image as ImageIcon, Layout, Grid, Video, Columns, Maximize2, Minus, MousePointerClick, ChevronDown, GripVertical } from 'lucide-react';
import Modal from '../../../components/Modal';
import WebsiteNav from './WebsiteNav';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// A mapping of generic section types to their default configurations
const SECTION_TYPES = {
  hero: { name: 'Hero Banner', icon: <Layout size={20} />, defaultData: { title: 'Welcome', subtitle: 'Subtitle goes here', buttonText: 'Click Here', buttonLink: '#', image: '' } },
  textImage: { name: 'Text & Image', icon: <ImageIcon size={20} />, defaultData: { title: 'Section Title', text: 'Some descriptive text.', image: '', imagePosition: 'right' } },
  featuresGrid: { name: 'Features Grid', icon: <Grid size={20} />, defaultData: { title: 'Our Features', items: [{ title: 'Feature 1', description: 'Desc 1', icon: '' }] } },
  richText: { name: 'Rich Text', icon: <Type size={20} />, defaultData: { content: '<h1>Heading</h1><p>Paragraph</p>' } },
  pricing: { name: 'Pricing Plans', icon: <Grid size={20} />, defaultData: { title: 'Membership Plans', subtitle: 'Choose your plan', items: [{ title: 'Basic', price: '29', duration: 'mo', features: 'Access to gym, 1 PT session', buttonText: 'Join', buttonLink: '#' }] } },
  schedule: { name: 'Classes Schedule', icon: <Grid size={20} />, defaultData: { title: 'Weekly Classes', subtitle: 'Join our sessions', items: [{ time: '08:00 AM', className: 'Yoga', trainer: 'Alice' }] } },
  contact: { name: 'Contact Info', icon: <Type size={20} />, defaultData: { title: 'Contact Us', subtitle: 'Get in touch', email: 'hello@gym.com', phone: '123-456-7890', address: '123 Fitness St.', mapUrl: '' } },
  testimonials: { name: 'Testimonials', icon: <Grid size={20} />, defaultData: { title: 'What members say', items: [{ name: 'John Doe', review: 'Great gym!', rating: '5' }] } },
  carousel: { name: 'Image Carousel', icon: <Maximize2 size={20} />, defaultData: { images: [''] } },
  youtube: { name: 'YouTube Video', icon: <Video size={20} />, defaultData: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
  faq: { name: 'Collapsible Group', icon: <ChevronDown size={20} />, defaultData: { title: 'FAQ', items: [{ question: 'Question 1', answer: 'Answer 1' }] } },
  divider: { name: 'Divider', icon: <Minus size={20} />, defaultData: { style: 'solid', padding: '2rem' } },
  button: { name: 'Button', icon: <MousePointerClick size={20} />, defaultData: { text: 'Click Me', link: '#', style: 'primary', align: 'center' } },
  multicolumn: { name: 'Multi-Column Layout', icon: <Columns size={20} />, defaultData: { items: [{ title: 'Column 1', text: 'Text', image: '' }, { title: 'Column 2', text: 'Text', image: '' }] } }
};

const SortableSection = ({ sec, index, onEdit, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button {...attributes} {...listeners} type="button" className="btn btn-outline" style={{ padding: '0.5rem', cursor: 'grab', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
          <GripVertical size={20} />
        </button>
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
        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }} onClick={() => onEdit(index)}>
          <Settings size={14} /> Edit
        </button>
        <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4444', borderColor: 'rgba(255, 68, 68, 0.2)' }} onClick={() => onRemove(index)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default function PageEditor() {
  const { pageId, gymId: activeGymId } = useParams();
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = page.sections.findIndex(s => s.id === active.id);
      const newIndex = page.sections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(page.sections, oldIndex, newIndex);
      updatePageSections(newSections);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      <WebsiteNav gymId={activeGymId} />
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => navigate(`/superadmin/website/${activeGymId}/pages`)}>
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

      <div style={{ maxWidth: '800px' }}>
        {sections.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>This page is empty. Add a block to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsSectionModalOpen(true)}>
              Add Block
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((sec, index) => (
                <SortableSection key={sec.id} sec={sec} index={index} onEdit={setEditingSectionIndex} onRemove={removeSection} />
              ))}
            </SortableContext>
          </DndContext>
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
        
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent)' }}>Section Style</h4>
          <div className="form-group">
            <label>Background Style</label>
            <select value={formData.themeStyle || 'default'} onChange={e => handleChange('themeStyle', e.target.value)} className="form-input">
              <option value="default">Default Background</option>
              <option value="surface">Surface Color</option>
              <option value="accent">Accent Color</option>
              <option value="image">Custom Image Background</option>
            </select>
          </div>
          {formData.themeStyle === 'image' && (
            <div className="form-group">
              <label>Background Image URL</label>
              <input type="text" value={formData.themeImage || ''} onChange={e => handleChange('themeImage', e.target.value)} />
            </div>
          )}
        </div>

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

        {section.type === 'pricing' && (
          <>
            <div className="form-group"><label>Section Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div className="form-group"><label>Subtitle</label><input type="text" value={formData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} /></div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pricing Plans</label>
              {(formData.items || []).map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}><button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></div>
                  <div className="form-group"><label>Plan Name</label><input type="text" value={item.title} onChange={e => handleArrayChange(idx, 'title', e.target.value)} /></div>
                  <div className="form-group"><label>Price</label><input type="text" value={item.price} onChange={e => handleArrayChange(idx, 'price', e.target.value)} /></div>
                  <div className="form-group"><label>Duration (e.g. /mo)</label><input type="text" value={item.duration} onChange={e => handleArrayChange(idx, 'duration', e.target.value)} /></div>
                  <div className="form-group"><label>Features (comma separated)</label><input type="text" value={item.features} onChange={e => handleArrayChange(idx, 'features', e.target.value)} /></div>
                  <div className="form-group"><label>Button Text</label><input type="text" value={item.buttonText} onChange={e => handleArrayChange(idx, 'buttonText', e.target.value)} /></div>
                  <div className="form-group"><label>Button Link</label><input type="text" value={item.buttonLink} onChange={e => handleArrayChange(idx, 'buttonLink', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={() => { const newArr = [...(formData.items||[]), {title:'', price:'', duration:'', features:'', buttonText:'', buttonLink:''}]; handleChange('items', newArr); }} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Plan</button>
            </div>
          </>
        )}

        {section.type === 'schedule' && (
          <>
            <div className="form-group"><label>Section Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div className="form-group"><label>Subtitle</label><input type="text" value={formData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} /></div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Classes</label>
              {(formData.items || []).map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}><button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></div>
                  <div className="form-group"><label>Time</label><input type="text" value={item.time} onChange={e => handleArrayChange(idx, 'time', e.target.value)} /></div>
                  <div className="form-group"><label>Class Name</label><input type="text" value={item.className} onChange={e => handleArrayChange(idx, 'className', e.target.value)} /></div>
                  <div className="form-group"><label>Trainer</label><input type="text" value={item.trainer} onChange={e => handleArrayChange(idx, 'trainer', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={() => { const newArr = [...(formData.items||[]), {time:'', className:'', trainer:''}]; handleChange('items', newArr); }} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Class</button>
            </div>
          </>
        )}

        {section.type === 'contact' && (
          <>
            <div className="form-group"><label>Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div className="form-group"><label>Subtitle</label><input type="text" value={formData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input type="text" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
            <div className="form-group"><label>Address</label><input type="text" value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div>
            <div className="form-group"><label>Map Embed URL (optional)</label><input type="text" value={formData.mapUrl} onChange={e => handleChange('mapUrl', e.target.value)} /></div>
          </>
        )}

        {section.type === 'testimonials' && (
          <>
            <div className="form-group"><label>Section Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Reviews</label>
              {(formData.items || []).map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}><button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></div>
                  <div className="form-group"><label>Reviewer Name</label><input type="text" value={item.name} onChange={e => handleArrayChange(idx, 'name', e.target.value)} /></div>
                  <div className="form-group"><label>Review Text</label><textarea rows="3" value={item.review} onChange={e => handleArrayChange(idx, 'review', e.target.value)} /></div>
                  <div className="form-group"><label>Rating (1-5)</label><input type="number" min="1" max="5" value={item.rating} onChange={e => handleArrayChange(idx, 'rating', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={() => { const newArr = [...(formData.items||[]), {name:'', review:'', rating:'5'}]; handleChange('items', newArr); }} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Review</button>
            </div>
          </>
        )}

        {section.type === 'carousel' && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Images</label>
            {(formData.images || []).map((img, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={img} onChange={e => {
                  const newImages = [...formData.images];
                  newImages[idx] = e.target.value;
                  handleChange('images', newImages);
                }} placeholder="Image URL" style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" onClick={() => {
                  const newImages = [...formData.images];
                  newImages.splice(idx, 1);
                  handleChange('images', newImages);
                }} style={{ padding: '0.4rem', color: '#ff4444' }}><Trash2 size={14}/></button>
              </div>
            ))}
            <button type="button" className="btn btn-outline" onClick={() => handleChange('images', [...(formData.images||[]), ''])} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Image</button>
          </div>
        )}

        {section.type === 'youtube' && (
          <div className="form-group">
            <label>YouTube Video URL</label>
            <input type="text" value={formData.url} onChange={e => handleChange('url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
        )}

        {section.type === 'faq' && (
          <>
            <div className="form-group"><label>Section Title</label><input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} /></div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Questions & Answers</label>
              {(formData.items || []).map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}><button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></div>
                  <div className="form-group"><label>Question</label><input type="text" value={item.question} onChange={e => handleArrayChange(idx, 'question', e.target.value)} /></div>
                  <div className="form-group"><label>Answer</label><textarea rows="3" value={item.answer} onChange={e => handleArrayChange(idx, 'answer', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={() => { const newArr = [...(formData.items||[]), {question:'', answer:''}]; handleChange('items', newArr); }} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Q&A</button>
            </div>
          </>
        )}

        {section.type === 'divider' && (
          <>
            <div className="form-group">
              <label>Style</label>
              <select value={formData.style} onChange={e => handleChange('style', e.target.value)} className="form-input">
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="invisible">Invisible Spacer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Vertical Padding (e.g. 2rem, 50px)</label>
              <input type="text" value={formData.padding} onChange={e => handleChange('padding', e.target.value)} />
            </div>
          </>
        )}

        {section.type === 'button' && (
          <>
            <div className="form-group"><label>Button Text</label><input type="text" value={formData.text} onChange={e => handleChange('text', e.target.value)} /></div>
            <div className="form-group"><label>Link URL</label><input type="text" value={formData.link} onChange={e => handleChange('link', e.target.value)} /></div>
            <div className="form-group">
              <label>Style</label>
              <select value={formData.style} onChange={e => handleChange('style', e.target.value)} className="form-input">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary / Outline</option>
              </select>
            </div>
            <div className="form-group">
              <label>Alignment</label>
              <select value={formData.align} onChange={e => handleChange('align', e.target.value)} className="form-input">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {section.type === 'multicolumn' && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Columns (Max 4)</label>
            {(formData.items || []).map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}><button type="button" onClick={() => removeArrayItem(idx)} style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button></div>
                <div className="form-group"><label>Image URL (Optional)</label><input type="text" value={item.image} onChange={e => handleArrayChange(idx, 'image', e.target.value)} /></div>
                <div className="form-group"><label>Title</label><input type="text" value={item.title} onChange={e => handleArrayChange(idx, 'title', e.target.value)} /></div>
                <div className="form-group"><label>Text</label><textarea rows="3" value={item.text} onChange={e => handleArrayChange(idx, 'text', e.target.value)} /></div>
              </div>
            ))}
            {(formData.items || []).length < 4 && (
              <button type="button" className="btn btn-outline" onClick={() => { const newArr = [...(formData.items||[]), {title:'', text:'', image:''}]; handleChange('items', newArr); }} style={{ width: '100%' }}><Plus size={14} style={{marginRight:'0.3rem'}}/> Add Column</button>
            )}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
