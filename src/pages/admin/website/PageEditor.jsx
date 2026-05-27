import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ArrowLeft, Layout, Grid, Type, ImageIcon, Maximize2, Video, ChevronDown, Minus, MousePointerClick, Columns, Save, GripHorizontal } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BLOCK_COMPONENTS } from '../../../components/website/WebsiteBlocks';

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

const SortablePreviewSection = ({ section, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const BlockComponent = BLOCK_COMPONENTS[section.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    cursor: 'pointer',
    border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
    boxShadow: isSelected ? '0 0 0 4px rgba(255, 68, 68, 0.1)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(section.id);
      }}
      className="preview-section-wrapper"
    >
      {isSelected && (
        <div 
          {...attributes} 
          {...listeners} 
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--accent)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            cursor: 'grab',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <GripHorizontal size={14} /> Drag to move
        </div>
      )}
      <div style={{ pointerEvents: isSelected ? 'auto' : 'none' }}>
        {BlockComponent ? <BlockComponent data={section.data} /> : <div>Unknown Block</div>}
      </div>
    </div>
  );
};

export default function PageEditor() {
  const { pageId, gymId: activeGymId } = useParams();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState('insert'); // 'insert' | 'properties'
  const [isSaving, setIsSaving] = useState(false);
  const [localSections, setLocalSections] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'website_pages', pageId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPage({ id: docSnap.id, ...data });
        setLocalSections(data.sections || []);
      } else {
        navigate(`/superadmin/website/${activeGymId}/pages`);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [pageId, navigate, activeGymId]);

  const saveToFirebase = async (newSections) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'website_pages', pageId), { sections: newSections });
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setIsSaving(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = localSections.findIndex(s => s.id === active.id);
      const newIndex = localSections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(localSections, oldIndex, newIndex);
      setLocalSections(newSections);
      saveToFirebase(newSections);
    }
  };

  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type: type,
      data: SECTION_TYPES[type].defaultData
    };
    const newSections = [...localSections, newSection];
    setLocalSections(newSections);
    setSelectedSectionId(newSection.id);
    setActiveTab('properties');
    saveToFirebase(newSections);
  };

  const removeSection = (id) => {
    if(confirm("Delete this block?")) {
      const newSections = localSections.filter(s => s.id !== id);
      setLocalSections(newSections);
      setSelectedSectionId(null);
      setActiveTab('insert');
      saveToFirebase(newSections);
    }
  };

  const updateSectionData = (id, newData) => {
    const newSections = localSections.map(sec => 
      sec.id === id ? { ...sec, data: newData } : sec
    );
    setLocalSections(newSections);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (loading) return <div style={{ padding: '2rem' }}>Loading editor...</div>;
  if (!page) return null;

  const selectedSection = localSections.find(s => s.id === selectedSectionId);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f0f13' }}>
      
      {/* Left Pane: Live Preview Workspace */}
      <div 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
        onClick={() => {
          setSelectedSectionId(null);
          setActiveTab('insert');
        }}
      >
        <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/superadmin/website/${activeGymId}/pages`)}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Pages
            </button>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Editing: {page.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isSaving && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saving...</span>}
            <button className="btn btn-primary" onClick={() => saveToFirebase(localSections)}>
              <Save size={16} style={{ marginRight: '0.5rem' }} /> Save Changes
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
          <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
            {localSections.length === 0 ? (
              <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Click a block from the Insert menu to get started
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {localSections.map((sec) => (
                    <SortablePreviewSection 
                      key={sec.id} 
                      section={sec} 
                      isSelected={selectedSectionId === sec.id}
                      onSelect={(id) => {
                        setSelectedSectionId(id);
                        setActiveTab('properties');
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Tools */}
      <div style={{ width: '350px', background: 'var(--surface)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            style={{ flex: 1, padding: '1rem', background: activeTab === 'insert' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'insert' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab('insert')}
          >
            Insert
          </button>
          <button 
            style={{ flex: 1, padding: '1rem', background: activeTab === 'properties' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'properties' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: selectedSection ? 'pointer' : 'not-allowed', opacity: selectedSection ? 1 : 0.5 }}
            onClick={() => selectedSection && setActiveTab('properties')}
          >
            Properties
          </button>
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {activeTab === 'insert' && (
            <div>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>Blocks</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                {Object.entries(SECTION_TYPES).map(([type, config]) => (
                  <button 
                    key={type}
                    onClick={() => addSection(type)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '1rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    {config.icon}
                    <span style={{ fontSize: '0.8rem' }}>{config.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'properties' && selectedSection && (
            <div key={selectedSection.id}> {/* Key forces re-render if selection changes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--accent)' }}>{SECTION_TYPES[selectedSection.type]?.name}</h3>
                <button 
                  onClick={() => removeSection(selectedSection.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}
                >
                  <Minus size={14} /> Remove
                </button>
              </div>
              <SectionSettingsForm 
                type={selectedSection.type}
                data={selectedSection.data}
                onChange={(newData) => updateSectionData(selectedSection.id, newData)}
              />
            </div>
          )}

          {activeTab === 'properties' && !selectedSection && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              Select a block on the canvas to edit its properties.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// --------------------------------------------------------------------------
// Form Renderer for Sidebar
// --------------------------------------------------------------------------
function SectionSettingsForm({ type, data, onChange }) {
  const handleChange = (field, value) => onChange({ ...data, [field]: value });
  
  const handleArrayChange = (index, field, value) => {
    const newArray = [...(data.items || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    handleChange('items', newArray);
  };
  
  const addArrayItem = () => {
    const newArray = [...(data.items || []), {}];
    handleChange('items', newArray);
  };
  
  const removeArrayItem = (index) => {
    const newArray = [...(data.items || [])];
    newArray.splice(index, 1);
    handleChange('items', newArray);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Universal Theme Settings */}
      <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Styling</h4>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.85rem' }}>Background Style</label>
          <select value={data.themeStyle || 'default'} onChange={e => handleChange('themeStyle', e.target.value)} className="form-input" style={{ padding: '0.6rem' }}>
            <option value="default">Default (Dark)</option>
            <option value="surface">Surface (Elevated)</option>
            <option value="accent">Accent Color</option>
            {type === 'hero' && <option value="image">Background Image</option>}
          </select>
        </div>
        {data.themeStyle === 'image' && (
          <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>Background Image URL</label>
            <input type="text" className="form-input" value={data.themeImage || ''} onChange={e => handleChange('themeImage', e.target.value)} placeholder="https://..." style={{ padding: '0.6rem' }} />
          </div>
        )}
      </div>

      {/* Title & Subtitle (Common) */}
      {(type !== 'divider' && type !== 'carousel' && type !== 'richText' && type !== 'button' && type !== 'multicolumn') && (
        <>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem' }}>Title</label>
            <input type="text" className="form-input" value={data.title || ''} onChange={e => handleChange('title', e.target.value)} style={{ padding: '0.6rem' }} />
          </div>
          {(type === 'hero' || type === 'pricing' || type === 'schedule' || type === 'contact') && (
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>Subtitle</label>
              <textarea className="form-input" value={data.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} style={{ padding: '0.6rem', minHeight: '60px' }} />
            </div>
          )}
        </>
      )}

      {/* Type Specific Fields */}
      {type === 'hero' && (
        <>
          <div className="form-group"><label>Button Text</label><input type="text" className="form-input" value={data.buttonText || ''} onChange={e => handleChange('buttonText', e.target.value)} /></div>
          <div className="form-group"><label>Button Link</label><input type="text" className="form-input" value={data.buttonLink || ''} onChange={e => handleChange('buttonLink', e.target.value)} /></div>
          {data.themeStyle !== 'image' && (
            <div className="form-group"><label>Side Image URL</label><input type="text" className="form-input" value={data.image || ''} onChange={e => handleChange('image', e.target.value)} /></div>
          )}
        </>
      )}

      {type === 'textImage' && (
        <>
          <div className="form-group"><label>Text Content</label><textarea className="form-input" value={data.text || ''} onChange={e => handleChange('text', e.target.value)} rows={5} /></div>
          <div className="form-group"><label>Image URL</label><input type="text" className="form-input" value={data.image || ''} onChange={e => handleChange('image', e.target.value)} /></div>
          <div className="form-group">
            <label>Image Position</label>
            <select value={data.imagePosition || 'right'} onChange={e => handleChange('imagePosition', e.target.value)} className="form-input">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}

      {type === 'richText' && (
        <div className="form-group"><label>HTML Content</label><textarea className="form-input" value={data.content || ''} onChange={e => handleChange('content', e.target.value)} rows={10} style={{ fontFamily: 'monospace' }} /></div>
      )}

      {/* Arrays: Features, Pricing, Schedule, Testimonials, FAQ, Multicolumn */}
      {(type === 'featuresGrid' || type === 'pricing' || type === 'schedule' || type === 'testimonials' || type === 'faq' || type === 'multicolumn') && (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Items</h4>
          {(data.items || []).map((item, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
              <button onClick={() => removeArrayItem(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Minus size={16}/></button>
              
              {type === 'featuresGrid' && (
                <>
                  <input type="text" className="form-input" placeholder="Title" value={item.title || ''} onChange={e => handleArrayChange(idx, 'title', e.target.value)} style={{ marginBottom: '0.5rem', padding: '0.5rem' }} />
                  <textarea className="form-input" placeholder="Description" value={item.description || ''} onChange={e => handleArrayChange(idx, 'description', e.target.value)} style={{ padding: '0.5rem' }} />
                </>
              )}
              {type === 'pricing' && (
                <>
                  <input type="text" className="form-input" placeholder="Plan Name" value={item.title || ''} onChange={e => handleArrayChange(idx, 'title', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="text" className="form-input" placeholder="Price" value={item.price || ''} onChange={e => handleArrayChange(idx, 'price', e.target.value)} />
                    <input type="text" className="form-input" placeholder="/mo or /yr" value={item.duration || ''} onChange={e => handleArrayChange(idx, 'duration', e.target.value)} />
                  </div>
                  <textarea className="form-input" placeholder="Features (comma separated)" value={item.features || ''} onChange={e => handleArrayChange(idx, 'features', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" className="form-input" placeholder="Button Link" value={item.buttonLink || ''} onChange={e => handleArrayChange(idx, 'buttonLink', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" className="form-input" placeholder="Button Text" value={item.buttonText || ''} onChange={e => handleArrayChange(idx, 'buttonText', e.target.value)} />
                </>
              )}
              {type === 'schedule' && (
                <>
                  <input type="text" className="form-input" placeholder="Time (e.g. 08:00 AM)" value={item.time || ''} onChange={e => handleArrayChange(idx, 'time', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" className="form-input" placeholder="Class Name" value={item.className || ''} onChange={e => handleArrayChange(idx, 'className', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" className="form-input" placeholder="Trainer Name" value={item.trainer || ''} onChange={e => handleArrayChange(idx, 'trainer', e.target.value)} />
                </>
              )}
              {type === 'testimonials' && (
                <>
                  <input type="text" className="form-input" placeholder="Name" value={item.name || ''} onChange={e => handleArrayChange(idx, 'name', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <textarea className="form-input" placeholder="Review" value={item.review || ''} onChange={e => handleArrayChange(idx, 'review', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="number" className="form-input" placeholder="Rating (1-5)" value={item.rating || '5'} onChange={e => handleArrayChange(idx, 'rating', e.target.value)} min="1" max="5" />
                </>
              )}
              {type === 'faq' && (
                <>
                  <input type="text" className="form-input" placeholder="Question" value={item.question || ''} onChange={e => handleArrayChange(idx, 'question', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <textarea className="form-input" placeholder="Answer" value={item.answer || ''} onChange={e => handleArrayChange(idx, 'answer', e.target.value)} />
                </>
              )}
              {type === 'multicolumn' && (
                <>
                  <input type="text" className="form-input" placeholder="Title" value={item.title || ''} onChange={e => handleArrayChange(idx, 'title', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <textarea className="form-input" placeholder="Text" value={item.text || ''} onChange={e => handleArrayChange(idx, 'text', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" className="form-input" placeholder="Image URL (optional)" value={item.image || ''} onChange={e => handleArrayChange(idx, 'image', e.target.value)} />
                </>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline" style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={addArrayItem}>
            <MousePointerClick size={16} /> Add Item
          </button>
        </div>
      )}

      {/* Carousel Specific */}
      {type === 'carousel' && (
        <div className="form-group">
          <label>Image URLs (one per line)</label>
          <textarea 
            className="form-input" 
            rows={5} 
            value={(data.images || []).join('\n')} 
            onChange={e => handleChange('images', e.target.value.split('\n'))} 
          />
        </div>
      )}

      {/* Contact Specific */}
      {type === 'contact' && (
        <>
          <div className="form-group"><label>Email</label><input type="text" className="form-input" value={data.email || ''} onChange={e => handleChange('email', e.target.value)} /></div>
          <div className="form-group"><label>Phone</label><input type="text" className="form-input" value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
          <div className="form-group"><label>Address</label><input type="text" className="form-input" value={data.address || ''} onChange={e => handleChange('address', e.target.value)} /></div>
          <div className="form-group"><label>Google Maps Embed URL</label><input type="text" className="form-input" value={data.mapUrl || ''} onChange={e => handleChange('mapUrl', e.target.value)} /></div>
        </>
      )}

      {/* Youtube Specific */}
      {type === 'youtube' && (
        <div className="form-group"><label>YouTube URL</label><input type="text" className="form-input" value={data.url || ''} onChange={e => handleChange('url', e.target.value)} /></div>
      )}

      {/* Divider Specific */}
      {type === 'divider' && (
        <>
          <div className="form-group">
            <label>Style</label>
            <select value={data.style || 'solid'} onChange={e => handleChange('style', e.target.value)} className="form-input">
              <option value="solid">Solid Line</option>
              <option value="dashed">Dashed Line</option>
              <option value="invisible">Invisible (Spacing only)</option>
            </select>
          </div>
          <div className="form-group"><label>Padding (e.g. 2rem)</label><input type="text" className="form-input" value={data.padding || '2rem'} onChange={e => handleChange('padding', e.target.value)} /></div>
        </>
      )}

      {/* Button Specific */}
      {type === 'button' && (
        <>
          <div className="form-group"><label>Button Text</label><input type="text" className="form-input" value={data.text || ''} onChange={e => handleChange('text', e.target.value)} /></div>
          <div className="form-group"><label>Link URL</label><input type="text" className="form-input" value={data.link || ''} onChange={e => handleChange('link', e.target.value)} /></div>
          <div className="form-group">
            <label>Style</label>
            <select value={data.style || 'primary'} onChange={e => handleChange('style', e.target.value)} className="form-input">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary (Outline)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Alignment</label>
            <select value={data.align || 'center'} onChange={e => handleChange('align', e.target.value)} className="form-input">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
