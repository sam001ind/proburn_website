import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useBranding from '../hooks/useBranding';
import './Pricing.css';

const fallbackPlans = [
  {
    name: 'Basic',
    price: '₹1,499',
    period: '/month',
    features: ['Access to gym floor', 'Locker room access', 'Free weights area', '1 group class/month'],
    tag: ''
  },
  {
    name: 'Pro',
    price: '₹2,999',
    period: '/month',
    features: ['Unlimited gym access', 'All group classes', 'Sauna access', '1 PT session/month', 'Nutrition plan'],
    tag: 'Most Popular'
  },
  {
    name: 'Elite',
    price: '₹4,999',
    period: '/month',
    features: ['24/7 Access', 'Unlimited group classes', 'Unlimited sauna access', '4 PT sessions/month', 'Custom meal prep', 'Priority booking'],
    tag: ''
  }
];

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const branding = useBranding();

  // Enquiry form state
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Visibility listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'homepage', 'plans'), (snap) => {
      if (snap.exists()) setVisible(snap.data().visible !== false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'gym_config'));
        if (docSnap.exists() && docSnap.data().plans && docSnap.data().plans.length > 0) {
          const loadedPlans = docSnap.data().plans.map(p => ({
            name: p.name || 'Unnamed Plan',
            price: p.price || '₹Ask Us',
            period: p.period || '',
            features: typeof p.features === 'string'
              ? p.features.split('\n').filter(f => f.trim())
              : (Array.isArray(p.features) ? p.features : []),
            tag: p.tag || ''
          }));
          setPlans(loadedPlans);
        } else {
          setPlans(fallbackPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const openEnquiry = (planName) => {
    setSelectedPlan(planName);
    setFormData({ name: '', phone: '', email: '', message: '' });
    setSubmitted(false);
    setEnquiryOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        plan: selectedPlan,
        status: 'New',
        branchId: branding.id || 'default',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting enquiry. Please try again.');
    }
    setSubmitting(false);
  };

  if (!visible) return null;
  return (
    <section id="pricing" className="section-padding">
      <div className="container">
        <h2 className="section-title">Membership <span className="text-accent">Plans</span></h2>
        <p className="section-subtitle">Choose the perfect tier for your fitness journey.</p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading plans...</p>
        ) : (
          <div className="pricing-grid">
            {plans.map((plan, idx) => (
              <div key={idx} className={`glass-card pricing-card ${plan.tag ? 'recommended' : ''}`}>
                {plan.tag && <div className="recommended-badge">{plan.tag}</div>}
                <h3>{plan.name}</h3>
                <div className="price">
                  <span className="amount">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <ul className="features-list">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx}>
                      <Check size={18} className="text-accent" style={{ flexShrink: 0 }} /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openEnquiry(plan.name)}
                  className={`btn ${plan.tag ? 'btn-primary' : 'btn-outline'} w-full`}
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enquiry Slide-in Panel */}
      {enquiryOpen && (
        <div className="enquiry-overlay" onClick={() => setEnquiryOpen(false)}>
          <div className="enquiry-panel" onClick={e => e.stopPropagation()}>
            <div className="enquiry-header">
              <div>
                <h3>Enquire Now</h3>
                <p>Interested in <strong style={{ color: 'var(--accent)' }}>{selectedPlan}</strong> plan — we'll get back to you!</p>
              </div>
              <button onClick={() => setEnquiryOpen(false)} className="enquiry-close">
                <X size={22} />
              </button>
            </div>

            {submitted ? (
              <div className="enquiry-success">
                <div className="enquiry-success-icon">✅</div>
                <h3>Enquiry Submitted!</h3>
                <p>Thanks, <strong>{formData.name}</strong>! Our team will reach out to you on <strong>{formData.phone}</strong> shortly.</p>
                <button onClick={() => setEnquiryOpen(false)} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="enquiry-form">
                <div className="enquiry-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="enquiry-field">
                  <label>WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="enquiry-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@email.com (optional)"
                  />
                </div>
                <div className="enquiry-field">
                  <label>Selected Plan</label>
                  <input type="text" value={selectedPlan} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
                </div>
                <div className="enquiry-field">
                  <label>Message / Notes</label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any specific requirements or questions..."
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                  {submitting ? 'Submitting...' : '🚀 Submit Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
