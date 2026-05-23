import { Shield, Zap, Users, Trophy } from 'lucide-react';
import './Features.css';

const features = [
  {
    icon: <Zap size={40} className="text-accent" />,
    title: 'High-Intensity Training',
    description: 'Push your limits with our scientifically designed HIIT and strength programs.'
  },
  {
    icon: <Shield size={40} className="text-accent" />,
    title: 'Premium Equipment',
    description: 'Train with the best. Our facility is equipped with state-of-the-art rogue gear.'
  },
  {
    icon: <Users size={40} className="text-accent" />,
    title: 'Elite Coaching',
    description: 'Learn from certified professionals dedicated to your personal growth.'
  },
  {
    icon: <Trophy size={40} className="text-accent" />,
    title: 'Proven Results',
    description: 'Join a community of champions. Your success is our ultimate goal.'
  }
];

export default function Features() {
  return (
    <section id="about" className="section-padding">
      <div className="container">
        <h2 className="section-title">Why Choose <span className="text-accent">Proburn</span></h2>
        <p className="section-subtitle">We don't just offer equipment; we provide an environment engineered for success and transformation.</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="glass-card feature-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
