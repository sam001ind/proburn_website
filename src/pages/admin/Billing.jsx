import { Search, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, Database } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './Admin.css';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Database Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTransactions(txData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const seedDatabase = async () => {
    const mockTransactions = [
      { transactionId: 'TRX-901', date: '2026-05-24', member: 'Alex Johnson', type: 'Income', amount: '₹3,500', status: 'Completed', category: "Today's Collection" },
      { transactionId: 'TRX-902', date: '2026-05-22', member: 'Sarah Williams', type: 'Income', amount: '₹12,000', status: 'Completed', category: 'Weekly Collection' },
      { transactionId: 'TRX-903', date: '2026-05-20', member: 'Mike Chen', type: 'Income', amount: '₹9,000', status: 'Completed', category: 'Monthly Collection' },
      { transactionId: 'TRX-904', date: '2026-05-24', member: 'EquipFix Inc', type: 'Expense', amount: '₹15,000', status: 'Completed', category: 'Equipment Maintenance' },
      { transactionId: 'TRX-905', date: '2026-05-15', member: 'Power Utilities', type: 'Expense', amount: '₹42,000', status: 'Completed', category: 'Electricity Bill' },
      { transactionId: 'TRX-906', date: '2026-05-01', member: 'Emily Davis', type: 'Income', amount: '₹24,500', status: 'Completed', category: 'Yearly Subscription' },
      { transactionId: 'TRX-907', date: '2026-05-10', member: 'David Wilson', type: 'Due', amount: '₹6,000', status: 'Pending', category: 'Monthly Installment' },
      { transactionId: 'TRX-908', date: '2026-04-28', member: 'Jessica Taylor', type: 'Due', amount: '₹6,000', status: 'Overdue', category: 'Monthly Installment' },
    ];
    for (const t of mockTransactions) {
      await addDoc(collection(db, 'transactions'), t);
    }
    alert('Mock transactions added to Firebase!');
  };

  const getFilteredTransactions = () => {
    if (!filterQuery) return allTransactions;
    
    switch (filterQuery) {
      case 'today':
        return allTransactions.filter(t => t.category === "Today's Collection");
      case 'weekly':
        return allTransactions.filter(t => t.type === 'Income' && ["Today's Collection", 'Weekly Collection'].includes(t.category));
      case 'monthly':
        return allTransactions.filter(t => t.type === 'Income' && t.status === 'Completed');
      case 'yearly':
        return allTransactions.filter(t => t.type === 'Income' && t.status === 'Completed');
      case 'due':
        return allTransactions.filter(t => t.type === 'Due');
      case 'expenses':
        return allTransactions.filter(t => t.type === 'Expense');
      default:
        return allTransactions;
    }
  };

  const transactions = getFilteredTransactions();

  const getTitle = () => {
    switch (filterQuery) {
      case 'today': return "Today's Collections";
      case 'weekly': return "Weekly Collections";
      case 'monthly': return "Monthly Collections";
      case 'yearly': return "Yearly Collections";
      case 'due': return "Due Amounts";
      case 'expenses': return "Total Expenses";
      default: return "All Transactions";
    }
  };

  return (
    <div className="members-container animate-fade-in">
      <div className="admin-header">
        <h1>{getTitle()}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {allTransactions.length === 0 && (
            <button className="btn btn-outline" onClick={seedDatabase}>
              <Database size={18} /> Seed Data
            </button>
          )}
          <button className="btn btn-primary">+ New Transaction</button>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder="Search by ID or member..." />
          </div>
          <button className="btn btn-outline"><Filter size={18} /> Filter</button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Member / Vendor</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading transactions from Firebase...</td></tr>
            ) : transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.transactionId || t.id.substring(0,6)}</td>
                <td>{t.date}</td>
                <td><strong>{t.member}</strong></td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: t.type === 'Income' ? '#10b981' : (t.type === 'Expense' ? '#ef4444' : '#f59e0b') }}>
                    {t.type === 'Income' ? <ArrowDownRight size={16} /> : (t.type === 'Expense' ? <ArrowUpRight size={16} /> : null)}
                    {t.type}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{t.amount}</td>
                <td>
                  <span className={`status-badge ${t.status === 'Completed' ? 'active' : 'inactive'}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  <button className="icon-btn"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
