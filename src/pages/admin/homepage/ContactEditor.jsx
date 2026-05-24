import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MapPin, Save } from 'lucide-react';

export default function ContactEditor() {
  const [data, setData] = useState({
    gymName: 'PROBURN',
    gymNameHighlight: 'BURN',
    tagline: 'Forging champions since 2024. Your ultimate destination for strength, conditioning, and transformation.',
    address: '123 Muscle Ave, Fit City, FC 90210',
    phone: '(555) 123-4567',
    email: 'info@proburnfitness.com',
    instagramUrl: '#',
    facebookUrl: '#',
    twitterUrl: '#',
    copyrightName: 'Proburn Fitness',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'contact'), (snap) => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setLoading(true);
    await setDoc(doc(db, 'homepage', 'contact'), data);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (label, key, type = 'text') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} style={inputStyle} value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><MapPin size={26} className="text-accent" />Contact & Footer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Edit the footer contact details, social links, and branding shown at the bottom of the homepage.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Branding</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {field('Gym Name (e.g. PROBURN)', 'gymName')}
          {field('Highlighted Part (e.g. BURN)', 'gymNameHighlight')}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Tagline / Description</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={data.tagline || ''} onChange={e => setData({ ...data, tagline: e.target.value })} />
          </div>
          {field('Copyright Name', 'copyrightName')}
        </div>

        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Contact Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ gridColumn: '1/-1' }}>{field('Address', 'address')}</div>
          {field('Phone Number', 'phone', 'tel')}
          {field('Email Address', 'email', 'email')}
        </div>

        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Social Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {field('Instagram URL', 'instagramUrl', 'url')}
          {field('Facebook URL', 'facebookUrl', 'url')}
          {field('Twitter / X URL', 'twitterUrl', 'url')}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <button onClick={save} className="btn btn-primary" disabled={loading}>
            <Save size={16} style={{ marginRight: '0.5rem' }} />{loading ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>✅ Saved!</span>}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' };
const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', boxSizing: 'border-box' };
