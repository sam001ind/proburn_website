import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { List, Save, Trash2, Plus } from 'lucide-react';
import { db } from '../../../firebase';

export default function Plans() {
  const [gymConfig, setGymConfig] = useState({ plans: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'settings', 'gym_config'), (docSnap) => {
      if (docSnap.exists()) {
        setGymConfig(docSnap.data());
      }
    });
    return () => unsubConfig();
  }, []);

  const handleUpdateConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'gym_config'), gymConfig);
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
          <List size={28} className="text-accent" />
          Membership Plans
        </h1>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Define features for your plans. When a member clicks on their plan in the dashboard, these details will appear in a popup.
      </p>

      {gymConfig.plans?.map((plan, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={plan.name || ''} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].name = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Plan Name (e.g. Elite)" 
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
            <input 
              type="text" 
              value={plan.price || ''} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].price = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Price (e.g. $89)" 
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
            <input 
              type="text" 
              value={plan.period || ''} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].period = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Period (e.g. /month)" 
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
            <input 
              type="text" 
              value={plan.tag || ''} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].tag = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Badge Tag (e.g. Most Popular)" 
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            />
          </div>
          <textarea 
            value={plan.features || ''} 
            onChange={(e) => {
              const newPlans = [...gymConfig.plans];
              newPlans[idx].features = e.target.value;
              setGymConfig({...gymConfig, plans: newPlans});
            }}
            placeholder="Features (comma separated or multiline)" 
            style={{ flex: '2 1 300px', minHeight: '200px', resize: 'vertical', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'white', fontFamily: 'inherit' }}
          />
          <button 
            onClick={() => {
              const newPlans = gymConfig.plans.filter((_, i) => i !== idx);
              setGymConfig({...gymConfig, plans: newPlans});
            }}
            className="icon-btn text-red"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      
      <button 
        onClick={() => setGymConfig({...gymConfig, plans: [...(gymConfig.plans || []), { name: '', price: '', period: '', tag: '', features: '' }]})} 
        className="btn btn-outline" 
        style={{ marginBottom: '2rem' }}
      >
        <Plus size={16} /> Add Plan
      </button>

      <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <button onClick={handleUpdateConfig} className="btn btn-primary" disabled={loading}>
          <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Settings
        </button>
      </div>
    </div>
  );
}
