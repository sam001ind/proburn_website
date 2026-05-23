import { Check } from 'lucide-react';
import './Pricing.css';

const plans = [
  {
    name: 'Basic',
    price: '$49',
    period: '/month',
    features: ['Access to gym floor', 'Locker room access', 'Free weights area', '1 group class/month'],
    recommended: false
  },
  {
    name: 'Pro',
    price: '$89',
    period: '/month',
    features: ['Unlimited gym access', 'All group classes', 'Sauna access', '1 PT session/month', 'Nutrition plan'],
    recommended: true
  },
  {
    name: 'Elite',
    price: '$149',
    period: '/month',
    features: ['24/7 Access', 'Unlimited group classes', 'Unlimited sauna access', '4 PT sessions/month', 'Custom meal prep', 'Priority booking'],
    recommended: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding">
      <div className="container">
        <h2 className="section-title">Membership <span className="text-accent">Plans</span></h2>
        <p className="section-subtitle">Choose the perfect tier for your fitness journey.</p>
        
        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <div key={idx} className={`glass-card pricing-card ${plan.recommended ? 'recommended' : ''}`}>
              {plan.recommended && <div className="recommended-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx}>
                    <Check size={20} className="text-accent" /> {feature}
                  </li>
                ))}
              </ul>
              <button className={`btn ${plan.recommended ? 'btn-primary' : 'btn-outline'} w-full`}>
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
