import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Layers, Eye, EyeOff, Plus, Trash2, Edit2, GripVertical, ChevronUp, ChevronDown, Save, X, ImageIcon, Type, Layout, AlignLeft, Grid } from 'lucide-react';
import ToggleSwitch from '../../../components/ToggleSwitch';
import ImageUpload from '../../../components/ImageUpload';
import { Link } from 'react-router-dom';

/* ── Built-in section config ── */
const BUILTIN_SECTIONS = [
  { id: 'hero',     label: '🏠 Hero Banner',      firestorePath: ['homepage', 'hero'],     editPath: '/admin/homepage/hero' },
  { id: 'features', label: '⚡ Features',           firestorePath: ['homepage', 'features'], editPath: '/admin/homepage/features' },
  { id: 'classes',  label: '📅 Classes / Programs', firestorePath: ['homepage', 'classes'],  editPath: '/admin/homepage/classes' },
  { id: 'plans',    label: '💳 Pricing Plans',      firestorePath: ['homepage', 'plans'],    editPath: '/admin/homepage/plans' },
  { id: 'contact',  label: '📍 Contact & Footer',   firestorePath: ['homepage', 'contact'],  editPath: '/admin/homepage/contact' },
];

/* ── Section type definitions ── */
const SECTION_TYPES = [
  { value: 'text',      label: 'Text Block',      icon: <AlignLeft size={18} />,  desc: 'Title + paragraph of text' },
  { value: 'cards',     label: 'Cards Grid',       icon: <Grid size={18} />,       desc: 'Grid of cards with icon/image, title & text' },
  { value: 'image_text',label: 'Image + Text',     icon: <ImageIcon size={18} />,  desc: 'Side-by-side image and text block' },
  { value: 'banner',    label: 'Banner / CTA',     icon: <Layout size={18} />,     desc: 'Full-width banner with a call-to-action button' },
  { value: 'faq',       label: 'FAQ Accordion',    icon: <Type size={18} />,       desc: 'Collapsible FAQ questions and answers' },
];

