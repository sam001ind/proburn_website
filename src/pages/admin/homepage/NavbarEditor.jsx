import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useBranch } from '../../../context/BranchContext';
import { Navigation, Save, Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

const DEFAULT_LINKS = [
  { label: 'Home',    href: '/#home',    type: 'anchor' },
  { label: 'About',   href: '/#about',   type: 'anchor' },
  { label: 'Classes', href: '/#classes', type: 'anchor' },
  { label: 'Pricing', href: '/#pricing', type: 'anchor' },
];

const DEFAULT_BRANDING = {
  gymName: 'PROBURN',
  gymNameHighlight: 'BURN',
  logoURL: '',
  showIcon: true,           // show dumbbell fallback icon
  ctaLabel: 'Join Now',
  memberLoginLabel: 'Member Login',
  staffLoginLabel: 'Staff Login',
  navLinks: DEFAULT_LINKS,
};

export default function NavbarEditor() {
  const { branches, activeBranch, setActiveBranch } = useBranch();
  const [form, setForm] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // If no branches exist yet, auto-create a default one
  useEffect(() => {
    if (branches !== undefined && branches.length === 0) {
      addDoc(collection(db, 'branches'), { ...DEFAULT_BRANDING, branchName: 'Main Branch' })
        .then(ref => setActiveBranch({ id: ref.id, branchName: 'Main Branch', ...DEFAULT_BRANDING }));
    }
  }, [branches]);

  // Sync form when active branch changes
  useEffect(() => {
    if (!activeBranch?.id) return;
    const unsub = onSnapshot(doc(db, 'branches', activeBranch.id), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          ...DEFAULT_BRANDING,
          ...d,
          navLinks: d.navLinks || DEFAULT_LINKS,
        });
      }
    });
    return () => unsub();
  }, [activeBranch?.id]);

  const save = async () => {
    if (!activeBranch?.id) return;
    setLoading(true);
    await setDoc(doc(db, 'branches', activeBranch.id), { ...form }, { merge: true });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateLink = (idx, field, val) => {
    const navLinks = [...form.navLinks];
    navLinks[idx] = { ...navLinks[idx], [field]: val };
    setForm({ ...form, navLinks });
  };

  const addLink = () => setForm({
    ...form,
    navLinks: [...form.navLinks, { label: 'New Link', href: '/#section', type: 'anchor' }]
  });

  const removeLink = (idx) => setForm({
    ...form,
    navLinks: form.navLinks.filter((_, i) => i !== idx)
  });

  const moveLink = (idx, dir) => {
    const navLinks = [...form.navLinks];
    const to = idx + dir;
    if (to < 0 || to >= navLinks.length) return;
    [navLinks[idx], navLinks[to]] = [navLinks[to], navLinks[idx]];
    setForm({ ...form, navLinks });
  };

  /* Live preview strip */
  const previewParts = form.gymNameHighlight
    ? form.gymName.split(form.gymNameHighlight)
    : [form.gymName, ''];

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Navigation size={26} className="text-accent" /> Navbar Editor
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Edit the top navigation bar — logo, gym name, nav links and CTA buttons.
        </p>
      </div>

      {/* ── Live Preview ── */}
      <div style={{
        background: 'rgba(0,0,0,0.55)', borderRadius: '14px', marginTop: '1.5rem',
        padding: '0.9rem 1.4rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', border: '1px solid var(--glass-border)',
        flexWrap: 'wrap', gap: '0.8rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {form.logoURL
            ? <img src={form.logoURL} alt="logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
            : form.showIcon && <span style={{ fontSize: '1.6rem' }}>🏋️</span>
          }
          <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px' }}>
            {previewParts[0]}
            <span style={{ color: 'var(--accent)' }}>{form.gymNameHighlight}</span>
            {previewParts[1] || ''}
          </span>
        </div>
        {/* Links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {form.navLinks.map((l, i) => (
            <span key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{l.label}</span>
          ))}
          <span style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>{form.memberLoginLabel}</span>
          <span style={{ background: 'var(--accent)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>{form.ctaLabel}</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Eye size={12} /> Live preview
        </div>
      </div>

      {/* ── Logo & Brand ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem' }}>🎨 Logo &amp; Brand Name</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <ImageUpload
            value={form.logoURL}
            onChange={(url) => setForm({ ...form, logoURL: url })}
            storagePath={activeBranch ? `branches/${activeBranch.id}/logo` : 'navbar/logo'}
            label="Gym Logo"
            hint="Replaces the dumbbell icon in the navbar"
            width={200}
            height={200}
            maxMB={2}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={labelStyle}>Gym Name</label>
              <input style={inputStyle} value={form.gymName}
                onChange={e => setForm({ ...form, gymName: e.target.value })}
                placeholder="e.g. PROBURN" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Full name shown next to the logo
              </p>
            </div>
            <div>
              <label style={labelStyle}>Accent / Highlighted Word</label>
              <input style={inputStyle} value={form.gymNameHighlight}
                onChange={e => setForm({ ...form, gymNameHighlight: e.target.value })}
                placeholder="e.g. BURN" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                This part turns orange — must appear inside the gym name above
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <input type="checkbox" id="showIcon" checked={form.showIcon !== false}
                onChange={e => setForm({ ...form, showIcon: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <label htmlFor="showIcon" style={{ fontSize: '0.88rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Show dumbbell 🏋️ icon when no logo is uploaded
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🔗 Navigation Links</h3>
          <button onClick={addLink} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Plus size={14} style={{ marginRight: '0.3rem' }} />Add Link
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {form.navLinks.map((link, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto',
              gap: '0.6rem', alignItems: 'center',
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
            }}>
              {/* Reorder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button onClick={() => moveLink(idx, -1)} disabled={idx === 0}
                  style={{ ...arrowBtn, opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                <button onClick={() => moveLink(idx, 1)} disabled={idx === form.navLinks.length - 1}
                  style={{ ...arrowBtn, opacity: idx === form.navLinks.length - 1 ? 0.3 : 1 }}>▼</button>
              </div>
              <div>
                <label style={microLabel}>Link Label</label>
                <input style={inputStyle} value={link.label}
                  onChange={e => updateLink(idx, 'label', e.target.value)} placeholder="Home" />
              </div>
              <div>
                <label style={microLabel}>URL / Anchor</label>
                <input style={inputStyle} value={link.href}
                  onChange={e => updateLink(idx, 'href', e.target.value)} placeholder="/#section or /page" />
              </div>
              <button onClick={() => removeLink(idx)}
                style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', alignSelf: 'center', marginTop: '1.1rem' }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {form.navLinks.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No links yet. Click "Add Link" above.</p>
          )}
        </div>
      </div>

      {/* ── CTA Buttons ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem' }}>🟠 Buttons</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Join Now Button</label>
            <input style={inputStyle} value={form.ctaLabel}
              onChange={e => setForm({ ...form, ctaLabel: e.target.value })}
              placeholder="Join Now" />
          </div>
          <div>
            <label style={labelStyle}>Member Login Label</label>
            <input style={inputStyle} value={form.memberLoginLabel}
              onChange={e => setForm({ ...form, memberLoginLabel: e.target.value })}
              placeholder="Member Login" />
          </div>
          <div>
            <label style={labelStyle}>Staff Login Label</label>
            <input style={inputStyle} value={form.staffLoginLabel}
              onChange={e => setForm({ ...form, staffLoginLabel: e.target.value })}
              placeholder="Staff Login" />
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1.5rem 0' }}>
        <button onClick={save} className="btn btn-primary" disabled={loading || !activeBranch}>
          <Save size={16} style={{ marginRight: '0.5rem' }} />
          {loading ? 'Saving...' : 'Save Navbar'}
        </button>
        {saved && <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>✅ Saved! Refresh your homepage to see changes.</span>}
        {!activeBranch && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ Create a branch first in Branding & Logo</span>}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem',
};
const microLabel = {
  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.3rem',
};
const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px',
  border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
  color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box',
};
const arrowBtn = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
  color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer',
  width: '22px', height: '18px', fontSize: '0.65rem', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0,
};
