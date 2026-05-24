/**
 * ClockInSettings — Admin panel to control biometric & location
 * per user type (Staff / Members).
 * Stored in Firestore: settings/clockin_config
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  Fingerprint, MapPin, Save, ShieldCheck, Users, Briefcase,
  CheckCircle2, Info, Clock
} from 'lucide-react';
import '../Admin.css';

const defaultConfig = {
  staffBiometric:  false,
  staffLocation:   false,
  memberBiometric: false,
  memberLocation:  false,
};

export default function ClockInSettings() {
  const [config, setConfig]   = useState(defaultConfig);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'clockin_config'), (snap) => {
      if (snap.exists()) setConfig({ ...defaultConfig, ...snap.data() });
    });
    return () => unsub();
  }, []);

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, 'settings', 'clockin_config'), config, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ label, desc, icon: Icon, value, onChange, color = 'accent' }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.1rem 1.4rem',
      background: value ? `rgba(${color === 'green' ? '34,197,94' : '255,69,0'},0.07)` : 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      border: `1px solid ${value ? `rgba(${color === 'green' ? '34,197,94' : '255,69,0'},0.25)` : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.2s',
      gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', flex: 1 }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: value ? `rgba(${color === 'green' ? '34,197,94' : '255,69,0'},0.18)` : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: value ? (color === 'green' ? '#4ade80' : 'var(--accent)') : 'var(--text-secondary)',
          flexShrink: 0, transition: 'all 0.2s',
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{label}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '52px', height: '28px', borderRadius: '50px',
          background: value ? (color === 'green' ? '#16a34a' : 'var(--accent)') : 'rgba(255,255,255,0.12)',
          border: 'none', cursor: 'pointer', padding: '3px',
          display: 'flex', alignItems: 'center',
          justifyContent: value ? 'flex-end' : 'flex-start',
          transition: 'background 0.22s, justify-content 0.22s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          transition: 'transform 0.22s',
        }} />
      </button>
    </div>
  );

  const Section = ({ title, subtitle, icon: Icon, children }) => (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '1.2rem',
    }}>
      <div style={{
        padding: '1.1rem 1.4rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', gap: '0.8rem',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: 'rgba(255,69,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Icon size={17} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '1px' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div className="admin-header">
        <div>
          <h1><Clock size={22} className="text-accent" /> Clock-In Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Control biometric and location requirements per user type</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saved && <span style={{ color: '#4ade80', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={15} /> Saved!</span>}
          <button onClick={save} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '1rem 1.2rem', borderRadius: '12px', marginBottom: '1.5rem',
        background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
        color: '#93c5fd', fontSize: '0.82rem', lineHeight: 1.5,
      }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Changes take effect immediately for all users.
          When <strong>Biometric</strong> is OFF, users clock in/out with a single tap.
          When <strong>Location</strong> is ON, GPS coordinates are captured and stored with each punch.
        </span>
      </div>

      {/* Staff */}
      <Section title="Staff" subtitle="Trainers, coaches, front-desk" icon={Briefcase}>
        <Toggle
          label="Require Biometric"
          desc="Staff must verify with fingerprint or Face ID before each clock-in/out"
          icon={Fingerprint}
          value={config.staffBiometric}
          onChange={(v) => setConfig(c => ({ ...c, staffBiometric: v }))}
          color="accent"
        />
        <Toggle
          label="Capture Location"
          desc="GPS coordinates are recorded with every staff punch (stored in attendance log)"
          icon={MapPin}
          value={config.staffLocation}
          onChange={(v) => setConfig(c => ({ ...c, staffLocation: v }))}
          color="green"
        />
      </Section>

      {/* Members */}
      <Section title="Members" subtitle="Gym members via Member Portal" icon={Users}>
        <Toggle
          label="Require Biometric"
          desc="Members must verify with fingerprint or Face ID before each clock-in/out"
          icon={Fingerprint}
          value={config.memberBiometric}
          onChange={(v) => setConfig(c => ({ ...c, memberBiometric: v }))}
          color="accent"
        />
        <Toggle
          label="Capture Location"
          desc="GPS coordinates are recorded with every member punch"
          icon={MapPin}
          value={config.memberLocation}
          onChange={(v) => setConfig(c => ({ ...c, memberLocation: v }))}
          color="green"
        />
      </Section>

      {/* Preview card */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '1.2rem 1.4rem',
      }}>
        <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '1rem' }}>
          Current Configuration Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { role: 'Staff', bio: config.staffBiometric, loc: config.staffLocation },
            { role: 'Members', bio: config.memberBiometric, loc: config.memberLocation },
          ].map(({ role, bio, loc }) => (
            <div key={role} style={{
              padding: '1rem 1.1rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.88rem' }}>{role}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <Fingerprint size={13} style={{ color: bio ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }} />
                  <span style={{ color: bio ? 'white' : 'rgba(255,255,255,0.35)' }}>
                    Biometric: <strong>{bio ? 'Required' : 'Off — tap only'}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <MapPin size={13} style={{ color: loc ? '#4ade80' : 'rgba(255,255,255,0.25)' }} />
                  <span style={{ color: loc ? 'white' : 'rgba(255,255,255,0.35)' }}>
                    Location: <strong>{loc ? 'Captured' : 'Not tracked'}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
