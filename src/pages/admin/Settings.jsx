import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { Calendar as CalendarIcon, Trash2, Plus, Settings as SettingsIcon, Target, Save, List } from 'lucide-react';
import { db } from '../../firebase';
import './Admin.css';

export default function Settings() {
  const [holidays, setHolidays] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [gymConfig, setGymConfig] = useState({ targetStreak: 7, plans: [] });

  useEffect(() => {
    const q = query(collection(db, 'holidays'), orderBy('date', 'asc'));
    const unsubHolidays = onSnapshot(q, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubConfig = onSnapshot(doc(db, 'settings', 'gym_config'), (docSnap) => {
      if (docSnap.exists()) {
        setGymConfig(docSnap.data());
      }
    });

    return () => { unsubHolidays(); unsubConfig(); };
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

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newDate || !newDesc) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'holidays'), {
        date: newDate,
        description: newDesc
      });
      setNewDate('');
      setNewDesc('');
    } catch (err) {
      alert("Error adding holiday: " + err.message);
    }
    setLoading(false);
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await deleteDoc(doc(db, 'holidays', id));
    } catch (err) {
      alert("Error deleting holiday: " + err.message);
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <h1><SettingsIcon size={28} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Gym Settings</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '800px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon className="text-accent" />
          Gym Holidays
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Add dates when the gym is closed (including weekends if applicable). These dates are ignored when calculating member check-in streaks.
        </p>

        <form onSubmit={handleAddHoliday} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label>Date</label>
            <input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '2 1 300px' }}>
            <label>Description (e.g. Sunday, Diwali, etc.)</label>
            <input 
              type="text" 
              value={newDesc} 
              onChange={(e) => setNewDesc(e.target.value)} 
              placeholder="Why is the gym closed?" 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No holidays configured yet.
                  </td>
                </tr>
              ) : (
                holidays.map(holiday => (
                  <tr key={holiday.id}>
                    <td><strong>{new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></td>
                    <td>{holiday.description}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteHoliday(holiday.id)} 
                        className="icon-btn text-red"
                        title="Delete Holiday"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target className="text-accent" />
          General Settings
        </h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Target Streak (Days) for Member Confetti Celebration</label>
          <input 
            type="number" 
            value={gymConfig.targetStreak || ''} 
            onChange={(e) => setGymConfig({...gymConfig, targetStreak: parseInt(e.target.value) || 0})} 
            style={{ maxWidth: '200px' }}
          />
        </div>

        <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <List className="text-accent" />
          Membership Plans
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Define features for your plans. When a member clicks on their plan in the dashboard, these details will appear in a popup.
        </p>

        {gymConfig.plans?.map((plan, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
            <input 
              type="text" 
              value={plan.name} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].name = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Plan Name (e.g. Elite)" 
              style={{ flex: 1 }}
            />
            <textarea 
              value={plan.features} 
              onChange={(e) => {
                const newPlans = [...gymConfig.plans];
                newPlans[idx].features = e.target.value;
                setGymConfig({...gymConfig, plans: newPlans});
              }}
              placeholder="Features (comma separated or multiline)" 
              style={{ flex: 2, minHeight: '80px', resize: 'vertical' }}
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
          onClick={() => setGymConfig({...gymConfig, plans: [...(gymConfig.plans || []), { name: '', features: '' }]})} 
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
    </div>
  );
}
