import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Zap, Save, Plus, Trash2 } from 'lucide-react';

const ICONS = ['Zap', 'Shield', 'Users', 'Trophy', 'Star', 'Heart', 'Target', 'Award'];

export default function FeaturesEditor() {
  const [data, setData] = useState({
    sectionTitle: 'Why Choose',
    sectionTitleHighlight: 'Proburn',
    subtitle: "We don't just offer equipment; we provide an environment engineered for success and transformation.",
    features: [
      { icon: 'Zap', title: 'High-Intensity Training', description: 'Push your limits with our scientifically designed HIIT and strength programs.' },
      { icon: 'Shield', title: 'Premium Equipment', description: 'Train with the best. Our facility is equipped with state-of-the-art rogue gear.' },
      { icon: 'Users', title: 'Elite Coaching', description: 'Learn from certified professionals dedicated to your personal growth.' },
      { icon: 'Trophy', title: 'Proven Results', description: 'Join a community of champions. Your success is our ultimate goal.' },
    ]
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'features'), (snap) => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setLoading(true);
    await setDoc(doc(db, 'homepage', 'features'), data);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateFeature = (idx, field, val) => {
    const features = [...data.features];
    features[idx] = { ...features[idx], [field]: val };
    setData({ ...data, features });
  };

  const addFeature = () => setData({ ...data, features: [...data.features, { icon: 'Star', title: '', description: '' }] });
  const removeFeature = (idx) => setData({ ...data, features: data.features.filter((_, i) => i !== idx) });

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Zap size={26} className="text-accent" />Features Section</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Edit the "Why Choose Us" cards on the homepage.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Section Title</label>
            <input style={inputStyle} value={data.sectionTitle} onChange={e => setData({ ...data, sectionTitle: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Highlighted Word</label>
            <input style={inputStyle} value={data.sectionTitleHighlight} onChange={e => setData({ ...data, sectionTitleHighlight: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Section Subtitle</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })} />
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Feature Cards</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.features.map((f, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.2rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: '0.8rem', alignItems: 'start' }}>
              <div>
                <label style={labelStyle}>Icon</label>
                <select value={f.icon} onChange={e => updateFeature(idx, 'icon', e.target.value)} style={inputStyle}>
                  {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={f.title} onChange={e => updateFeature(idx, 'title', e.target.value)} placeholder="Feature title" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={f.description} onChange={e => updateFeature(idx, 'description', e.target.value)} placeholder="Short description" />
              </div>
              <button onClick={() => removeFeature(idx)} style={{ marginTop: '1.4rem', padding: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addFeature} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} />Add Feature Card
        </button>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
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
