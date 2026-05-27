import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, updateDoc, addDoc, serverTimestamp, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ArrowLeft, Layout, Grid, Type, ImageIcon, Maximize2, Video, ChevronDown, Minus, MousePointerClick, Columns, Save, GripHorizontal, FileText, Plus, Trash2, Home, Link as LinkIcon, MoveUp, MoveDown, Palette, Dumbbell } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BLOCK_COMPONENTS } from '../../../components/website/WebsiteBlocks';

const SECTION_TYPES = {
  hero: { name: 'Hero Banner', icon: <Layout size={18} />, defaultData: { title: 'Welcome', subtitle: 'Subtitle goes here', buttonText: 'Click Here', buttonLink: '#', image: '' } },
  textImage: { name: 'Text & Image', icon: <ImageIcon size={18} />, defaultData: { title: 'Section Title', text: 'Some descriptive text.', image: '', imagePosition: 'right' } },
  featuresGrid: { name: 'Features Grid', icon: <Grid size={18} />, defaultData: { title: 'Our Features', items: [{ title: 'Feature 1', description: 'Desc 1', icon: '' }] } },
  richText: { name: 'Rich Text', icon: <Type size={18} />, defaultData: { content: '<h1>Heading</h1><p>Paragraph</p>' } },
  pricing: { name: 'Pricing Plans', icon: <Grid size={18} />, defaultData: { title: 'Membership Plans', subtitle: 'Choose your plan', items: [{ title: 'Basic', price: '29', duration: 'mo', features: 'Access to gym, 1 PT session', buttonText: 'Join', buttonLink: '#' }] } },
  schedule: { name: 'Classes Schedule', icon: <Grid size={18} />, defaultData: { title: 'Weekly Classes', subtitle: 'Join our sessions', items: [{ time: '08:00 AM', className: 'Yoga', trainer: 'Alice' }] } },
  contact: { name: 'Contact Info', icon: <Type size={18} />, defaultData: { title: 'Contact Us', subtitle: 'Get in touch', email: 'hello@gym.com', phone: '123-456-7890', address: '123 Fitness St.', mapUrl: '' } },
  testimonials: { name: 'Testimonials', icon: <Grid size={18} />, defaultData: { title: 'What members say', items: [{ name: 'John Doe', review: 'Great gym!', rating: '5' }] } },
  carousel: { name: 'Image Carousel', icon: <Maximize2 size={18} />, defaultData: { images: [''] } },
  youtube: { name: 'YouTube Video', icon: <Video size={18} />, defaultData: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
  faq: { name: 'Collapsible Group', icon: <ChevronDown size={18} />, defaultData: { title: 'FAQ', items: [{ question: 'Question 1', answer: 'Answer 1' }] } },
  divider: { name: 'Divider', icon: <Minus size={18} />, defaultData: { style: 'solid', padding: '2rem' } },
  button: { name: 'Button', icon: <MousePointerClick size={18} />, defaultData: { text: 'Click Me', link: '#', style: 'primary', align: 'center' } },
  multicolumn: { name: 'Multi-Column', icon: <Columns size={18} />, defaultData: { items: [{ title: 'Column 1', text: 'Text', image: '' }, { title: 'Column 2', text: 'Text', image: '' }] } }
};

const PREDEFINED_PALETTES = [
  { name: 'Dark & Aggressive', primaryColor: '#ff4444', bgColor: '#111111', surfaceColor: '#1a1a1a' },
  { name: 'Neon Cyberpunk',    primaryColor: '#00f3ff', bgColor: '#0b0914', surfaceColor: '#121021' },
  { name: 'Clean Corporate',   primaryColor: '#0a58ca', bgColor: '#ffffff', surfaceColor: '#f8f9fa' },
  { name: 'Forest Fitness',    primaryColor: '#2ecc71', bgColor: '#0a1f11', surfaceColor: '#152a1b' },
  { name: 'Luxury Gold',       primaryColor: '#ffd700', bgColor: '#000000', surfaceColor: '#111111' },
  { name: 'Minimalist Mono',   primaryColor: '#333333', bgColor: '#ffffff', surfaceColor: '#f4f4f4' }
];

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
    <div ref={setNodeRef} style={style} onClick={(e) => { e.stopPropagation(); onSelect(section.id); }} className="preview-section-wrapper">
      {isSelected && (
        <div {...attributes} {...listeners} style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '20px', cursor: 'grab', zIndex: 20, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
          <GripHorizontal size={14} /> Drag to move
        </div>
      )}
      <div style={{ pointerEvents: isSelected ? 'auto' : 'none' }}>
        {BlockComponent ? <BlockComponent data={section.data} /> : <div>Unknown Block</div>}
      </div>
    </div>
  );
};

