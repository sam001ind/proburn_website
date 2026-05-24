import { Users, Activity, DollarSign, TrendingUp, AlertCircle, Clock, Wallet, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import './Admin.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  const { currentUser } = useAuth();
  const [userRoleData, setUserRoleData] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // RBAC logic
    const qMember = query(collection(db, 'members'), where('email', '==', currentUser.email));
    const unsubMember = onSnapshot(qMember, (memberSnap) => {
      if (!memberSnap.empty) {
        const memberData = memberSnap.docs[0].data();
        const roleName = memberData.role || 'Member';
        
        const qRole = query(collection(db, 'roles'), where('name', '==', roleName));
        onSnapshot(qRole, (roleSnap) => {
          if (!roleSnap.empty) {
            setUserRoleData({ name: roleName, ...roleSnap.docs[0].data() });
          } else {
            setUserRoleData({ name: roleName, permissions: { menus: [], widgets: [] } });
          }
        });
      } else {
        if (currentUser.email === 'admin@gym.com' || currentUser.email === 'abhijiththirutheri@gmail.com') {
           setUserRoleData({ name: 'Super Admin' });
        }
      }
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data()));
    });
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data()));
    });
    const unsubAtt = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => doc.data()));
    });
    
    return () => { unsubMember(); unsubMembers(); unsubTx(); unsubAtt(); };
  }, [currentUser]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Calculations
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const expiredMembers = members.filter(m => m.status === 'Expired').length;
  const exp3 = members.filter(m => m.status === 'Active' && m.expiry > 0 && m.expiry <= 3).length;
  const exp10 = members.filter(m => m.status === 'Active' && m.expiry > 3 && m.expiry <= 10).length;
  const exp15 = members.filter(m => m.status === 'Active' && m.expiry > 10 && m.expiry <= 15).length;

  const parseAmount = (amtStr) => parseInt(amtStr.replace(/\\D/g, '')) || 0;
  
  const todayColl = transactions.filter(t => t.category === "Today's Collection").reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const weeklyColl = transactions.filter(t => ['Weekly Collection', "Today's Collection"].includes(t.category)).reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const totalDue = transactions.filter(t => t.type === 'Due').reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseAmount(t.amount), 0);
  const activeCount = Math.max(0, attendance.filter(a => a.type === 'Check-In').length - attendance.filter(a => a.type === 'Check-Out').length);

  const stats = [
    { id: 'total_members', label: 'Total Members', value: members.length || '1,248', icon: <Users size={24} className="text-blue" />, route: '/admin/members' },
    { id: 'currently_in_gym', label: 'Currently in Gym', value: activeCount || '0', icon: <Activity size={24} className="text-red" />, route: '/admin/attendance?filter=active' },
    { id: 'growth', label: 'Growth', value: '+15%', icon: <TrendingUp size={24} className="text-green" />, route: '/admin/billing' },
    
    { id: 'active_members', label: 'Active Members', value: activeMembers || '1,100', icon: <Users size={24} className="text-blue" />, route: '/admin/members?filter=active' },
    { id: 'expired_members', label: 'Expired Memberships', value: expiredMembers || '148', icon: <AlertCircle size={24} className="text-red" />, route: '/admin/members?filter=expired' },
    
    { id: 'expiring_members', label: 'Expiring (1-3 Days)', value: exp3 || '12', icon: <Clock size={24} className="text-accent" />, route: '/admin/members?filter=expiring-3' },
    { id: 'expiring_members', label: 'Expiring (5-10 Days)', value: exp10 || '28', icon: <Clock size={24} className="text-accent" />, route: '/admin/members?filter=expiring-10' },
    { id: 'expiring_members', label: 'Expiring (10-15 Days)', value: exp15 || '45', icon: <Clock size={24} className="text-accent" />, route: '/admin/members?filter=expiring-15' },

    { id: 'todays_collection', label: "Today's Collection", value: todayColl ? formatCurrency(todayColl) : '₹3,500', icon: <Wallet size={24} className="text-green" />, route: '/admin/billing?filter=today' },
    { id: 'weekly_collection', label: 'Weekly Collection', value: weeklyColl ? formatCurrency(weeklyColl) : '₹24,500', icon: <Wallet size={24} className="text-green" />, route: '/admin/billing?filter=weekly' },
    { id: 'monthly_collection', label: 'Monthly Collection', value: totalIncome ? formatCurrency(totalIncome) : '₹2,45,000', icon: <DollarSign size={24} className="text-green" />, route: '/admin/billing?filter=monthly' },
    { id: 'yearly_collection', label: 'Yearly Collection', value: '₹28.5L', icon: <DollarSign size={24} className="text-green" />, route: '/admin/billing?filter=yearly' },
    
    { id: 'due_amount', label: 'Due Amount', value: totalDue ? formatCurrency(totalDue) : '₹12,000', icon: <AlertCircle size={24} className="text-red" />, route: '/admin/billing?filter=due' },
    { id: 'total_expenses', label: 'Total Expenses', value: totalExpenses ? formatCurrency(totalExpenses) : '₹84,000', icon: <TrendingDown size={24} className="text-red" />, route: '/admin/billing?filter=expenses' }
  ];

  const visibleStats = stats.filter(stat => {
    if (userRoleData?.name === 'Super Admin') return true;
    return userRoleData?.permissions?.widgets?.includes(stat.id);
  });

  const showRevenueChart = userRoleData?.name === 'Super Admin' || userRoleData?.permissions?.widgets?.includes('revenue_chart');
  const showUpcomingClasses = userRoleData?.name === 'Super Admin' || userRoleData?.permissions?.widgets?.includes('upcoming_classes');

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="admin-header">
        <h1>Dashboard Overview</h1>
        <button className="btn btn-primary">+ Add Member</button>
      </div>
      
      <div className="stats-grid">
        {visibleStats.map((stat, idx) => (
          <div 
            key={idx} 
            className="stat-card glass-panel interactive-card"
            onClick={() => navigate(stat.route)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        {showRevenueChart && (
          <div className="chart-container glass-panel">
            <h3>Revenue Analytics</h3>
            <div className="mock-chart">
              <div className="bar" style={{height: '30%'}}></div>
              <div className="bar" style={{height: '50%'}}></div>
              <div className="bar" style={{height: '40%'}}></div>
              <div className="bar" style={{height: '80%'}}></div>
              <div className="bar" style={{height: '60%'}}></div>
              <div className="bar" style={{height: '100%'}}></div>
              <div className="bar" style={{height: '85%'}}></div>
            </div>
          </div>
        )}
        {showUpcomingClasses && (
          <div className="chart-container glass-panel">
            <h3>Upcoming Classes</h3>
            <ul className="upcoming-list">
              <li>
                <span className="time">17:30</span>
                <span className="name">Powerlifting</span>
                <span className="trainer">Coach Mike</span>
              </li>
              <li>
                <span className="time">18:00</span>
                <span className="name">CrossFit WOD</span>
                <span className="trainer">Coach Sarah</span>
              </li>
              <li>
                <span className="time">19:00</span>
                <span className="name">Yoga Flow</span>
                <span className="trainer">Emma T.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
