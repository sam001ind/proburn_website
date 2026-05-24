import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Layout, Save } from 'lucide-react';

export default function HeroEditor() {
  const [data, setData] = useState({
    title: 'FORGE YOUR LEGACY',
    titleHighlight: 'LEGACY',
    subtitle: 'Join the elite. Push your limits. Transform your life at Proburn Fitness with state-of-the-art equipment and expert coaching.',
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'View Classes',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'hero'), (snap) => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setLoading(true);
    await setDoc(doc(db, 'homepage', 'hero'), data);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (label, key, multiline = false) => (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      {multiline ? (
        <textarea value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })}
          rows={3} style={inputStyle} />
      ) : (
        <input type="text" value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })}
          style={inputStyle} />
      )}
    </div>
  );

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Layout size={26} className="text-accent" />Hero Section</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Edit the main banner shown at the top of your homepage.</p>
      </div>
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        {field('Main Title', 'title')}
        {field('Highlighted Word (must appear in title)', 'titleHighlight')}
        {field('Subtitle / Description', 'subtitle', true)}
        {field('Primary Button Text', 'ctaPrimary')}
        {field('Secondary Button Text', 'ctaSecondary')}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <button onClick={save} className="btn btn-primary" disabled={loading}>
            <Save size={16} style={{ marginRight: '0.5rem' }} />{loading ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>✅ Saved!</span>}
        </div>
      </div>
      <Preview title={data.title} highlight={data.titleHighlight} subtitle={data.subtitle} ctaP={data.ctaPrimary} ctaS={data.ctaSecondary} />
    </div>
  );
}

function Preview({ title, highlight, subtitle, ctaP, ctaS }) {
  const parts = title?.split(highlight) || [title];
  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Live Preview</p>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem' }}>
        {parts[0]}<span style={{ color: 'var(--accent)' }}>{highlight}</span>{parts[1]}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '600px' }}>{subtitle}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span className="btn btn-primary">{ctaP}</span>
        <span className="btn btn-outline">{ctaS}</span>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
  border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
  color: 'white', fontFamily: 'inherit', fontSize: '0.95rem', boxSizing: 'border-box',
  resize: 'vertical',
};