const PreviewNavbar = ({ links, theme }) => {
  const parts = theme?.logoHighlight ? (theme.logoText || 'PROBURN').split(theme.logoHighlight) : [(theme?.logoText || 'PROBURN'), ''];
  return (
    <nav className="navbar" style={{ position: 'relative', background: theme?.surfaceColor || 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="navbar-container container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff' }}>
          {theme?.logoUrl ? <img src={theme.logoUrl} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} /> : <Dumbbell color={theme?.primaryColor || "var(--accent)"} size={24} />}
          <span>{parts[0]}<span style={{ color: theme?.primaryColor || "var(--accent)" }}>{theme?.logoHighlight}</span>{parts[1] || ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {links.map((link, i) => (
            <div key={i} style={{ color: theme?.bgColor === '#ffffff' ? '#333' : '#eee', fontSize: '0.9rem', fontWeight: 500 }}>
              {link.label} {link.subLinks && link.subLinks.length > 0 && <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', opacity: 0.7 }}>▼</span>}
            </div>
          ))}
          <div style={{ color: theme?.primaryColor || "var(--accent)", fontSize: '0.9rem', fontWeight: 600 }}>Portal Login</div>
          <button className="btn" style={{ background: theme?.primaryColor || "var(--accent)", color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px' }}>Join Now</button>
        </div>
      </div>
    </nav>
  );
};

export default function SiteBuilder() {
  const { gymId: activeGymId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('insert'); // 'insert', 'properties', 'pages', 'themes'
  const [activePageId, setActivePageId] = useState(null);
  const [pages, setPages] = useState([]);
  const [theme, setTheme] = useState({ logoText: 'PROBURN', primaryColor: '#ff4444', bgColor: '#111111', surfaceColor: '#1a1a1a' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  // Load Data
  useEffect(() => {
    if (!activeGymId) return;
    
    const unsubPages = onSnapshot(query(collection(db, 'website_pages'), where('gymId', '==', activeGymId)), (snap) => {
      const fetchedPages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPages(fetchedPages);
      if (fetchedPages.length > 0 && !activePageId) {
        const homePage = fetchedPages.find(p => p.isHome) || fetchedPages[0];
        setActivePageId(homePage.id);
      }
      setLoading(false);
    });

    const unsubTheme = onSnapshot(doc(db, 'website_settings', `${activeGymId}_theme`), (snap) => {
      if (snap.exists()) setTheme(snap.data());
    });

    return () => { unsubPages(); unsubTheme(); };
  }, [activeGymId, activePageId]);

  // Derive Navigation Links directly from Pages (Google Sites style)
  const navLinks = pages.map(p => ({
    label: p.title,
    path: p.isHome ? '/' : `/${p.slug}`
  }));

  // Derived active page
  const activePage = pages.find(p => p.id === activePageId);
  const localSections = activePage?.sections || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Page Editing Logic
  const savePageSections = async (newSections) => {
    if(!activePageId) return;
    setIsSaving(true);
    await updateDoc(doc(db, 'website_pages', activePageId), { sections: newSections });
    setIsSaving(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = localSections.findIndex(s => s.id === active.id);
      const newIndex = localSections.findIndex(s => s.id === over.id);
      savePageSections(arrayMove(localSections, oldIndex, newIndex));
    }
  };

  const addSection = (type) => {
    const newSection = { id: Date.now().toString(), type, data: SECTION_TYPES[type].defaultData };
    savePageSections([...localSections, newSection]);
    setSelectedSectionId(newSection.id);
    setActiveTab('properties');
  };

  const removeSection = (id) => {
    if(confirm("Delete this block?")) {
      savePageSections(localSections.filter(s => s.id !== id));
      setSelectedSectionId(null);
      setActiveTab('insert');
    }
  };

  const updateSectionData = (id, newData) => {
    savePageSections(localSections.map(sec => sec.id === id ? { ...sec, data: newData } : sec));
  };

  // Pages & Nav Logic
  const addPage = async () => {
    const title = prompt("Enter new page title:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await addDoc(collection(db, 'website_pages'), { gymId: activeGymId, title, slug, isHome: pages.length === 0, createdAt: serverTimestamp(), sections: [] });
  };
  
  const deletePage = async (id) => {
    if(confirm("Delete this page?")) {
      await deleteDoc(doc(db, 'website_pages', id));
      if (activePageId === id) {
        const homePage = pages.find(p => p.isHome) || pages[0];
        if (homePage) setActivePageId(homePage.id);
      }
    }
  };

  // Theme Logic
  const saveTheme = async (newTheme) => {
    await setDoc(doc(db, 'website_settings', `${activeGymId}_theme`), { ...newTheme, gymId: activeGymId, type: 'theme' });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Builder...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f0f13' }}>
      
      {/* ── Left Pane: Live Preview Workspace ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate('/superadmin/dashboard')}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Exit Builder
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Site Builder</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>• {activePage?.title || 'No Page Selected'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isSaving && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saving...</span>}
            <button className="btn btn-outline" onClick={() => window.open(`/${activeGymId}`, '_blank')}>
              View Live Site
            </button>
          </div>
        </div>

        <div 
          style={{ flex: 1, overflowY: 'auto', background: theme?.bgColor || '#000' }}
          onClick={() => { setSelectedSectionId(null); if(activeTab === 'properties') setActiveTab('insert'); }}
        >
          {/* Inject Dynamic CSS variables for WebsiteBlocks to use */}
          <style>{`
            .preview-canvas-area {
              --accent: ${theme?.primaryColor || '#ff4444'};
              --bg: ${theme?.bgColor || '#111111'};
              --surface: ${theme?.surfaceColor || '#1a1a1a'};
              background-color: var(--bg);
              color: ${theme?.bgColor === '#ffffff' ? '#000' : '#fff'};
              min-height: 100%;
            }
          `}</style>
          <div className="preview-canvas-area">
            <PreviewNavbar links={navLinks} theme={theme} />
            
            {activePage ? (
              localSections.length === 0 ? (
                <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  This page is empty. Drag blocks from the Insert tab to build it!
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={localSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {localSections.map((sec) => (
                      <SortablePreviewSection key={sec.id} section={sec} isSelected={selectedSectionId === sec.id} onSelect={(id) => { setSelectedSectionId(id); setActiveTab('properties'); }} />
                    ))}
                  </SortableContext>
                </DndContext>
              )
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center' }}>Create a page in the Pages tab to start editing.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Sidebar: Tools ── */}
      <div style={{ width: '360px', background: 'var(--surface)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Main Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['insert', 'pages', 'themes'].map(t => (
            <button key={t} style={{ flex: 1, padding: '1rem 0.5rem', background: (activeTab === t || (t === 'insert' && activeTab === 'properties')) ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: (activeTab === t || (t === 'insert' && activeTab === 'properties')) ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Sidebar Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          
          {/* INSERT & PROPERTIES TAB */}
          {(activeTab === 'insert' || activeTab === 'properties') && (
            <>
              {activeTab === 'properties' && selectedSectionId ? (
                <div>
                  <button className="btn btn-outline" style={{ marginBottom: '1rem', width: '100%', padding: '0.6rem' }} onClick={() => setActiveTab('insert')}>← Back to Blocks</button>
                  {(() => {
                    const sec = localSections.find(s => s.id === selectedSectionId);
                    if(!sec) return null;
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          Edit {SECTION_TYPES[sec.type]?.name}
                          <button className="btn-icon" style={{ color: '#ff4444' }} onClick={() => removeSection(sec.id)}><Trash2 size={16}/></button>
                        </h3>
                        {/* Generic Properties Form based on data keys */}
                        {Object.entries(sec.data).map(([key, value]) => {
                          if (typeof value === 'string') {
                            return (
                              <div className="form-group" key={key} style={{ marginBottom: '1rem' }}>
                                <label style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{key}</label>
                                {key.includes('text') || key.includes('content') || key.includes('review') ? (
                                  <textarea className="form-input" rows="3" value={value} onChange={e => updateSectionData(sec.id, { ...sec.data, [key]: e.target.value })} />
                                ) : (
                                  <input type="text" className="form-input" value={value} onChange={e => updateSectionData(sec.id, { ...sec.data, [key]: e.target.value })} />
                                )}
                              </div>
                            );
                          }
                          // Handle arrays (items) simplistically for now (could be expanded)
                          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                            return (
                              <div key={key}>
                                <label style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{key}</label>
                                {value.map((item, i) => (
                                  <div key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '0.5rem', marginBottom: '1rem' }}>
                                    {Object.keys(item).map(itemKey => (
                                      <input key={itemKey} type="text" className="form-input" placeholder={itemKey} value={item[itemKey]} style={{ marginBottom: '0.3rem', fontSize: '0.8rem', padding: '0.4rem' }} onChange={(e) => {
                                        const newArray = [...value];
                                        newArray[i] = { ...newArray[i], [itemKey]: e.target.value };
                                        updateSectionData(sec.id, { ...sec.data, [key]: newArray });
                                      }} />
                                    ))}
                                    <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => {
                                      const newArray = value.filter((_, idx) => idx !== i);
                                      updateSectionData(sec.id, { ...sec.data, [key]: newArray });
                                    }}>Remove Item</button>
                                  </div>
                                ))}
                                <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem', width: '100%' }} onClick={() => {
                                  const emptyItem = Object.keys(value[0]).reduce((acc, k) => ({...acc, [k]: ''}), {});
                                  updateSectionData(sec.id, { ...sec.data, [key]: [...value, emptyItem] });
                                }}>+ Add Item</button>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>Blocks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    {Object.entries(SECTION_TYPES).map(([type, config]) => (
                      <button key={type} onClick={() => addSection(type)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ color: 'var(--accent)' }}>{config.icon}</div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{config.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* PAGES TAB */}
          {activeTab === 'pages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Site Pages</h3>
                <button className="btn-icon" onClick={addPage}><Plus size={18} color="var(--accent)"/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {pages.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activePageId === p.id ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.02)', border: activePageId === p.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActivePageId(p.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.isHome ? <Home size={14} color="var(--accent)"/> : <FileText size={14} color="var(--text-muted)"/>}
                      <span style={{ fontWeight: 500 }}>{p.title}</span>
                    </div>
                    {!p.isHome && <button className="btn-icon" onClick={(e) => { e.stopPropagation(); deletePage(p.id); }}><Trash2 size={14} color="var(--text-muted)"/></button>}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <p><strong>Note:</strong> Your navigation menu is automatically generated from these pages.</p>
              </div>
            </div>
          )}

          {/* THEMES TAB */}
          {activeTab === 'themes' && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Branding</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Logo Text</label>
                <input type="text" className="form-input" value={theme.logoText || ''} onChange={e => setTheme({...theme, logoText: e.target.value})} onBlur={() => saveTheme(theme)} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Logo Highlight</label>
                <input type="text" className="form-input" value={theme.logoHighlight || ''} onChange={e => setTheme({...theme, logoHighlight: e.target.value})} onBlur={() => saveTheme(theme)} />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Logo URL</label>
                <input type="text" className="form-input" value={theme.logoUrl || ''} onChange={e => setTheme({...theme, logoUrl: e.target.value})} onBlur={() => saveTheme(theme)} />
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Colors</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Primary Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                  <input type="color" value={theme.primaryColor || '#ff4444'} onChange={e => setTheme({...theme, primaryColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ border: 'none', background: 'transparent' }} />
                  <input type="text" value={theme.primaryColor || '#ff4444'} onChange={e => setTheme({...theme, primaryColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                  <input type="color" value={theme.bgColor || '#111111'} onChange={e => setTheme({...theme, bgColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ border: 'none', background: 'transparent' }} />
                  <input type="text" value={theme.bgColor || '#111111'} onChange={e => setTheme({...theme, bgColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.8rem' }}>Surface Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                  <input type="color" value={theme.surfaceColor || '#1a1a1a'} onChange={e => setTheme({...theme, surfaceColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ border: 'none', background: 'transparent' }} />
                  <input type="text" value={theme.surfaceColor || '#1a1a1a'} onChange={e => setTheme({...theme, surfaceColor: e.target.value})} onBlur={() => saveTheme(theme)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff' }} />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Palettes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {PREDEFINED_PALETTES.map(p => (
                  <button key={p.name} onClick={() => { const t = {...theme, primaryColor: p.primaryColor, bgColor: p.bgColor, surfaceColor: p.surfaceColor}; setTheme(t); saveTheme(t); }} style={{ background: p.bgColor, border: `1px solid ${p.surfaceColor}`, color: p.bgColor === '#ffffff' ? '#000' : '#fff', padding: '0.6rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                    {p.name} <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.primaryColor }} />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
