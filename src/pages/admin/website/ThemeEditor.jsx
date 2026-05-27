import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Palette, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Dumbbell } from 'lucide-react';

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

const PreviewNavbarAndHero = ({ theme }) => {
  const parts = theme?.logoHighlight ? (theme.logoText || 'PROBURN').split(theme.logoHighlight) : [(theme?.logoText || 'PROBURN'), ''];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme?.bgColor || 'var(--bg)' }}>
      <nav className="navbar" style={{ position: 'relative', background: theme?.surfaceColor || 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="navbar-container container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff' }}>
            {theme?.logoUrl ? (
              <img src={theme.logoUrl} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
            ) : (
              <Dumbbell color={theme?.primaryColor || "var(--accent)"} size={24} />
            )}
            <span>{parts[0]}<span style={{ color: theme?.primaryColor || "var(--accent)" }}>{theme?.logoHighlight}</span>{parts[1] || ''}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ color: theme?.bgColor === '#ffffff' ? '#333' : '#eee', fontSize: '0.9rem', fontWeight: 500 }}>Home</div>
            <div style={{ color: theme?.bgColor === '#ffffff' ? '#333' : '#eee', fontSize: '0.9rem', fontWeight: 500 }}>Classes</div>
            <div style={{ color: theme?.primaryColor || "var(--accent)", fontSize: '0.9rem', fontWeight: 600 }}>Portal Login</div>
            <button className="btn" style={{ background: theme?.primaryColor || "var(--accent)", color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px' }}>
              Join Now
            </button>
          </div>

        </div>
      </nav>

      {/* Dummy Hero Block */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff' }}>
            Welcome to <span style={{ color: theme?.primaryColor || "var(--accent)" }}>{theme?.logoText || 'Our Gym'}</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: theme?.bgColor === '#ffffff' ? '#666' : '#aaa', marginBottom: '2rem' }}>
            Experience the best fitness journey with our custom themed platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn" style={{ background: theme?.primaryColor || "var(--accent)", color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 600 }}>
              Start Free Trial
            </button>
            <button className="btn btn-outline" style={{ border: `2px solid ${theme?.primaryColor || "var(--accent)"}`, color: theme?.primaryColor || "var(--accent)", background: 'transparent', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 600 }}>
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      {/* Dummy Features Block */}
      <div style={{ background: theme?.surfaceColor || 'var(--surface)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: theme?.bgColor || 'var(--bg)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: theme?.primaryColor ? `${theme.primaryColor}22` : 'rgba(255,0,0,0.1)', color: theme?.primaryColor || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Dumbbell size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: theme?.bgColor === '#ffffff' ? '#000' : '#fff', marginBottom: '0.5rem' }}>Feature {i}</h3>
              <p style={{ color: theme?.bgColor === '#ffffff' ? '#666' : '#aaa', fontSize: '0.9rem' }}>This is a preview of how cards and text look on your selected surface color.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ThemeEditor() {
  const { gymId: activeGymId } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!activeGymId) throw new Error("No active gym found");
      await setDoc(doc(db, 'website_settings', `${activeGymId}_theme`), { ...theme, gymId: activeGymId, type: 'theme' });
    } catch (err) {
      alert("Error saving theme: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setTheme({ ...theme, [e.target.name]: e.target.value });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading editor...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f0f13' }}>
      
      {/* Left Pane: Live Preview Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/superadmin/website/${activeGymId}/pages`)}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Pages
            </button>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Theme Settings</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {saving && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Saving...</span>}
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} style={{ marginRight: '0.5rem' }} /> Save Theme
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <PreviewNavbarAndHero theme={theme} />
        </div>
      </div>

      {/* Right Sidebar: Tools */}
      <div style={{ width: '350px', background: 'var(--surface)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            <Palette size={18} color="var(--accent)" /> Quick Palettes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {PREDEFINED_PALETTES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTheme(prev => ({ ...prev, primaryColor: p.primaryColor, bgColor: p.bgColor, surfaceColor: p.surfaceColor }))}
                style={{
                  background: p.bgColor,
                  border: `1px solid ${p.surfaceColor}`,
                  color: p.bgColor === '#ffffff' ? '#000' : '#fff',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {p.name}
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: p.primaryColor }}></div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <ImageIcon size={18} color="var(--accent)" /> Branding
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Logo Text</label>
              <input type="text" className="form-input" name="logoText" value={theme.logoText} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Logo Highlight</label>
              <input type="text" className="form-input" name="logoHighlight" value={theme.logoHighlight} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>Logo Image URL (Optional)</label>
              <input type="text" className="form-input" name="logoUrl" value={theme.logoUrl} onChange={handleChange} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <Palette size={18} color="var(--accent)" /> Custom Colors
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Primary Accent</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="color" name="primaryColor" value={theme.primaryColor} onChange={handleChange} style={{ width: '30px', height: '30px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" name="primaryColor" value={theme.primaryColor} onChange={handleChange} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Background Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="color" name="bgColor" value={theme.bgColor} onChange={handleChange} style={{ width: '30px', height: '30px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" name="bgColor" value={theme.bgColor} onChange={handleChange} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }} />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>Surface Color (Cards)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="color" name="surfaceColor" value={theme.surfaceColor} onChange={handleChange} style={{ width: '30px', height: '30px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" name="surfaceColor" value={theme.surfaceColor} onChange={handleChange} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
