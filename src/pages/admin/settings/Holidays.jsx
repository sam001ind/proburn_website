import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';
import { db } from '../../../firebase';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'holidays'), orderBy('date', 'asc'));
    const unsubHolidays = onSnapshot(q, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubHolidays();
  }, []);

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
    <div className="admin-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <CalendarIcon size={28} className="text-accent" />
          Holiday Configuration
        </h1>
      </div>
      
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
    </div>
  );
}
