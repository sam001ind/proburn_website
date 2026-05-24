import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserPlus, Trash2, Edit2, CheckCircle, Phone, Mail, Tag, Clock, MessageSquare } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import Modal from '../../components/Modal';
import './Admin.css';

const STATUS_OPTIONS = ['New', 'Contacted', 'Converted', 'Lost'];

const STATUS_COLORS = {
  New: '#3b82f6',
  Contacted: '#f59e0b',
  Converted: '#22c55e',
  Lost: '#ef4444',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const { activeBranch } = useBranch();

  // Edit lead modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('New');

  // Convert to member modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '', email: '', phone: '', plan: '',
    joined: new Date().toISOString().split('T')[0],
    duration: '30', height: '', weight: '', role: 'Member',
    photoURL: '', emergencyContact: '', dob: '',
  });
  const [convertLoading, setConvertLoading] = useState(false);

  useEffect(() => {
    if (!activeBranch) {
      setLeads([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(collection(db, 'leads'), (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data = data.filter(l => l.branchId === activeBranch.id);
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setLeads(data);
      setLoading(false);
    });
    return () => unsub();
  }, [activeBranch]);

  const openEdit = (lead) => {
    setEditingLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status || 'New');
    setEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editingLead) return;
    await updateDoc(doc(db, 'leads', editingLead.id), {
      notes: editNotes,
      status: editStatus,
    });
    setEditModalOpen(false);
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await deleteDoc(doc(db, 'leads', id));
  };

  const openConvert = (lead) => {
    setConvertingLead(lead);
    setMemberForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      plan: lead.plan || 'Basic',
      joined: new Date().toISOString().split('T')[0],
      duration: '30',
      height: '',
      weight: '',
      role: 'Member',
      photoURL: '',
      emergencyContact: '',
      dob: '',
    });
    setConvertModalOpen(true);
  };

  const convertToMember = async () => {
    if (!convertingLead) return;
    setConvertLoading(true);
    try {
      // Generate member ID
      const memberId = 'MEM' + Date.now().toString().slice(-6);
      const expiryDays = parseInt(memberForm.duration) || 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      await addDoc(collection(db, 'members'), {
        memberId,
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone,
        plan: memberForm.plan,
        joined: memberForm.joined,
        expiry: expiryDays,
        expiryDate: expiryDate.toISOString().split('T')[0],
        height: memberForm.height,
        weight: memberForm.weight,
        role: memberForm.role,
        photoURL: memberForm.photoURL,
        emergencyContact: memberForm.emergencyContact,
        dob: memberForm.dob,
        status: 'Active',
        branchId: convertingLead.branchId || activeBranch.id,
        createdAt: serverTimestamp(),
      });

      // Mark lead as converted
      await updateDoc(doc(db, 'leads', convertingLead.id), {
        status: 'Converted',
        convertedMemberId: memberId,
      });

      setConvertModalOpen(false);
      alert(`✅ ${memberForm.name} has been added as a member (ID: ${memberId})`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setConvertLoading(false);
  };

  const filtered = filterStatus === 'All' ? leads : leads.filter(l => l.status === filterStatus);
  const newCount = leads.filter(l => l.status === 'New').length;

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  };

  return (
    <div className="admin-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <UserPlus size={28} className="text-accent" />
            Lead Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {newCount > 0 ? `${newCount} new lead${newCount > 1 ? 's' : ''} waiting` : 'All leads up to date'}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '50px',
              border: '1px solid',
              borderColor: filterStatus === s ? (STATUS_COLORS[s] || 'var(--accent)') : 'var(--glass-border)',
              background: filterStatus === s ? (STATUS_COLORS[s] || 'var(--accent)') + '22' : 'transparent',
              color: filterStatus === s ? (STATUS_COLORS[s] || 'var(--accent)') : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {s}
            {s !== 'All' && (
              <span style={{ marginLeft: '0.4rem', opacity: 0.7 }}>
                ({leads.filter(l => l.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading leads...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', borderRadius: '16px' }}>
          <UserPlus size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No leads yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Leads from the homepage enquiry form will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(lead => (
            <div key={lead.id} className="glass-panel" style={{
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: '1rem',
              alignItems: 'center',
              borderLeft: `4px solid ${STATUS_COLORS[lead.status] || 'var(--glass-border)'}`,
            }}>
              {/* Lead Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{lead.name}</h3>
                  <span style={{
                    padding: '0.2rem 0.7rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: STATUS_COLORS[lead.status] + '22',
                    color: STATUS_COLORS[lead.status] || 'white',
                    border: `1px solid ${STATUS_COLORS[lead.status] || 'transparent'}`,
                  }}>{lead.status || 'New'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {lead.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={14} />{lead.phone}</span>}
                  {lead.email && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={14} />{lead.email}</span>}
                  {lead.plan && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={14} />Plan: <strong style={{ color: 'var(--accent)' }}>{lead.plan}</strong></span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} />{formatDate(lead.createdAt)}</span>
                </div>
                {lead.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{lead.notes}</span>
                  </div>
                )}
              </div>

              {/* Lead Message */}
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                {lead.message ? `"${lead.message}"` : '—'}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(lead)} className="icon-btn" title="Edit / Update Status" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', borderRadius: '8px', padding: '0.5rem' }}>
                  <Edit2 size={16} />
                </button>
                {lead.status !== 'Converted' && (
                  <button onClick={() => openConvert(lead)} title="Convert to Member" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    <CheckCircle size={16} /> Convert
                  </button>
                )}
                <button onClick={() => deleteLead(lead.id)} className="icon-btn" title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.5rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Lead Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Lead">
        {editingLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{editingLead.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{editingLead.email} · {editingLead.phone}</p>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...inputStyle }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Notes</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Add internal notes about this lead..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <button onClick={saveEdit} className="btn btn-primary" style={{ width: '100%' }}>Save Changes</button>
          </div>
        )}
      </Modal>

      {/* Convert to Member Modal */}
      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Convert Lead to Member">
        {convertingLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              ✅ Completing profile for <strong>{convertingLead.name}</strong>
            </div>
            <div className="modal-form-grid">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Full Name', full: true },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'Email Address' },
                { label: 'WhatsApp / Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                { label: 'Plan', key: 'plan', type: 'text', placeholder: 'e.g. Pro' },
                { label: 'Join Date', key: 'joined', type: 'date' },
                { label: 'Duration (days)', key: 'duration', type: 'number', placeholder: '30' },
                { label: 'Height (cm)', key: 'height', type: 'number', placeholder: '175' },
                { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: '70' },
                { label: 'Date of Birth', key: 'dob', type: 'date' },
                { label: 'Emergency Contact', key: 'emergencyContact', type: 'text', placeholder: 'Name & Phone' },
                { label: 'Photo URL', key: 'photoURL', type: 'url', placeholder: 'https://...' },
              ].map(field => (
                <div key={field.key} className={`form-group ${field.full ? 'full-width' : ''}`}>
                  <label>{field.label}</label>
                  <input
                    type={field.type}
                    value={memberForm[field.key]}
                    onChange={e => setMemberForm({ ...memberForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Role</label>
                <select value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}>
                  <option value="Member">Member</option>
                  <option value="Staff">Staff</option>
                  <option value="Trainer">Trainer</option>
                </select>
              </div>
            </div>
            <button onClick={convertToMember} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={convertLoading}>
              <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
              {convertLoading ? 'Creating Member...' : 'Confirm & Create Member'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
