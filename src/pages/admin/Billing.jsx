import { Search, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, Database } from 'lucide-react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import Modal from '../../components/Modal';
import './Admin.css';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { globalSearchTerm } = useOutletContext() || { globalSearchTerm: '' };
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const { activeBranch } = useBranch();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    member: '',
    category: 'Membership Fee',
    status: 'Completed'
  });

  // Live Database Listener
  useEffect(() => {
    if (!activeBranch) {
      setAllTransactions([]);
      setLoading(false);
      return;
    }
    const qTx = query(collection(db, 'transactions'), where('branchId', '==', activeBranch.id));
    const unsubscribe = onSnapshot(qTx, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTransactions(txData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeBranch]);

  const seedDatabase = async () => {
    const mockTransactions = [
      { transactionId: 'TRX-901', date: '2026-05-24', member: 'Alex Johnson', type: 'Income', amount: '₹3,500', status: 'Completed', category: "Today's Collection", branchId: activeBranch.id },
      { transactionId: 'TRX-902', date: '2026-05-22', member: 'Sarah Williams', type: 'Income', amount: '₹12,000', status: 'Completed', category: 'Weekly Collection', branchId: activeBranch.id },
      { transactionId: 'TRX-903', date: '2026-05-20', member: 'Mike Chen', type: 'Income', amount: '₹9,000', status: 'Completed', category: 'Monthly Collection', branchId: activeBranch.id },
      { transactionId: 'TRX-904', date: '2026-05-24', member: 'EquipFix Inc', type: 'Expense', amount: '₹15,000', status: 'Completed', category: 'Equipment Maintenance', branchId: activeBranch.id },
      { transactionId: 'TRX-905', date: '2026-05-15', member: 'Power Utilities', type: 'Expense', amount: '₹42,000', status: 'Completed', category: 'Electricity Bill', branchId: activeBranch.id },
      { transactionId: 'TRX-906', date: '2026-05-01', member: 'Emily Davis', type: 'Income', amount: '₹24,500', status: 'Completed', category: 'Yearly Subscription', branchId: activeBranch.id },
      { transactionId: 'TRX-907', date: '2026-05-10', member: 'David Wilson', type: 'Due', amount: '₹6,000', status: 'Pending', category: 'Monthly Installment', branchId: activeBranch.id },
      { transactionId: 'TRX-908', date: '2026-04-28', member: 'Jessica Taylor', type: 'Due', amount: '₹6,000', status: 'Overdue', category: 'Monthly Installment', branchId: activeBranch.id },
    ];
    for (const t of mockTransactions) {
      await addDoc(collection(db, 'transactions'), t);
    }
    alert('Mock transactions added to Firebase!');
  };

  const getFilteredTransactions = () => {
    let filtered = allTransactions;

    if (filterQuery) {
      switch (filterQuery) {
        case 'today':
          filtered = filtered.filter(t => t.category === "Today's Collection");
          break;
        case 'weekly':
          filtered = filtered.filter(t => t.category === 'Weekly Collection');
          break;
        case 'monthly':
          filtered = filtered.filter(t => t.category === 'Monthly Collection');
          break;
        case 'dues':
          filtered = filtered.filter(t => t.type === 'Due');
          break;
        case 'due':
          filtered = filtered.filter(t => t.type === 'Due');
          break;
        case 'expenses':
          filtered = filtered.filter(t => t.type === 'Expense');
          break;
      }
    }

    const searchTerm = (globalSearchTerm || localSearchTerm || '').toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(t => 
        (t.member || '').toLowerCase().includes(searchTerm) ||
        (t.transactionId || '').toLowerCase().includes(searchTerm) ||
        (t.category || '').toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
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

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!activeBranch) return;
    const newTx = {
      transactionId: 'TRX-' + Math.floor(100 + Math.random() * 900),
      ...formData,
      amount: '₹' + Number(formData.amount).toLocaleString('en-IN'),
      branchId: activeBranch.id
    };
    
    try {
      await addDoc(collection(db, 'transactions'), newTx);
      setIsModalOpen(false);
      setFormData({ type: 'Income', amount: '', date: new Date().toISOString().split('T')[0], member: '', category: 'Membership Fee', status: 'Completed' });
    } catch (err) {
      alert("Error adding transaction: " + err.message);
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Transaction</button>
        </div>
      </div>

      <div className="members-table-container glass-panel">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Search by ID or member..." 
              value={localSearchTerm}
              onChange={e => setLocalSearchTerm(e.target.value)}
            />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Transaction">
        <form className="modal-form" onSubmit={handleAddTransaction}>
          <div className="form-group">
            <label>Transaction Type</label>
            <select value={formData.type} onChange={e => {
              const type = e.target.value;
              setFormData({...formData, type, category: type === 'Income' ? 'Membership Fee' : 'Equipment Maintenance' })
            }}>
              <option value="Income">Income / Collection</option>
              <option value="Expense">Expense</option>
              <option value="Due">Due / Pending</option>
            </select>
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 5000" />
          </div>
          <div className="form-group">
            <label>Member or Vendor Name</label>
            <input type="text" required value={formData.member} onChange={e => setFormData({...formData, member: e.target.value})} placeholder="e.g. Alex Johnson" />
          </div>
          <div className="form-group">
            <label>Category / Head</label>
            {formData.type === 'Income' || formData.type === 'Due' ? (
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Membership Fee">Membership Fee</option>
                <option value="PT Session">Personal Training</option>
                <option value="Merchandise">Merchandise / Supplements</option>
                <option value="Misc Income">Miscellaneous Income</option>
              </select>
            ) : (
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Rent">Rent</option>
                <option value="Salary">Staff Salary</option>
                <option value="Electricity Bill">Electricity Bill</option>
                <option value="Equipment Maintenance">Equipment Maintenance</option>
                <option value="Misc Expense">Miscellaneous Expense</option>
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Transaction</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
