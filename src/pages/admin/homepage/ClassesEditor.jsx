import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Calendar, Save, Plus, Trash2 } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

export default function ClassesEditor() {
  const [data, setData] = useState({
    sectionTitle: 'Our',
    sectionTitleHighlight: 'Programs',
    subtitle: 'Find the perfect training program to match your goals and schedule.',
    classes: [
      { name: 'CrossFit WOD', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', time: 'Mon, Wed, Fri - 6:00 AM' },
      { name: 'Powerlifting', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop', time: 'Tue, Thu - 5:30 PM' },
    ]
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'classes'), (snap) => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setLoading(true);
    await setDoc(doc(db, 'homepage', 'classes'), data);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateClass = (idx, field, val) => {
    const classes = [...data.classes];
    classes[idx] = { ...classes[idx], [field]: val };
    setData({ ...data, classes });
  };

  const addClass = () => setData({ ...data, classes: [...data.classes, { name: '', image: '', time: '' }] });
  const removeClass = (idx) => setData({ ...data, classes: data.classes.filter((_, i) => i !== idx) });

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Calendar size={26} className="text-accent" />Classes / Programs Section</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Edit the programs/classes showcase on the homepage.</p>
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

        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Program Cards</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {data.classes.map((cls, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Class #{idx + 1}</h4>
                <button onClick={() => removeClass(idx)} style={{ padding: '0.4rem 0.7rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Class Name</label>
                  <input style={inputStyle} value={cls.name} onChange={e => updateClass(idx, 'name', e.target.value)} placeholder="e.g. CrossFit WOD" />
                </div>
                <div>
                  <label style={labelStyle}>Schedule / Time</label>
                  <input style={inputStyle} value={cls.time} onChange={e => updateClass(idx, 'time', e.target.value)} placeholder="e.g. Mon, Wed - 6:00 AM" />
                </div>
              </div>
              <ImageUpload
                value={cls.image}
                onChange={(url) => updateClass(idx, 'image', url)}
                storagePath="homepage/classes"
                label="Class Photo"
                width={800}
                height={500}
                maxMB={3}
              />
            </div>
          ))}
        </div>

        <button onClick={addClass} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          <Plus size={16} style={{ marginRight: '0.4rem' }} />Add Class
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
