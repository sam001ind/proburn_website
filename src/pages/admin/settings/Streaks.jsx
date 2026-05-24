import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Target, Save, Trash2, Plus } from 'lucide-react';
import { db } from '../../../firebase';

export default function Streaks() {
  const [gymConfig, setGymConfig] = useState({ streaks: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'settings', 'gym_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.streaks && data.targetStreak) {
           data.streaks = [{ days: data.targetStreak, title: 'Streak Master!' }];
        }
        setGymConfig(data);
      }
    });
    return () => unsubConfig();
  }, []);

  const handleUpdateConfig = async () => {
    setLoading(true);
    try {
      const configToSave = { ...gymConfig };
      delete configToSave.targetStreak;
      delete configToSave.targetStreaks;
      delete configToSave.targetStreaksRaw;
      
      await setDoc(doc(db, 'settings', 'gym_config'), configToSave);
      alert("Settings saved successfully!");
    } catch(err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Target size={28} className="text-accent" />
          Streak Milestones
        </h1>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Define target streaks for your members. When they hit these milestones, they'll get a celebration effect!
      </p>

      {gymConfig.streaks?.map((streak, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days</label>
            <input 
              type="number" 
              value={streak.days} 
              onChange={(e) => {
                const newStreaks = [...gymConfig.streaks];
                newStreaks[idx].days = parseInt(e.target.value) || 0;
                setGymConfig({...gymConfig, streaks: newStreaks});
              }}
              placeholder="e.g. 7" 
              min="1"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
          </div>
          <div style={{ flex: '3 1 250px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Milestone Name/Message</label>
            <input 
              type="text" 
              value={streak.title} 
              onChange={(e) => {
                const newStreaks = [...gymConfig.streaks];
                newStreaks[idx].title = e.target.value;
                setGymConfig({...gymConfig, streaks: newStreaks});
              }}
              placeholder="e.g. 1 Week Warrior!" 
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
          </div>
          <button 
            onClick={() => {
              const newStreaks = gymConfig.streaks.filter((_, i) => i !== idx);
              setGymConfig({...gymConfig, streaks: newStreaks});
            }}
            className="icon-btn text-red"
            style={{ marginTop: '1.2rem' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      
      <button 
        onClick={() => setGymConfig({...gymConfig, streaks: [...(gymConfig.streaks || []), { days: '', title: '' }]})} 
        className="btn btn-outline" 
        style={{ marginBottom: '2rem' }}
      >
        <Plus size={16} /> Add Streak Milestone
      </button>

      <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <button onClick={handleUpdateConfig} className="btn btn-primary" disabled={loading}>
          <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Settings
        </button>
      </div>
    </div>
  );
}
