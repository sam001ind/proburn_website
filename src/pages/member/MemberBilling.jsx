import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { CreditCard, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import '../admin/Admin.css';

export default function MemberBilling() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Member Profile
  useEffect(() => {
    if (!currentUser?.email) return;
    const qProfile = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubProfile = onSnapshot(qProfile, (snapshot) => {
      if (!snapshot.empty) {
        setProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });
    return () => unsubProfile();
  }, [currentUser]);

  // Fetch Billing Logs
  useEffect(() => {
    if (!profile?.name) return;
    // Querying by Member Name since that's how we structured Transactions for now.
    const qTx = query(collection(db, 'transactions'), where('member', '==', profile.name));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending
      txs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(txs);
      setLoading(false);
    });
    return () => unsubTx();
  }, [profile]);

  if (!profile) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  const dues = transactions.filter(t => t.type === 'Due' || t.status === 'Pending' || t.status === 'Overdue');
  const totalDueAmt = dues.reduce((sum, t) => {
    const num = Number(t.amount.replace(/[^0-9.-]+/g,""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>My Billing & Payments</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your invoices and payments</p>
      </div>

      {totalDueAmt > 0 && (
        <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertCircle size={32} className="text-red" />
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text)' }}>Action Required</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>You have outstanding dues of <strong>₹{totalDueAmt.toLocaleString('en-IN')}</strong>.</p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--accent)' }}>Pay Now</button>
        </div>
      )}

      <div className="members-table-container glass-panel">
        <h3 style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid var(--border)' }}>Transaction History</h3>
        <table className="members-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading billing data...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No transactions found on your account.</td></tr>
            ) : transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.transactionId || t.id.substring(0,6)}</td>
                <td>{new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{t.category}</td>
                <td style={{ fontWeight: 'bold' }}>{t.amount}</td>
                <td>
                  <span className={`status-badge ${t.status === 'Completed' ? 'active' : (t.status === 'Overdue' ? 'inactive' : 'pending')}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  {t.status === 'Completed' ? (
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => alert('Downloading PDF receipt...')}>
                      <Download size={14} style={{ marginRight: '4px' }} /> PDF
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                      <ExternalLink size={14} style={{ marginRight: '4px' }} /> Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
