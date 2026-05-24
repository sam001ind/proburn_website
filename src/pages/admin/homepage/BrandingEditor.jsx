import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useBranch } from '../../../context/BranchContext';
import { Building2, Save, Plus, Trash2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

export default function BrandingEditor() {
  const { branches, activeBranch, setActiveBranch } = useBranch();

  const [form, setForm] = useState({
    gymName: 'PROBURN',
    gymNameHighlight: 'BURN',
    branchName: 'Main Branch',
    tagline: 'Forging champions since 2024.',
    logoURL: '',
    faviconURL: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    instagramUrl: '#',
    facebookUrl: '#',
    twitterUrl: '#',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [addingBranch, setAddingBranch] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);

  // Sync form with active branch data
  useEffect(() => {
    if (!activeBranch) return;
    setForm(f => ({ ...f, ...activeBranch }));
  }, [activeBranch?.id]);

  const save = async () => {
    if (!activeBranch?.id) return;
    setLoading(true);
    await setDoc(doc(db, 'branches', activeBranch.id), { ...form }, { merge: true });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    setAddingBranch(true);
    const ref = await addDoc(collection(db, 'branches'), {
      gymName: 'PROBURN',
      gymNameHighlight: 'BURN',
      branchName: newBranchName.trim(),
      tagline: '',
      logoURL: '',
      city: '',
      address: '',
      phone: '',
      email: '',
    });
    setActiveBranch({ id: ref.id, branchName: newBranchName.trim() });
    setNewBranchName('');
    setShowNewBranch(false);
    setAddingBranch(false);
  };

  const deleteBranch = async (branch) => {
    if (branches.length <= 1) return alert('You must have at least one branch.');
    if (!window.confirm(`Delete branch "${branch.branchName}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'branches', branch.id));
    const remaining = branches.filter(b => b.id !== branch.id);
    if (remaining.length > 0) setActiveBranch(remaining[0]);
  };

  const f = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} style={inputStyle} value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Building2 size={26} className="text-accent" />Branding &amp; Branch Management
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your gym's logo, name, and branches. Each branch has its own branding that appears on the public website.
        </p>
      </div>

      {/* ── Branch Switcher ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🏢 Branches</h3>
          <button onClick={() => setShowNewBranch(v => !v)} className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}>
            <Plus size={15} style={{ marginRight: '0.3rem' }} />Add Branch
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {branches.map(branch => (
            <div key={branch.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.9rem', borderRadius: '50px',
              background: activeBranch?.id === branch.id ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeBranch?.id === branch.id ? 'var(--accent)' : 'var(--glass-border)'}`,
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.2s',
            }} onClick={() => setActiveBranch(branch)}>
              {branch.logoURL && <img src={branch.logoURL} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />}
              <span>{branch.branchName || branch.gymName}</span>
              {branch.city && <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>· {branch.city}</span>}
              {branches.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); deleteBranch(branch); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: '0', display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {showNewBranch && (
          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1rem', alignItems: 'center' }}>
            <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)}
              placeholder="Branch name (e.g. Kozhikode Branch)" style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && createBranch()} />
            <button onClick={createBranch} className="btn btn-primary" disabled={addingBranch} style={{ whiteSpace: 'nowrap' }}>
              {addingBranch ? 'Creating...' : 'Create Branch'}
            </button>
            <button onClick={() => setShowNewBranch(false)} className="btn btn-outline">Cancel</button>
          </div>
        )}
      </div>

      {activeBranch && (
        <>
          {/* ── Logo Upload ── */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1rem' }}>🎨 Logo &amp; Favicon</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <ImageUpload
                value={form.logoURL}
                onChange={(url) => setForm({ ...form, logoURL: url })}
                storagePath={`branches/${activeBranch.id}/logo`}
                label="Gym Logo"
                hint="Square logo — appears in navbar & footer"
                width={200}
                height={200}
                maxMB={2}
              />
              <ImageUpload
                value={form.faviconURL}
                onChange={(url) => setForm({ ...form, faviconURL: url })}
                storagePath={`branches/${activeBranch.id}/favicon`}
                label="Favicon / App Icon"
                hint="Browser tab icon"
                width={64}
                height={64}
                maxMB={1}
              />
            </div>
          </div>

          {/* ── Gym Name ── */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1rem' }}>✏️ Gym Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {f('Gym Name (Full)', 'gymName', 'text', 'e.g. PROBURN')}
              {f('Highlighted Part', 'gymNameHighlight', 'text', 'e.g. BURN')}
              {f('Branch Name', 'branchName', 'text', 'e.g. Kozhikode Branch')}
              {f('City', 'city', 'text', 'e.g. Kozhikode')}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Tagline</label>
                <textarea style={{ ...inputStyle, minHeight: '65px', resize: 'vertical' }}
                  value={form.tagline || ''} placeholder="Forging champions since 2024."
                  onChange={e => setForm({ ...form, tagline: e.target.value })} />
              </div>
            </div>

            {/* Live preview */}
            <LiveDisplay form={form} />
          </div>

          {/* ── Contact ── */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1rem' }}>📞 Contact Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>{f('Address', 'address', 'text', '123 Muscle Ave, Fit City')}</div>
              {f('Phone', 'phone', 'tel', '+91 98765 43210')}
              {f('Email', 'email', 'email', 'info@proburnfitness.com')}
              {f('Website', 'website', 'url', 'https://proburn.in')}
            </div>
          </div>

          {/* ── Social ── */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1rem' }}>🔗 Social Links</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {f('Instagram', 'instagramUrl', 'url', 'https://instagram.com/...')}
              {f('Facebook', 'facebookUrl', 'url', 'https://facebook.com/...')}
              {f('Twitter / X', 'twitterUrl', 'url', 'https://x.com/...')}
            </div>
          </div>

          {/* ── Save ── */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1.5rem 0' }}>
            <button onClick={save} className="btn btn-primary" disabled={loading}>
              <Save size={16} style={{ marginRight: '0.5rem' }} />
              {loading ? 'Saving...' : `Save "${activeBranch.branchName || activeBranch.gymName}" Branch`}
            </button>
            {saved && <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>✅ Saved successfully!</span>}
          </div>
        </>
      )}

      {!activeBranch && branches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>No branches yet. Click "Add Branch" above to create your first branch.</p>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' };
const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box' };

/* ════════════════════════════════════════
   LIVE DISPLAY MODULE
════════════════════════════════════════ */
function LiveDisplay({ form }) {
  const name      = form.gymName      || 'PROBURN';
  const highlight = form.gymNameHighlight || 'BURN';
  const parts     = highlight ? name.split(highlight) : [name, ''];
  const tagline   = form.tagline      || 'Forging champions since 2024.';
  const branch    = form.branchName   || 'Main Branch';
  const city      = form.city         || '';
  const logo      = form.logoURL;
  const favicon   = form.faviconURL;
  const phone     = form.phone        || '';
  const email     = form.email        || '';
  const address   = form.address      || '';

  const LogoMark = ({ size = 44, radius = 10, textSize = '1.5rem' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      {logo
        ? <img src={logo} alt="logo" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: size, height: size, borderRadius: radius, background: 'rgba(255,69,0,0.18)', border: '2px solid rgba(255,69,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>🏋️</div>
      }
      <span style={{ fontWeight: 900, fontSize: textSize, letterSpacing: '1px', lineHeight: 1 }}>
        {parts[0]}<span style={{ color: 'var(--accent)' }}>{highlight}</span>{parts[1] || ''}
      </span>
    </div>
  );

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Header label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: '0.73rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</span>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>— updates as you type</span>
      </div>

      {/* ── Preview 1: Navbar ── */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.9rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          🔝 Top Navigation Bar
        </div>
        <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', padding: '0.9rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <LogoMark size={52} radius={10} textSize="1.7rem" />
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {['Home', 'About', 'Classes', 'Pricing'].map(l => (
              <span key={l} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</span>
            ))}
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>Member Login</span>
            <span style={{ background: 'var(--accent)', color: 'white', padding: '0.35rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>Join Now</span>
          </div>
        </div>
      </div>

      {/* ── Preview 2: Favicon + Tab ── */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.9rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          🌐 Browser Tab & Favicon
        </div>
        <div style={{ background: '#1e293b', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Simulated browser tab */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', maxWidth: '220px' }}>
            {favicon
              ? <img src={favicon} alt="favicon" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
              : logo
                ? <img src={logo} alt="favicon" style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                : <span style={{ fontSize: '12px' }}>🏋️</span>
            }
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}{city ? ` — ${city}` : ''}
            </span>
          </div>
          {/* Favicon swatch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {favicon
                ? <img src={favicon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : logo
                  ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '18px' }}>🏋️</span>
              }
            </div>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>32×32</span>
          </div>
          {!favicon && !logo && (
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Upload a logo or favicon to see it here</span>
          )}
        </div>
      </div>

      {/* ── Preview 3: Footer Brand Block ── */}
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          🦶 Footer Brand Block
        </div>
        <div style={{ background: '#0a0f1e', padding: '1.4rem 1.6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left: brand */}
            <div>
              <LogoMark size={44} radius={9} textSize="1.4rem" />
              {tagline && (
                <p style={{ margin: '0.7rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, maxWidth: '240px' }}>
                  {tagline}
                </p>
              )}
              {/* Social icons placeholder */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {['ig', 'fb', 'tw'].map(s => (
                  <div key={s} style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{s}</div>
                ))}
              </div>
            </div>
            {/* Right: contact */}
            <div>
              <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {branch}{city ? ` — ${city}` : ''}
              </p>
              {address && <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>📍 {address}</p>}
              {phone   && <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>📞 {phone}</p>}
              {email   && <p style={{ margin: '0',            fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>✉️ {email}</p>}
              {!address && !phone && !email && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Fill in contact details above to see them here</p>
              )}
            </div>
          </div>
          <div style={{ marginTop: '1.2rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