const DEFAULT_SECTION = {
  type: 'text',
  name: '',
  visible: true,
  title: '',
  titleHighlight: '',
  subtitle: '',
  body: '',
  imageURL: '',
  imagePosition: 'left',
  ctaLabel: '',
  ctaLink: '#',
  items: [],
};

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
export default function SectionsManager() {
  const [builtinVisibility, setBuiltinVisibility] = useState({});
  const [customSections, setCustomSections]       = useState([]);
  const [showBuilder, setShowBuilder]             = useState(false);
  const [editingSection, setEditingSection]       = useState(null);
  const [saving, setSaving]                       = useState(false);

  /* Load built-in section visibility */
  useEffect(() => {
    const unsubs = BUILTIN_SECTIONS.map(s =>
      onSnapshot(doc(db, ...s.firestorePath), snap => {
        const visible = snap.exists() ? (snap.data().visible !== false) : true;
        setBuiltinVisibility(prev => ({ ...prev, [s.id]: visible }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);

  /* Load custom sections */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'homepage_sections'), snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setCustomSections(data);
    });
    return () => unsub();
  }, []);

  /* Toggle built-in visibility */
  const toggleBuiltin = async (section, val) => {
    setBuiltinVisibility(prev => ({ ...prev, [section.id]: val }));
    await setDoc(doc(db, ...section.firestorePath), { visible: val }, { merge: true });
  };

  /* Toggle custom visibility */
  const toggleCustom = async (section, val) => {
    await updateDoc(doc(db, 'homepage_sections', section.id), { visible: val });
  };

  /* Move custom section order */
  const moveSection = async (idx, dir) => {
    const arr = [...customSections];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    arr.forEach((s, i) => updateDoc(doc(db, 'homepage_sections', s.id), { order: i }));
  };

  /* Delete custom section */
  const deleteSection = async (id) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'homepage_sections', id));
  };

  /* Open builder for new/edit */
  const openBuilder = (section = null) => {
    setEditingSection(section ? { ...DEFAULT_SECTION, ...section } : { ...DEFAULT_SECTION });
    setShowBuilder(true);
  };

  /* Save section */
  const saveSection = async (form) => {
    setSaving(true);
    if (form.id) {
      await updateDoc(doc(db, 'homepage_sections', form.id), form);
    } else {
      await addDoc(collection(db, 'homepage_sections'), { ...form, order: customSections.length });
    }
    setSaving(false);
    setShowBuilder(false);
  };

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Layers size={26} className="text-accent" /> Section Manager
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Show/hide sections on your public homepage. Create new sections from scratch.
            </p>
          </div>
          <button onClick={() => openBuilder()} className="btn btn-primary" style={{ flexShrink: 0, marginTop: '0.4rem' }}>
            <Plus size={16} style={{ marginRight: '0.4rem' }} /> New Section
          </button>
        </div>
      </div>

      {/* ── Built-in Sections ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1rem' }}>Built-in Sections</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {BUILTIN_SECTIONS.map(section => (
            <div key={section.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.9rem 1.1rem', borderRadius: '12px',
              background: builtinVisibility[section.id] !== false
                ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${builtinVisibility[section.id] !== false ? 'var(--glass-border)' : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.2s',
              opacity: builtinVisibility[section.id] !== false ? 1 : 0.55,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <GripVertical size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{section.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ToggleSwitch
                  size="sm"
                  checked={builtinVisibility[section.id] !== false}
                  onChange={val => toggleBuiltin(section, val)}
                />
                <Link to={section.editPath} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                  <Edit2 size={14} /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Custom Sections ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1rem' }}>Custom Sections</p>
        {customSections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Layers size={40} style={{ opacity: 0.2, marginBottom: '0.8rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No custom sections yet.</p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem' }}>Click <strong>"New Section"</strong> to create one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {customSections.map((section, idx) => (
              <div key={section.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.9rem 1.1rem', borderRadius: '12px',
                background: section.visible !== false ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${section.visible !== false ? 'var(--glass-border)' : 'rgba(255,255,255,0.05)'}`,
                opacity: section.visible !== false ? 1 : 0.55,
                transition: 'all 0.2s',
              }}>
                {/* Reorder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                    style={arrowBtnStyle(idx === 0)}>▲</button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === customSections.length - 1}
                    style={arrowBtnStyle(idx === customSections.length - 1)}>▼</button>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{section.name || 'Unnamed Section'}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {SECTION_TYPES.find(t => t.value === section.type)?.label} · {section.title || 'No title'}
                  </p>
                </div>

                <ToggleSwitch
                  size="sm"
                  checked={section.visible !== false}
                  onChange={val => toggleCustom(section, val)}
                />
                <button onClick={() => openBuilder(section)}
                  style={{ ...iconBtn, color: 'var(--text-secondary)' }}><Edit2 size={15} /></button>
                <button onClick={() => deleteSection(section.id)}
                  style={{ ...iconBtn, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section Builder Slide-in ── */}
      {showBuilder && (
        <SectionBuilder
          initial={editingSection}
          saving={saving}
          onSave={saveSection}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════
   SECTION BUILDER PANEL
════════════════════════════════ */
function SectionBuilder({ initial, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...DEFAULT_SECTION, ...initial });
  const [step, setStep] = useState(initial?.id ? 1 : 0); // 0=type picker, 1=content

  const selectedType = SECTION_TYPES.find(t => t.value === form.type);

  const f = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} style={inputStyle} value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const ta = (label, key, placeholder = '') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(520px, 100vw)',
        background: '#0f1a2e', borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '8px 0 40px rgba(0,0,0,0.6)', zIndex: 901,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInLeft 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            {form.id ? 'Edit Section' : 'New Section'}
            {step === 1 && form.name && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>— {form.name}</span>}
          </h2>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--accent) transparent' }}>

          {/* Step 0: Type picker */}
          {step === 0 && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 0, fontSize: '0.88rem' }}>Choose the layout for this section:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                {SECTION_TYPES.map(t => (
                  <div key={t.value} onClick={() => setForm({ ...form, type: t.value })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.9rem 1.1rem',
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                      background: form.type === t.value ? 'rgba(255,69,0,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${form.type === t.value ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    <span style={{ color: form.type === t.value ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</p>
                      <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)' }}>{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                {f('Section Internal Name (admin only)', 'name', 'text', 'e.g. Testimonials')}
              </div>
            </div>
          )}

          {/* Step 1: Content */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Section Visibility</span>
                <ToggleSwitch checked={form.visible !== false} onChange={v => setForm({ ...form, visible: v })} />
              </div>

              {f('Section Title', 'title', 'text', 'e.g. Why Choose Us')}
              {f('Highlighted Word (optional)', 'titleHighlight', 'text', 'e.g. Choose')}
              {ta('Subtitle / Description', 'subtitle', 'A short line shown below the title')}

              {/* Type-specific fields */}
              {form.type === 'text' && (
                ta('Body Content', 'body', 'Full paragraph text...')
              )}

              {form.type === 'image_text' && (
                <>
                  <ImageUpload
                    value={form.imageURL} onChange={url => setForm({ ...form, imageURL: url })}
                    label="Section Image" width={600} height={450}
                  />
                  <div>
                    <label style={labelStyle}>Image Position</label>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      {['left', 'right'].map(pos => (
                        <button key={pos} onClick={() => setForm({ ...form, imagePosition: pos })}
                          style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `2px solid ${form.imagePosition === pos ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`, background: form.imagePosition === pos ? 'rgba(255,69,0,0.1)' : 'transparent', color: 'white', cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                          Image {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                  {ta('Text Content', 'body', 'Description text beside the image...')}
                </>
              )}

              {form.type === 'banner' && (
                <>
                  <ImageUpload value={form.imageURL} onChange={url => setForm({ ...form, imageURL: url })}
                    label="Banner Background Image (optional)" width={1200} height={400} />
                  {f('CTA Button Label', 'ctaLabel', 'text', 'e.g. Get Started')}
                  {f('CTA Button Link', 'ctaLink', 'url', '/#pricing or https://...')}
                </>
              )}

              {form.type === 'cards' && (
                <CardsEditor form={form} setForm={setForm} />
              )}

              {form.type === 'faq' && (
                <FAQEditor form={form} setForm={setForm} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.4rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {step === 0 && !form.id && (
            <>
              <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => setStep(1)} className="btn btn-primary" style={{ flex: 2 }}
                disabled={!form.name.trim() || !form.type}>
                Continue →
              </button>
            </>
          )}
          {(step === 1 || form.id) && (
            <>
              {!form.id && <button onClick={() => setStep(0)} className="btn btn-outline">← Back</button>}
              <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => onSave(form)} className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                <Save size={15} style={{ marginRight: '0.4rem' }} />
                {saving ? 'Saving…' : (form.id ? 'Update Section' : 'Create Section')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* Cards sub-editor */
function CardsEditor({ form, setForm }) {
  const items = form.items || [];
  const update = (idx, field, val) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    setForm({ ...form, items: next });
  };
  const add = () => setForm({ ...form, items: [...items, { icon: '⭐', title: '', text: '' }] });
  const remove = (idx) => setForm({ ...form, items: items.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
        <label style={labelStyle}>Cards</label>
        <button onClick={add} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          <Plus size={13} style={{ marginRight: '0.3rem' }} />Add Card
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ padding: '0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', marginBottom: '0.6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input value={item.icon || ''} onChange={e => update(idx, 'icon', e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.3rem' }} placeholder="🔥" />
            <input value={item.title || ''} onChange={e => update(idx, 'title', e.target.value)}
              style={inputStyle} placeholder="Card Title" />
            <button onClick={() => remove(idx)} style={{ ...iconBtn, color: '#ef4444' }}><Trash2 size={14} /></button>
          </div>
          <textarea value={item.text || ''} onChange={e => update(idx, 'text', e.target.value)}
            style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }} placeholder="Card description…" />
        </div>
      ))}
    </div>
  );
}

/* FAQ sub-editor */
function FAQEditor({ form, setForm }) {
  const items = form.items || [];
  const update = (idx, field, val) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    setForm({ ...form, items: next });
  };
  const add = () => setForm({ ...form, items: [...items, { q: '', a: '' }] });
  const remove = (idx) => setForm({ ...form, items: items.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
        <label style={labelStyle}>FAQ Items</label>
        <button onClick={add} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
          <Plus size={13} style={{ marginRight: '0.3rem' }} />Add FAQ
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ padding: '0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Q{idx + 1}</span>
            <button onClick={() => remove(idx)} style={{ ...iconBtn, color: '#ef4444' }}><Trash2 size={13} /></button>
          </div>
          <input value={item.q || ''} onChange={e => update(idx, 'q', e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.5rem' }} placeholder="Question?" />
          <textarea value={item.a || ''} onChange={e => update(idx, 'a', e.target.value)}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Answer…" />
        </div>
      ))}
    </div>
  );
}

/* Styles */
const labelStyle = { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' };
const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box' };
const iconBtn = { padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const arrowBtnStyle = (disabled) => ({ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: disabled ? 'default' : 'pointer', width: '22px', height: '18px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: disabled ? 0.3 : 1 });
