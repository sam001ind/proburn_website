import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTenant } from '../../../context/TenantContext';
import { Save, Palette, Image as ImageIcon } from 'lucide-react';

const defaultTheme = {
  logoText: 'PROBURN',
  logoHighlight: 'BURN',
  logoUrl: '',
  primaryColor: '#ff4444',
  bgColor: '#111111',
  surfaceColor: '#1a1a1a'
};

const PREDEFINED_PALETTES = [
  { name: 'Dark & Aggressive', primaryColor: '#ff4444', bgColor: '#111111', surfaceColor: '#1a1a1a' },
  { name: 'Neon Cyberpunk',    primaryColor: '#00f3ff', bgColor: '#0b0914', surfaceColor: '#121021' },
  { name: 'Clean Corporate',   primaryColor: '#0a58ca', bgColor: '#ffffff', surfaceColor: '#f8f9fa' },
  { name: 'Forest Fitness',    primaryColor: '#2ecc71', bgColor: '#0a1f11', surfaceColor: '#152a1b' },
  { name: 'Luxury Gold',       primaryColor: '#ffd700', bgColor: '#000000', surfaceColor: '#111111' },
  { name: 'Ocean Breeze',      primaryColor: '#00b4d8', bgColor: '#f0f8ff', surfaceColor: '#ffffff' },
  { name: 'Sunset Vibe',       primaryColor: '#ff7e5f', bgColor: '#2b1b17', surfaceColor: '#3a2622' },
  { name: 'Minimalist Mono',   primaryColor: '#333333', bgColor: '#ffffff', surfaceColor: '#f4f4f4' },
  { name: 'Retro 80s',         primaryColor: '#ff007f', bgColor: '#1f103b', surfaceColor: '#2a1a4a' },
  { name: 'High Viz',          primaryColor: '#ccff00', bgColor: '#101010', surfaceColor: '#1e1e1e' },
  { name: 'Soft Pastel',       primaryColor: '#ffb3c6', bgColor: '#fff0f3', surfaceColor: '#ffffff' },
  { name: 'Midnight Violet',   primaryColor: '#9d4edd', bgColor: '#10002b', surfaceColor: '#240046' },
];

export default function ThemeEditor() {
  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { activeGymId } = useTenant();

  useEffect(() => {
    const fetchTheme = async () => {
      if (!activeGymId) return;
      const docRef = doc(db, 'website_settings', `${activeGymId}_theme`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTheme({ ...defaultTheme, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchTheme();
  }, [activeGymId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeGymId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'website_settings', `${activeGymId}_theme`), { ...theme, gymId: activeGymId, type: 'theme' });
      alert('Theme settings saved successfully! It may take a refresh for colors to apply fully.');
    } catch (err) {
      alert("Error saving theme: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setTheme({ ...theme, [e.target.name]: e.target.value });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading theme settings...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Theme Settings</h1>
          <p className="admin-page-subtitle">Manage global branding and colors</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} style={{ marginRight: '0.4rem' }} /> {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
            <ImageIcon size={20} color="var(--accent)" /> Branding
          </div>
          <div className="form-group">
            <label>Logo Text (Primary)</label>
            <input type="text" name="logoText" value={theme.logoText} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Logo Highlight (Colored)</label>
            <input type="text" name="logoHighlight" value={theme.logoHighlight} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Logo Image URL (Optional override)</label>
            <input type="text" name="logoUrl" value={theme.logoUrl} onChange={handleChange} />
            <small style={{ color: 'var(--text-muted)' }}>If provided, this image will be used instead of the text above.</small>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
            <Palette size={20} color="var(--accent)" /> Colors & Palettes
          </div>

          <div className="form-group">
            <label>Quick Palettes</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {PREDEFINED_PALETTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTheme(prev => ({ ...prev, primaryColor: p.primaryColor, bgColor: p.bgColor, surfaceColor: p.surfaceColor }))}
                  style={{
                    background: p.bgColor,
                    border: `1px solid ${p.surfaceColor}`,
                    color: p.bgColor === '#ffffff' ? '#000' : '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.primaryColor }}></div>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Primary Accent Color</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input type="color" name="primaryColor" value={theme.primaryColor} onChange={handleChange} style={{ width: '50px', height: '40px', padding: 0, border: 'none', background: 'transparent' }} />
              <input type="text" name="primaryColor" value={theme.primaryColor} onChange={handleChange} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="form-group">
            <label>Background Color</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input type="color" name="bgColor" value={theme.bgColor} onChange={handleChange} style={{ width: '50px', height: '40px', padding: 0, border: 'none', background: 'transparent' }} />
              <input type="text" name="bgColor" value={theme.bgColor} onChange={handleChange} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="form-group">
            <label>Surface Color (Cards, Modals)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input type="color" name="surfaceColor" value={theme.surfaceColor} onChange={handleChange} style={{ width: '50px', height: '40px', padding: 0, border: 'none', background: 'transparent' }} />
              <input type="text" name="surfaceColor" value={theme.surfaceColor} onChange={handleChange} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
